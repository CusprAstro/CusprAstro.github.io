const FEEDS = [
  {name: "The Astrology Podcast", url: "https://theastrologypodcast.com/feed/", site: "https://theastrologypodcast.com"},
  {name: "Cafe Astrology", url: "https://cafeastrology.com/feed/", site: "https://cafeastrology.com"},
  {name: "Astrological Association of GB", url: "https://www.astrologicalassociation.com/feed/", site: "https://www.astrologicalassociation.com"},
  {name: "Kepler College", url: "https://www.keplercollege.org/feed/", site: "https://www.keplercollege.org"},
  {name: "Astrologers.com", url: "https://www.astrologers.com/feed/", site: "https://www.astrologers.com"},
  {name: "Astrology King", url: "https://astrologyking.com/feed/", site: "https://astrologyking.com"},
];
const strip = h => (new DOMParser().parseFromString(h || "", "text/html").body.textContent || "").replace(/\s+/g, " ").trim();

function parseRss(xml, feed) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  return [...doc.querySelectorAll("item")].slice(0, 8).map(it => {
    const g = t => { const e = it.getElementsByTagName(t)[0]; return e ? e.textContent : ""; };
    const enc = it.getElementsByTagName("enclosure")[0], media = it.getElementsByTagName("media:content")[0];
    const html = g("content:encoded") || g("description");
    const im = (html.match(/<img[^>]+src=["']([^"']+)/i) || [])[1];
    return {source: feed.name, title: strip(g("title")), link: g("link").trim(), date: new Date(g("pubDate")).getTime() || 0,
      summary: strip(g("description")).slice(0, 240), img: im || (media && media.getAttribute("url")) || (enc && /image/.test(enc.getAttribute("type") || "") ? enc.getAttribute("url") : "")};
  }).filter(x => x.title && x.link);
}
async function loadFeed(feed) {
  if (window.cusprNative) return parseRss(await window.cusprNative.fetchText(feed.url), feed);
  const r = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(feed.url));
  const j = await r.json();
  if (j.status !== "ok") throw new Error("feed unavailable");
  return j.items.slice(0, 8).map(it => ({source: feed.name, title: strip(it.title), link: it.link, date: Date.parse(it.pubDate.replace(" ", "T") + "Z") || 0,
    summary: strip(it.description).slice(0, 240), img: it.thumbnail || (it.enclosure && it.enclosure.link) || ((it.content || "").match(/<img[^>]+src=["']([^"']+)/i) || [])[1] || ""}));
}
async function loadNews(force) {
  const KEY = "cuspr.news";
  try { const c = JSON.parse(localStorage.getItem(KEY) || "null"); if (!force && c && Date.now() - c.t < 3600e3) return c; } catch (e) {}
  const res = await Promise.allSettled(FEEDS.map(loadFeed));
  const per = {}, items = res.flatMap(r => r.status === "fulfilled" ? r.value : []).sort((a, b) => b.date - a.date).filter(x => (per[x.source] = (per[x.source] || 0) + 1) <= 4);
  const failed = FEEDS.filter((f, i) => res[i].status !== "fulfilled").map(f => f.name);
  const out = {t: Date.now(), items, failed};
  if (items.length) try { localStorage.setItem(KEY, JSON.stringify(out)); } catch (e) {}
  else { try { const c = JSON.parse(localStorage.getItem(KEY) || "null"); if (c) return {...c, stale: true}; } catch (e) {} }
  return out;
}
