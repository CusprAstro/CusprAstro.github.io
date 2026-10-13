/* Plans and licensing: Free / Supporter / Pro.
   Licenses are offline keys signed with ECDSA P-256 (see tools/keygen.js). Only the public key lives in the app.
   This is honor-system protection suited to a small indie app: a determined user can bypass any client-side check. */
const LICENSE_CONFIG = {
  paypalMe: "",                 // your PayPal.me handle, e.g. "YourName" -> https://paypal.me/YourName/5
  prices: {supporter: 5, pro: 15},
  currency: "USD",
  contact: "",                  // email address where buyers send their PayPal receipt to get a key
  otherMethods: [               // add any: {name, supporter: url, pro: url}; entries with no URLs are hidden
    {name: "Ko-fi / Buy Me a Coffee", supporter: "", pro: ""},
    {name: "Stripe / Gumroad / Lemon Squeezy", supporter: "", pro: ""},
    {name: "GitHub Sponsors", supporter: "", pro: ""}
  ],
  publicKey: {"kty": "EC", "x": "Ao6tAmZXO1d_QrzzoSFv5gkeBIIccmpoW-0IylrwcSw", "y": "sWFLD4J0YPCs-loVDM6VRxGB3-4JtgY7jyjp-El5hY0", "crv": "P-256"}
};
const BUILD_TIER = "";  // set by the build script for local test folders only; empty in public builds
const TIERS = {
  free:      {name: "Free",      readingSections: 3,   forecastMonths: 3,  twins: 3,  profiles: 2,   print: false},
  supporter: {name: "Supporter", readingSections: 999, forecastMonths: 6,  twins: 10, profiles: 10,  print: true},
  pro:       {name: "Pro",       readingSections: 999, forecastMonths: 12, twins: 25, profiles: 999, print: true}
};
const TIER_FEATURES = {
  free:      ["Birth chart wheel, houses and aspects", "First 3 reading sections", "3-month forecast", "Top 3 chart twins", "2 saved profiles", "News, astrologer guide and chat"],
  supporter: ["Everything in Free", "Complete natal reading", "6-month forecast", "Top 10 chart twins", "10 saved profiles", "Print / save as PDF", "Supports development"],
  pro:       ["Everything in Supporter", "12-month forecast", "Top 25 chart twins", "Unlimited profiles", "Priority for feature requests", "All future Pro features"]
};
let licenseInfo = {tier: "free", who: ""};
const tier = () => TIERS[BUILD_TIER || licenseInfo.tier] || TIERS.free;
const tierKey = () => BUILD_TIER || licenseInfo.tier;

const b64uToBytes = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
async function verifyLicense(key) {
  try {
    const [tag, payload, sig] = String(key).trim().split(".");
    if (tag !== "CUSPR1" || !payload || !sig) return null;
    const k = await crypto.subtle.importKey("jwk", LICENSE_CONFIG.publicKey, {name: "ECDSA", namedCurve: "P-256"}, false, ["verify"]);
    const ok = await crypto.subtle.verify({name: "ECDSA", hash: "SHA-256"}, k, b64uToBytes(sig), new TextEncoder().encode(payload));
    if (!ok) return null;
    const d = JSON.parse(new TextDecoder().decode(b64uToBytes(payload)));
    return TIERS[d.t] && d.t !== "free" ? {tier: d.t, who: String(d.n || "")} : null;
  } catch (e) { return null; }
}
async function loadLicense() {
  let k = ""; try { k = localStorage.getItem("cuspr.license") || ""; } catch (e) {}
  const r = k && await verifyLicense(k);
  licenseInfo = r || {tier: "free", who: ""};
  return licenseInfo;
}
async function activateLicense(key) {
  const r = await verifyLicense(key);
  if (!r) return false;
  try { localStorage.setItem("cuspr.license", key.trim()); } catch (e) {}
  licenseInfo = r;
  return true;
}
function deactivateLicense() { try { localStorage.removeItem("cuspr.license"); } catch (e) {} licenseInfo = {tier: "free", who: ""}; }

