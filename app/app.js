"use strict";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const store = {
  get profiles() { try { return JSON.parse(localStorage.getItem("halley.profiles") || "[]"); } catch (e) { return []; } },
  set profiles(v) { try { localStorage.setItem("halley.profiles", JSON.stringify(v)); } catch (e) {} },
  get active() { try { return localStorage.getItem("halley.active"); } catch (e) { return null; } },
  set active(v) { try { localStorage.setItem("halley.active", v); } catch (e) {} },
};
const EXAMPLE = {name: "Example (Hinsdale, IL)", y: 1986, mo: 4, d: 22, h: 1, mi: 9, place: "Hinsdale, Illinois, United States", lat: 41.8008, lon: -87.937, tz: "America/Chicago"};
const VIEWS = [["home", "🪐", "Birth Data"], ["chart", "🌌", "Chart"], ["reading", "📖", "Reading"], ["forecast", "🔭", "Forecast"], ["twins", "👯", "Chart Twins"], ["sources", "⭐", "Astrologers & Sites"], ["news", "📰", "Astrology News"], ["chat", "💬", "Chat"], ["plans", "💎", "Plans"], ["about", "ℹ️", "Method"]];
const HUES = [["#4a7bff", "#a05cff"], ["#ff7a59", "#ffb347"], ["#18b89a", "#4ad0ff"], ["#e0529c", "#8e5cff"], ["#7ac74f", "#2fb5a6"]];
let view = "home", chart = null, prof = null, fcCache = {}, srcTab = "sites", srcQuery = "";

