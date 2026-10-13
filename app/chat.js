/* Community chat, hosted on a GitHub repository via giscus (GitHub Discussions).
   Fill CHAT_CONFIG after enabling Discussions on the repo and installing the giscus app (see github-repo/SETUP.md). */
const CHAT_CONFIG = {
  repo: "CusprAstro/CusprAstro.github.io",          // e.g. "yourname/halley-astro-chat"
  repoId: "R_kgDOVHNzkg",        // from https://giscus.app
  categoryId: "DIC_kwDOVHNzks4DIUBy",    // from https://giscus.app
  category: "General"
};
const CHAT_CHANNELS = [
  ["general", "💬", "General"], ["readings", "📖", "Readings"], ["transits", "🔭", "Transits & Forecasts"],
  ["beginners", "🌱", "Beginners"], ["twins", "👯", "Chart Twins"]
];
let chatChannel = "general";

function chatShell() {
  const ok = CHAT_CONFIG.repo && CHAT_CONFIG.repoId && CHAT_CONFIG.categoryId;
  const tabs = CHAT_CHANNELS.map(([k, ic, t]) => `<button class="btn sm ${k === chatChannel ? "" : "ghost"}" data-chan="${k}">${ic} ${t}</button>`).join(" ");
  const url = ok ? `https://github.com/${CHAT_CONFIG.repo}/discussions` : "";
  const web = location.protocol.startsWith("http");
  let body;
  if (!ok) body = `<p>The community chat is not connected yet. It runs on GitHub Discussions in a repository, so there is no server to maintain. Setup takes about five minutes: see <b>github-repo/SETUP.md</b> in the project folder, then paste the repo and category IDs into <code>chat.js</code>.</p>`;
  else if (!web) body = `<p>Chat opens in your browser because it uses GitHub sign-in.</p><div class="actions"><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Open the chat on GitHub</a></div>`;
  else body = `<div id="giscus-host"></div><p class="tiny mut">Threaded discussion rather than instant messaging. Posting requires a free GitHub account. <a href="${esc(url)}" target="_blank" rel="noopener">Open on GitHub</a></p>`;
  return `<div class="card fade"><h1>Astrology chat</h1><p class="mut">Talk with other people using Cuspr. Share readings, compare charts, ask questions. Be kind and do not post anyone's private birth data without permission.</p><div class="actions">${tabs}</div></div><div class="card fade">${body}</div>`;
}
function runChat() {
  $("#main").querySelectorAll("[data-chan]").forEach(b => b.onclick = () => { chatChannel = b.dataset.chan; render(); });
  const host = $("#giscus-host");
  if (!host) return;
  const s = document.createElement("script");
  s.src = "https://giscus.app/client.js";
  s.async = true; s.crossOrigin = "anonymous";
  const a = {
    "data-repo": CHAT_CONFIG.repo, "data-repo-id": CHAT_CONFIG.repoId, "data-category": CHAT_CONFIG.category,
    "data-category-id": CHAT_CONFIG.categoryId, "data-mapping": "specific", "data-term": "halley-astro-" + chatChannel,
    "data-reactions-enabled": "1", "data-emit-metadata": "0", "data-input-position": "top", "data-theme": "transparent_dark", "data-lang": "en"
  };
  for (const k in a) s.setAttribute(k, a[k]);
  host.appendChild(s);
}