function buyLinks(t) {
  const L = LICENSE_CONFIG, amt = L.prices[t], out = [];
  if (L.paypalMe) out.push(`<a class="btn sm" href="https://paypal.me/${encodeURIComponent(L.paypalMe)}/${amt}${L.currency}" target="_blank" rel="noopener">Pay ${amt} ${L.currency} with PayPal</a>`);
  for (const m of L.otherMethods) if (m[t]) out.push(`<a class="btn sm ghost" href="${esc(m[t])}" target="_blank" rel="noopener">${esc(m.name)}</a>`);
  return out.length ? out.join(" ") : `<span class="tiny mut">Purchase links are not configured in this build yet.</span>`;
}
const printBtn = () => tier().print ? `<button class="btn sm ghost" onclick="window.print()">Print / Save PDF</button>` : `<button class="btn sm ghost" onclick="go('plans')">🔒 Print / Save PDF</button>`;
function lockCard(what, need) {
  return `<div class="card fade"><h2>🔒 ${esc(what)}</h2><p>This is part of the ${TIERS[need].name} plan.</p><div class="actions"><button class="btn sm" onclick="go('plans')">See plans</button></div></div>`;
}
function plansView() {
  const cur = tierKey(), L = LICENSE_CONFIG;
  const card = t => `<div class="card lift fade" style="${cur === t ? "outline:2px solid var(--gold)" : ""}"><div class="tier" style="font-size:11px;letter-spacing:1px;color:var(--gold);font-weight:700;text-transform:uppercase">${cur === t ? "Your plan" : "Plan"}</div>
    <h2>${TIERS[t].name}${t === "free" ? "" : ` · ${L.prices[t]} ${L.currency}`}</h2><ul>${TIER_FEATURES[t].map(f => `<li>${esc(f)}</li>`).join("")}</ul>
    ${t === "free" ? "" : `<div class="actions">${buyLinks(t)}</div>`}</div>`;
  const test = BUILD_TIER ? `<p class="msg">Test build: plan forced to ${TIERS[BUILD_TIER].name}. Licensing is bypassed in this folder.</p>` : "";
  return `<div class="card fade"><h1>Plans</h1><p class="mut">Cuspr is free to use. Supporter and Pro unlock more of the reading, longer forecasts and more twins. One-time payment, works offline.</p>${test}
  <p class="tiny">After paying, ${L.contact ? `email your receipt to <b>${esc(L.contact)}</b>` : "send your receipt to the developer"} and you will receive a license key. Paste it below.</p></div>
  <div class="grid2">${card("free")}${card("supporter")}${card("pro")}</div>
  <div class="card fade"><h2>Activate a license key</h2><p class="mut">Current plan: <b>${TIERS[cur].name}</b>${licenseInfo.who && !BUILD_TIER ? ` (licensed to ${esc(licenseInfo.who)})` : ""}</p>
  <div class="row"><label>License key<input id="lkey" placeholder="CUSPR1.…" autocomplete="off"></label></div>
  <div class="actions"><button class="btn sm" id="lact">Activate</button>${licenseInfo.tier !== "free" && !BUILD_TIER ? '<button class="btn sm ghost" id="lrem">Remove key</button>' : ""}</div><div class="msg" id="lmsg"></div></div>`;
}
function bindPlans() {
  const a = $("#lact"); if (!a) return;
  a.onclick = async () => {
    const m = $("#lmsg");
    if (!window.crypto || !crypto.subtle) { m.className = "msg err"; m.textContent = "This browser context cannot verify keys. Use the desktop app or the https site."; return; }
    if (await activateLicense($("#lkey").value)) { m.className = "msg"; m.textContent = "Unlocked: " + TIERS[licenseInfo.tier].name + ". Thank you!"; setTimeout(() => render(), 700); }
    else { m.className = "msg err"; m.textContent = "That key is not valid."; }
  };
  const r = $("#lrem"); if (r) r.onclick = () => { deactivateLicense(); render(); };
}