const to24 = (h, ap) => { h = Math.min(12, Math.max(1, +h || 12)) % 12; return ap === "PM" ? h + 12 : h; };
const fmt12 = (h, mi) => `${h % 12 || 12}:${String(mi).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
function activeProfile() { const l = store.profiles; return l.find(p => p.id === store.active) || null; }
function computeChart(p) {
  const h = p.unknownTime ? 12 : p.h, mi = p.unknownTime ? 0 : p.mi;
  return buildChart(localToUtc(p.y, p.mo, p.d, h, mi, p.tz), p.lat, p.lon);
}
function setProfile(p) {
  prof = p; fcCache = {};
  chart = p ? computeChart(p) : null;
  if (p) store.active = p.id;
  header();
}
function header() {
  $("#whoav").textContent = prof ? prof.name.trim().charAt(0).toUpperCase() || "?" : "?";
  $("#whoname").textContent = prof ? prof.name : "No profile";
}
function nav() {
  $("#nav").innerHTML = VIEWS.map(([k, ic, t]) => `<div class="nav ${view === k ? "on" : ""}" data-v="${k}"><i>${ic}</i><span>${t}</span></div>`).join("");
  $("#nav").querySelectorAll(".nav").forEach(n => n.onclick = () => go(n.dataset.v));
}
function go(v) { view = v; nav(); render(); window.scrollTo({top: 0, behavior: "smooth"}); }
function needChart() {
  return `<div class="card fade"><h2>Create a profile first</h2><p>Enter birth data to unlock this panel.</p><div class="actions"><button class="btn" onclick="go('home')">Go to Birth Data</button></div></div>`;
}
function render() {
  const m = $("#main");
  if (view === "home") m.innerHTML = homeView();
  else if (view === "sources") m.innerHTML = sourcesView();
  else if (view === "about") m.innerHTML = aboutView();
  else if (view === "plans") m.innerHTML = plansView();
  else if (view === "news") { m.innerHTML = newsShell(); runNews(); }
  else if (view === "chat") { m.innerHTML = chatShell(); runChat(); }
  else if (!chart) m.innerHTML = needChart();
  else if (view === "twins") m.innerHTML = twinsView();
  else if (view === "chart") m.innerHTML = chartView();
  else if (view === "reading") m.innerHTML = readingView();
  else if (view === "forecast") { m.innerHTML = forecastShell(); runForecast(); }
  bind(); bindPlans(); rail();
}

/* ---------- Birth data ---------- */
function homeView() {
  const ps = store.profiles;
  const profs = ps.map((p, i) => {
    const [a, b] = HUES[i % HUES.length];
    return `<div class="prof ${prof && p.id === prof.id ? "on" : ""}" data-id="${p.id}"><div class="big" style="background:linear-gradient(135deg,${a},${b})">${esc(p.name.trim().charAt(0).toUpperCase() || "?")}</div><div>${esc(p.name)}</div><small>${p.mo}/${p.d}/${p.y}</small><span class="x" data-del="${p.id}">remove</span></div>`;
  }).join("");
  return `<div class="card hero fade"><h1>Your sky, calculated.</h1><p>Enter a birth date, time and place to see a natal chart, a written personality reading, and a forecast for the months ahead. Positions are computed in your browser from a high-precision astronomical ephemeris. Nothing is uploaded.</p><div class="chips"><span class="chip g">Tropical zodiac</span><span class="chip g">Placidus houses</span><span class="chip g">Transits · Eclipses · Progressions</span></div></div>
  ${ps.length ? `<div class="card fade"><h2>Profiles</h2><div class="profiles">${profs}</div></div>` : ""}
  <div class="card fade"><h2>New chart</h2>
  <form id="f" autocomplete="off">
    <div class="row"><label>Name<input id="fn" placeholder="First name" required></label></div>
    <div class="row">
      <label>Month<select id="fmo">${["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => `<option value="${i + 1}">${m}</option>`).join("")}</select></label>
      <label>Day<input id="fd" type="number" min="1" max="31" required></label>
      <label>Year<input id="fy" type="number" min="1800" max="2100" required></label>
      <label>Hour (1-12)<input id="fh" type="number" min="1" max="12" value="12"></label>
      <label>Minute<input id="fmi" type="number" min="0" max="59" value="0"></label>
      <label>AM / PM<select id="fap"><option value="AM">AM</option><option value="PM" selected>PM</option></select></label>
    </div>
    <p class="tiny"><label style="flex-direction:row;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:13.5px"><input type="checkbox" id="fu" style="width:auto"> I don't know my birth time (Rising sign and houses will be approximate)</label></p>
    <div class="row"><label>Birth place<input id="fp" placeholder="City, region, country"></label><label style="max-width:150px">&nbsp;<button class="btn ghost" type="button" id="fgeo">Find place</button></label></div>
    <div class="place-list" id="places"></div>
    <div class="row">
      <label>Latitude<input id="fla" type="number" step="any" min="-90" max="90"></label>
      <label>Longitude (E +, W −)<input id="flo" type="number" step="any" min="-180" max="180"></label>
      <label>Time zone (IANA)<input id="ftz" placeholder="America/Chicago"></label>
    </div>
    <p class="tiny">Time zone and daylight-saving rules for the birth date are applied automatically. You can type coordinates manually if you are offline.</p>
    <div class="msg" id="fmsg"></div>
    <div class="actions"><button class="btn" type="submit">Calculate my chart ✨</button><button class="btn ghost" type="button" id="fex">Load example</button></div>
  </form></div>`;
}
function bindHome() {
  const f = $("#f"); if (!f) return;
  let found = null;
  const msg = (t, e) => { const m = $("#fmsg"); m.textContent = t; m.className = "msg" + (e ? " err" : ""); };
  const fill = p => { $("#fn").value = p.name; $("#fmo").value = p.mo; $("#fd").value = p.d; $("#fy").value = p.y; $("#fh").value = p.h % 12 || 12; $("#fap").value = p.h < 12 ? "AM" : "PM"; $("#fmi").value = p.mi; $("#fp").value = p.place; $("#fla").value = p.lat; $("#flo").value = p.lon; $("#ftz").value = p.tz; };
  $("#fex").onclick = () => fill(EXAMPLE);
  $("#fgeo").onclick = async () => {
    const q = $("#fp").value.trim(); if (!q) return msg("Type a city first.", true);
    msg("Searching…");
    try {
      const r = await fetch("https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&name=" + encodeURIComponent(q.split(",")[0]));
      const j = await r.json();
      if (!j.results || !j.results.length) return msg("No match found. Enter latitude, longitude and time zone manually.", true);
      $("#places").innerHTML = j.results.map((x, i) => `<div class="place" data-i="${i}">${esc([x.name, x.admin1, x.country].filter(Boolean).join(", "))} <span class="mut">(${x.latitude.toFixed(2)}, ${x.longitude.toFixed(2)} · ${esc(x.timezone || "")})</span></div>`).join("");
      $("#places").querySelectorAll(".place").forEach(el => el.onclick = () => {
        const x = j.results[+el.dataset.i]; found = x;
        $("#fp").value = [x.name, x.admin1, x.country].filter(Boolean).join(", ");
        $("#fla").value = x.latitude; $("#flo").value = x.longitude; $("#ftz").value = x.timezone || "";
        $("#places").innerHTML = ""; msg("Place selected.");
      });
      msg("Choose a match below.");
    } catch (e) { msg("Could not reach the place search (offline?). Enter coordinates and time zone manually.", true); }
  };
  f.onsubmit = ev => {
    ev.preventDefault();
    const p = {id: "p" + Date.now(), name: $("#fn").value.trim() || "Me", y: +$("#fy").value, mo: +$("#fmo").value, d: +$("#fd").value, h: to24($("#fh").value, $("#fap").value), mi: +$("#fmi").value || 0, place: $("#fp").value.trim(), lat: parseFloat($("#fla").value), lon: parseFloat($("#flo").value), tz: $("#ftz").value.trim(), unknownTime: $("#fu").checked};
    p.m = p.mo;
    if (!(p.y && p.d)) return msg("Please enter a valid date.", true);
    if (isNaN(p.lat) || isNaN(p.lon)) return msg("Please choose a place or enter latitude and longitude.", true);
    try { new Intl.DateTimeFormat("en-US", {timeZone: p.tz}); } catch (e) { return msg("Time zone not recognised. Use a name like America/Chicago or Europe/London.", true); }
    const test = new Date(Date.UTC(p.y, p.mo - 1, p.d));
    if (test.getUTCMonth() !== p.mo - 1) return msg("That date does not exist.", true);
    if (store.profiles.length >= tier().profiles) return msg(`Your ${tier().name} plan allows ${tier().profiles} saved profiles. Remove one or see Plans.`, true);
    const l = store.profiles; l.push(p); store.profiles = l;
    setProfile(p); go("chart");
  };
  document.querySelectorAll(".prof").forEach(el => el.onclick = e => {
    if (e.target.dataset.del) return;
    const p = store.profiles.find(x => x.id === el.dataset.id); setProfile(p); go("chart");
  });
  document.querySelectorAll("[data-del]").forEach(el => el.onclick = e => {
    e.stopPropagation(); const id = el.dataset.del;
    store.profiles = store.profiles.filter(x => x.id !== id);
    if (prof && prof.id === id) { prof = null; chart = null; header(); }
    render();
  });
}

/* ---------- Wheel ---------- */
function wheelSVG(c, size = 720) {
  const cx = size / 2, R = size / 2 - 6, Rz = R * .86, Rh = R * .70, Rp = R * .58, Rin = R * .38;
  const ang = lon => rad(180 + (lon - c.asc));
  const pt = (r, lon) => [cx + r * Math.cos(ang(lon)), cx - r * Math.sin(ang(lon))];
  const L = (r1, r2, lon, st, w = 1) => { const a = pt(r1, lon), b = pt(r2, lon); return `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${st}" stroke-width="${w}"/>`; };
  const ELC = ["#ff8a6b", "#8fe3b4", "#ffe38a", "#7fb4ff"];
  let s = `<svg class="wheel" id="wheel" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" font-family="Segoe UI Symbol,Apple Symbols,Noto Sans Symbols,sans-serif"><defs><radialGradient id="wg"><stop offset="0" stop-color="#121a52"/><stop offset="1" stop-color="#070b24"/></radialGradient></defs><rect width="${size}" height="${size}" fill="url(#wg)"/>`;
  s += `<circle cx="${cx}" cy="${cx}" r="${R}" fill="none" stroke="#8ea2ff" stroke-opacity=".5" stroke-width="1.5"/><circle cx="${cx}" cy="${cx}" r="${Rz}" fill="none" stroke="#8ea2ff" stroke-opacity=".5"/><circle cx="${cx}" cy="${cx}" r="${Rh}" fill="none" stroke="#8ea2ff" stroke-opacity=".35"/><circle cx="${cx}" cy="${cx}" r="${Rin}" fill="none" stroke="#8ea2ff" stroke-opacity=".5"/>`;
  for (let i = 0; i < 12; i++) {
    const a0 = i * 30; s += L(R, Rz, a0, "#8ea2ff", 1);
    const m = pt((R + Rz) / 2, a0 + 15);
    s += `<text x="${m[0].toFixed(1)}" y="${m[1].toFixed(1)}" fill="${ELC[i % 4]}" font-size="${size * .036}" text-anchor="middle" dominant-baseline="central">${SIGN_GLYPH[i]}</text>`;
    for (let t = 5; t < 30; t += 5) s += L(Rz, Rz - (t % 10 === 0 ? 5 : 3), a0 + t, "#8ea2ff", .6);
  }
  c.cusps.forEach((cu, i) => {
    const major = i % 3 === 0;
    s += L(major ? R : Rz, Rin, cu, major ? "#ffd58a" : "#8ea2ff", major ? 1.8 : .8);
    const m = pt((Rh + Rin) / 2 + 12, cu + (((c.cusps[(i + 1) % 12] - cu) + 360) % 360) / 2);
    s += `<text x="${m[0].toFixed(1)}" y="${m[1].toFixed(1)}" fill="#8f9bd0" font-size="${size * .02}" text-anchor="middle" dominant-baseline="central">${i + 1}</text>`;
  });
  const labels = [["Asc", c.asc], ["MC", c.mc], ["Dsc", c.asc + 180], ["IC", c.mc + 180]];
  for (const [t, l] of labels) { const p = pt(R + 0, l), q = pt(Rin, l); s += `<text x="${(pt(R * .975, l)[0]).toFixed(1)}" y="${(pt(R * .975, l)[1]).toFixed(1)}" fill="#ffd58a" font-size="${size * .02}" font-weight="700" text-anchor="middle" dominant-baseline="central" opacity="0">${t}</text>`; }
  const tone = {easy: "#6fe0a4", hard: "#ff7f92", neutral: "#ffd58a"};
  for (const a of c.aspects) {
    if (a.orb > 6) continue;
    const p = pt(Rin - 2, c.points[a.a]), q = pt(Rin - 2, c.points[a.b]);
    s += `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="${tone[a.asp.tone]}" stroke-opacity="${(0.75 - a.orb / 12).toFixed(2)}" stroke-width="1.1"/>`;
  }
  const items = ORDER.map(k => ({k, lon: c.lonOf[k], d: c.lonOf[k]})).sort((a, b) => a.lon - b.lon);
  for (let pass = 0; pass < 40; pass++) for (let i = 0; i < items.length; i++) {
    const a = items[i], b = items[(i + 1) % items.length];
    let gap = norm(b.d - a.d); if (items.length > 1 && i === items.length - 1) gap = norm(b.d - a.d);
    if (gap < 8) { const push = (8 - gap) / 2; a.d -= push; b.d += push; }
  }
  for (const it of items) {
    const p = pt(Rp, it.d), t0 = pt(Rh, it.lon), t1 = pt(Rh - 6, it.lon), lp = pt(Rp - R * .075, it.d);
    s += `<line x1="${t0[0].toFixed(1)}" y1="${t0[1].toFixed(1)}" x2="${t1[0].toFixed(1)}" y2="${t1[1].toFixed(1)}" stroke="#ffd58a" stroke-width="1.2"/>`;
    s += `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" fill="#fff" font-size="${size * .042}" text-anchor="middle" dominant-baseline="central">${GLYPH[it.k]}</text>`;
    s += `<text x="${lp[0].toFixed(1)}" y="${lp[1].toFixed(1)}" fill="#aab6ee" font-size="${size * .017}" text-anchor="middle" dominant-baseline="central">${Math.floor(norm(it.lon) % 30)}°${c.rx[it.k] ? "℞" : ""}</text>`;
  }
  for (const [t, l] of [["ASC", c.asc], ["MC", c.mc]]) {
    const p = pt(R + 0, l), o = pt(R - 14, l);
    s += `<text x="${o[0].toFixed(1)}" y="${o[1].toFixed(1)}" fill="#ffd58a" font-size="${size * .02}" font-weight="700" text-anchor="middle" dominant-baseline="central">${t}</text>`;
  }
  return s + "</svg>";
}
function chartView() {
  const c = chart, p = prof;
  const rows = ORDER.map(k => `<tr><td class="gl">${GLYPH[k]}</td><td>${k === "Node" ? "North Node" : k}</td><td>${fmtLon(c.lonOf[k])}${c.rx[k] ? " ℞" : ""}</td><td>${c.houses[k]}</td></tr>`).join("") +
    `<tr><td class="gl">Asc</td><td>Ascendant</td><td>${fmtLon(c.asc)}</td><td>1</td></tr><tr><td class="gl">MC</td><td>Midheaven</td><td>${fmtLon(c.mc)}</td><td>10</td></tr>`;
  const asp = c.aspects.slice(0, 18).map(a => `<tr><td>${GLYPH[a.a] || a.a} ${a.a}</td><td class="${a.asp.tone}">${a.asp.g} ${a.asp.name}</td><td>${GLYPH[a.b] || a.b} ${a.b}</td><td>${a.orb.toFixed(1)}°</td></tr>`).join("");
  const cusps = c.cusps.map((x, i) => `<tr><td>${i + 1}</td><td>${fmtLon(x)}</td></tr>`).join("");
  const dt = p.unknownTime ? "time unknown (12:00 PM used)" : fmt12(p.h, p.mi);
  return `<div class="card fade"><h1>${esc(p.name)}'s chart</h1><p class="mut">${p.mo}/${p.d}/${p.y} · ${dt} · ${esc(p.place || p.lat.toFixed(2) + ", " + p.lon.toFixed(2))} · ${esc(p.tz)} · ${c.houseSystem}</p>
  <div class="chips"><span class="chip g">☉ ${signOf(c.lonOf.Sun)}</span><span class="chip g">☽ ${signOf(c.lonOf.Moon)}</span><span class="chip g">Asc ${signOf(c.asc)}</span><span class="chip">MC ${signOf(c.mc)}</span></div>
  ${p.unknownTime ? `<p class="msg">Birth time unknown: the Moon, Ascendant, Midheaven and houses may be off. Treat them as approximate.</p>` : ""}
  <div class="actions"><button class="btn sm" id="dlpng">Download PNG</button><button class="btn sm ghost" id="dlsvg">Download SVG</button><button class="btn sm ghost" onclick="window.print()">Print / Save PDF</button></div></div>
  <div class="wheelwrap fade"><div class="card">${wheelSVG(c)}</div><div class="card"><h2>Placements</h2><table><tr><th></th><th>Body</th><th>Position</th><th>House</th></tr>${rows}</table></div></div>
  <div class="wheelwrap fade"><div class="card"><h2>Aspects</h2><table><tr><th>Body</th><th>Aspect</th><th>Body</th><th>Orb</th></tr>${asp}</table></div><div class="card"><h2>House cusps</h2><table><tr><th>House</th><th>Cusp</th></tr>${cusps}</table></div></div>`;
}
function downloadBlob(blob, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
function bindChart() {
  const png = $("#dlpng"); if (!png) return;
  const svg = () => new XMLSerializer().serializeToString($("#wheel"));
  $("#dlsvg").onclick = () => downloadBlob(new Blob([svg()], {type: "image/svg+xml"}), `${prof.name}_chart.svg`);
  png.onclick = () => {
    const img = new Image();
    img.onload = () => { const cv = document.createElement("canvas"); cv.width = cv.height = 1600; const x = cv.getContext("2d"); x.drawImage(img, 0, 0, 1600, 1600); cv.toBlob(b => downloadBlob(b, `${prof.name}_chart.png`)); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg());
  };
}

/* ---------- Reading ---------- */
function readingView() {
  const all = natalReading(chart), secs = all.slice(0, tier().readingSections), locked = all.length > secs.length;
  const toc = secs.map((s, i) => `<span class="chip" style="cursor:pointer" onclick="document.getElementById('s${i}').scrollIntoView({behavior:'smooth',block:'start'})">${esc(s.title)}</span>`).join("");
  return `<div class="card fade"><h1>Natal reading for ${esc(prof.name)}</h1><div class="chips">${toc}</div>  <div class="actions">${printBtn()}</div></div>` +
      (locked ? lockCard(`${all.length - secs.length} more reading sections`, "supporter") : "") + secs.map((s, i) => `<div class="card fade" id="s${i}"><h2>${esc(s.title)}</h2>${s.paras.map(t => `<p>${esc(t)}</p>`).join("")}</div>`).join("");
}

/* ---------- Forecast ---------- */
let fcMonths = 6, fcStart = new Date().toISOString().slice(0, 10);
function forecastShell() {
  return `<div class="card fade"><h1>Forecast</h1><p class="mut">Transits to your natal chart, stations, ingresses, lunations and eclipses.</p>
  <div class="row" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end"><label>Start date<input type="date" id="fs" value="${fcStart}"></label><label>Length<select id="fm">${[3, 6, 12].filter(m => m <= tier().forecastMonths).map(m => `<option value="${m}" ${m === fcMonths ? "selected" : ""}>${m} months</option>`).join("")}</select></label><button class="btn sm" id="fgo">Update</button>${printBtn()}</div>${tier().forecastMonths < 12 ? `<p class="tiny mut">Your plan includes forecasts up to ${tier().forecastMonths} months. <a href="#" onclick="go('plans');return false">See plans</a></p>` : ""}</div><div id="fcout"></div>`;
}
function runForecast() {
  const out = $("#fcout");
  const go = () => {
    fcStart = $("#fs").value || fcStart; fcMonths = Math.min(+$("#fm").value, tier().forecastMonths);
    const key = fcStart + "|" + fcMonths;
    out.innerHTML = `<div class="card"><span class="spin"></span>Calculating planetary motions for ${fcMonths} months…</div>`;
    setTimeout(() => {
      try {
        if (!fcCache[key]) {
          const start = new Date(fcStart + "T12:00:00Z");
          const ev = scanForecast(chart, start, Math.round(fcMonths * 30.5));
          fcCache[key] = forecastReading(chart, start, fcMonths, ev);
        }
        out.innerHTML = forecastHtml(fcCache[key]);
      } catch (e) { out.innerHTML = `<div class="card"><p class="msg err">Forecast failed: ${esc(e.message)}</p></div>`; }
    }, 40);
  };
  $("#fgo").onclick = go; go();
}
function forecastHtml(f) {
  const cur = f.current.map(t => `<p>${esc(t)}</p>`).join("");
  const th = f.themes.map(t => `<p>${esc(t)}</p>`).join("");
  const pr = `<p class="mut">Secondary progressions, age ${f.progressed.age.toFixed(1)}</p>` + f.progressed.items.map(t => `<p>${esc(t)}</p>`).join("");
  const months = f.months.map(m => `<div class="card fade"><div class="month"><h2>${esc(m.month)}</h2></div>${m.items.sort((a, b) => new Date(a.date) - new Date(b.date)).map(i => `<div class="ev"><b>${esc(i.date)}</b><span>${esc(i.text)}</span></div>`).join("")}</div>`).join("");
  return `<div class="card fade"><h2>Where the slow planets are now</h2>${cur}</div><div class="card fade"><h2>Major themes</h2>${th}</div><div class="card fade"><h2>Progressed chart</h2>${pr}</div>${months}`;
}

/* ---------- Chart twins ---------- */
function miniWheel(c, size = 120) {
  const cx = size / 2, R = cx - 3, ang = l => rad(180 + (l - c.asc)), pt = (r, l) => [cx + r * Math.cos(ang(l)), cx - r * Math.sin(ang(l))];
  let s = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${cx}" cy="${cx}" r="${R}" fill="#0b1032" stroke="#8ea2ff" stroke-opacity=".5"/><circle cx="${cx}" cy="${cx}" r="${R * .75}" fill="none" stroke="#8ea2ff" stroke-opacity=".25"/>`;
  for (let i = 0; i < 12; i++) { const a = pt(R, i * 30), b = pt(R * .75, i * 30); s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#8ea2ff" stroke-opacity=".3"/>`; }
  for (const k of ORDER) { const p = pt(R * .55, c.lonOf[k]); s += `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" fill="#fff" font-size="11" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI Symbol,sans-serif">${GLYPH[k]}</text>`; }
  return s + "</svg>";
}
function twinsView() {
  const known = !prof.unknownTime, res = closestFamous(chart, known, tier().twins);
  const cards = res.map((r, i) => `<div class="card lift fade"><div style="display:flex;gap:16px;align-items:center"><div>${miniWheel(r.chart)}</div><div style="min-width:0"><div class="tier" style="font-size:11px;letter-spacing:1px;color:var(--gold);font-weight:700;text-transform:uppercase">#${i + 1} · ${r.pct}% resemblance · ${esc(r.f[2])}</div><h2 style="margin:2px 0">${esc(r.f[0])}</h2><div class="mut tiny">${esc(r.f[1])} · born ${esc(r.f[3])} · ${esc(r.f[4])}</div></div></div>
  <div class="chips"><span class="chip g">☉ ${signOf(r.chart.lonOf.Sun)}</span><span class="chip g">☽ ${signOf(r.chart.lonOf.Moon)}</span>${r.approx ? '<span class="chip">birth time unknown</span>' : `<span class="chip g">Asc ${signOf(r.chart.asc)}</span>`}</div>
  <p>${r.why.length ? "What you share: " + esc(r.why.join("; ")) + "." : "Only loose similarities."}</p>
  <div class="actions"><a class="btn sm ghost" href="${esc(famousDbLink(r.f[0]))}" target="_blank" rel="noopener">Astro-Databank</a></div></div>`).join("");
  return `<div class="card fade"><h1>Chart twins</h1><p class="mut">Closest matches to ${esc(prof.name)}'s chart among ${FAMOUS_DB.length} well-known (and infamous) people. Scoring weights Sun, Moon and Rising signs most, then the personal planets, tight degree matches, element balance and shared aspects.${known ? "" : " Rising sign and Midheaven are skipped because your birth time is unknown."}</p>
  <p class="tiny">A resemblance is a symbolic similarity, not a prediction that you share someone's fate. Most entries (those marked "birth time unknown") are computed for local noon, so their Moon is approximate and Rising/Midheaven are not compared. Birth dates and places come from Wikidata (CC0). Many Astro-Databank times are disputed, and people with similar charts live very different lives.</p></div><div class="grid2">${cards}</div>${tier().twins < 25 ? lockCard("More chart twins", tier().twins < 10 ? "supporter" : "pro") : ""}`;
}

/* ---------- News ---------- */
function newsShell() {
  return `<div class="card fade"><h1>Astrology News</h1><p class="mut">Latest articles and episodes from established astrology publishers, fetched live and refreshed hourly. Each link opens the publisher's own site.</p><div class="actions"><button class="btn sm" id="nrefresh">Refresh</button></div></div><div id="nout"></div>`;
}
function runNews() {
  const out = $("#nout");
  const go = async force => {
    out.innerHTML = `<div class="card"><span class="spin"></span>Loading the latest articles…</div>`;
    const n = await loadNews(force);
    if (!n.items.length) { out.innerHTML = `<div class="card"><p class="msg err">Couldn't load feeds (offline?). Visit the publishers directly:</p><div class="chips">${FEEDS.map(f => `<a class="chip" href="${esc(f.site)}" target="_blank" rel="noopener">${esc(f.name)}</a>`).join("")}</div></div>`; return; }
    const safeImg = u => /^https:\/\//.test(u || "") ? u : "";
    out.innerHTML = (n.stale ? `<p class="msg">Showing saved articles (offline).</p>` : "") +
      `<div class="grid2">${n.items.slice(0, 36).map(a => `<a class="card lift news fade" href="${esc(a.link)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${safeImg(a.img) ? `<img src="${esc(safeImg(a.img))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}<div class="tier" style="font-size:11px;letter-spacing:1px;color:var(--gold);font-weight:700;text-transform:uppercase">${esc(a.source)}${a.date ? " · " + new Date(a.date).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"}) : ""}</div><h3 style="color:var(--txt);margin:4px 0 6px">${esc(a.title)}</h3><p class="tiny">${esc(a.summary)}</p></a>`).join("")}</div>` +
      (n.failed && n.failed.length ? `<p class="tiny">Unavailable right now: ${esc(n.failed.join(", "))}.</p>` : "");
  };
  $("#nrefresh").onclick = () => go(true); go(false);
}

/* ---------- Sources ---------- */
function sourcesView() {
  const R = REFERENCE, tabs = [["sites", "Sites & apps"], ["astrologers", "Astrologers"], ["orgs", "Schools & organizations"], ["classics", "Classic texts"]];
  const q = srcQuery.toLowerCase();
  const list = (R[srcTab] || []).filter(x => !q || (x.name + x.blurb + x.tier + x.tags.join(" ")).toLowerCase().includes(q));
  return `<div class="card fade"><h1>Astrologers & Sites</h1><p class="mut">${esc(R.honest)}</p><div class="tabs">${tabs.map(([k, t]) => `<span class="tab ${srcTab === k ? "on" : ""}" data-tab="${k}">${t}</span>`).join("")}</div></div>
  <div class="grid fade">${list.map(x => `<a class="card lift ref" href="${esc(x.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><div class="tier">${esc(x.tier)}</div><h3>${esc(x.name)}</h3><p>${esc(x.blurb)}</p><div class="chips">${x.tags.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div></a>`).join("") || `<div class="card">No matches.</div>`}</div>`;
}
function aboutView() {
  return `<div class="card fade"><h1>Method</h1>
  <h3>Positions</h3><p>Planetary positions come from the open-source Astronomy Engine library (VSOP87 and related models), accurate to about an arcminute or better for the Sun through Pluto. The lunar node is the mean node.</p>
  <h3>Zodiac and houses</h3><p>Tropical zodiac and Placidus houses, the default in most Western astrology software. Above about 66° latitude Placidus is undefined, so whole-sign houses are used instead.</p>
  <h3>Time</h3><p>Local birth time is converted to UT using the IANA time zone database built into your browser, including historical daylight-saving rules.</p>
  <h3>Aspects</h3><p>Conjunction, sextile, square, trine and opposition with moderate orbs. Forecasts use transits from Jupiter to Pluto, Mars, and the lunar node to natal points, plus stations, sign changes, lunations, eclipses, and secondary progressions.</p>
  <h3>Interpretation</h3><p>Texts are written from common Western interpretive traditions (modern psychological and traditional). They are symbolic and general, and are not predictions of fact or advice.</p>
  <h3>Famous charts</h3><p>The Chart Twins database holds 1,000 well-known people: 54 curated entries with commonly cited birth times, and the rest ranked by Wikipedia page views, with birth dates and places from Wikidata (CC0). Entries without a known time are computed for local noon.</p>
  <h3>Privacy</h3><p>Profiles are stored only in this browser (localStorage). Place search sends only the city name to the Open-Meteo geocoding service; skip it by typing coordinates manually.</p></div>`;
}

/* ---------- Rail ---------- */
function rail() {
  let sky = "";
  try {
    const p = planetsAt(new Date());
    sky = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"].map(k => `<div class="mini"><span><span class="gl">${GLYPH[k]}</span> ${k}${p.rx[k] ? " ℞" : ""}</span><span class="mut">${fmtLon(p.lon[k])}</span></div>`).join("");
  } catch (e) {}
  const feat = REFERENCE.sites.slice(0, 4).map(s => `<div class="mini"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a><span class="tiny">${esc(s.tier)}</span></div>`).join("");
  $("#rail").innerHTML = `<div class="card"><h2>Sky right now</h2>${sky}</div><div class="card"><h2>Featured</h2>${feat}<div class="actions"><button class="btn sm ghost" onclick="go('sources')">See all</button></div></div>`;
}

function bind() {
  bindHome(); bindChart();
  document.querySelectorAll("[data-tab]").forEach(t => t.onclick = () => { srcTab = t.dataset.tab; render(); });
}

/* ---------- Starfield ---------- */
function stars() {
  const cv = $("#stars"), x = cv.getContext("2d"); let S = [];
  const size = () => { cv.width = innerWidth; cv.height = innerHeight; S = Array.from({length: Math.round(innerWidth * innerHeight / 7000)}, () => ({x: Math.random() * cv.width, y: Math.random() * cv.height, r: Math.random() * 1.3 + .2, p: Math.random() * 6.28, s: Math.random() * .02 + .005})); };
  size(); addEventListener("resize", size);
  const draw = () => { x.clearRect(0, 0, cv.width, cv.height); for (const s of S) { s.p += s.s; x.globalAlpha = .35 + .5 * Math.abs(Math.sin(s.p)); x.fillStyle = "#fff"; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 6.283); x.fill(); } requestAnimationFrame(draw); };
  matchMedia("(prefers-reduced-motion: reduce)").matches ? (S.forEach(s => { x.fillStyle = "#fff"; x.globalAlpha = .6; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 6.283); x.fill(); })) : draw();
}

$("#q").addEventListener("keydown", e => { if (e.key === "Enter") { srcQuery = e.target.value.trim(); go("sources"); } });
$("#who").onclick = () => go("home");
stars();
const ap = activeProfile(); if (ap) { setProfile(ap); view = "chart"; }
nav(); render();
loadLicense().then(() => { nav(); render(); });
if (/^#demo(-\w+)?$/.test(location.hash)) {
  const v = location.hash.split("-")[1] || "chart";
  setProfile({...EXAMPLE, id: "demo", mo: 4, m: 4}); view = v; nav(); render();
}