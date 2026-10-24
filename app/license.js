/* Cuspr editions and entitlements.
   Complimentary CUSPR1 keys are verified locally with ECDSA P-256.
   Gumroad buyer keys are verified against Gumroad's official license API; product IDs are never treated as buyer keys. */
const LICENSE_CONFIG = {
  paypalMe: "lircin",
  prices: {supporter: 4.99, pro: 9.99},
  currency: "USD",
  gumroadProducts: {
    pro: "B2HpRnlL66EA931sJ9xOlg==",
    supporter: "S0wa78i_Tu7s5_A65WTrPg==",
  },
  storefrontUrls: {supporter: "", pro: ""},
  promoLinks: [],
  installLinks: [],
  publicKey: {"kty": "EC", "x": "Ao6tAmZXO1d_QrzzoSFv5gkeBIIccmpoW-0IylrwcSw", "y": "sWFLD4J0YPCs-loVDM6VRxGB3-4JtgY7jyjp-El5hY0", "crv": "P-256"},
};
const AFFILIATES = [
  {name: "AdGuard", url: "https://adguard.com/?aid=138471", text: "Block ads and trackers across browsers and apps."},
  {name: "AdGuard VPN", url: "https://adguard-vpn.com/?aid=138471", text: "Optional encrypted VPN service."},
  {name: "AdGuard DNS", url: "https://adguard-dns.io/?aid=138471", text: "Optional DNS-level filtering."},
];
const BUILD_EDITION = "free";
const BUILD_TIER = ""; // "pro" is allowed only in explicitly named local/test artifacts; public builds keep this empty.
const TIERS = {
  free: {name: "Free", readingSections: 3, forecastMonths: 3, twins: 3, profiles: 2, print: false, plannerDays: 7, plannerHistory: 0, ads: false},
  ads: {name: "Free with Ads", readingSections: 999, forecastMonths: 6, twins: 10, profiles: 10, print: true, plannerDays: 31, plannerHistory: 1, ads: true},
  supporter: {name: "Supporter", readingSections: 999, forecastMonths: 6, twins: 10, profiles: 10, print: true, plannerDays: 31, plannerHistory: 1, ads: false},
  pro: {name: "Pro", readingSections: 999, forecastMonths: 12, twins: 25, profiles: 999, print: true, plannerDays: 31, plannerHistory: 24, ads: false},
};
const TIER_FEATURES = {
  free: ["Birth chart wheel, houses and aspects", "7-day Cosmic Planner", "First 3 reading sections", "3-month forecast", "Top 3 chart twins", "2 saved profiles", "Ad-free"],
  ads: ["Supporter feature limits at no cost", "Full current-month Cosmic Planner", "Complete reading", "6-month forecast", "Top 10 chart twins", "Restrained sponsored cards"],
  supporter: ["Everything in Free with Ads", "No sponsored cards", "10 saved profiles", "Print / save as PDF", "$4.99 monthly membership"],
  pro: ["Everything in Supporter", "24 months of planner history", "12-month forecast", "Top 25 chart twins", "Unlimited profiles", "All future Pro features"],
};
const ENTITLEMENT_KEY = "cuspr.entitlement.v2";
const GUMROAD_RECHECK_MS = 7 * 86400000;
const OFFLINE_GRACE_MS = 14 * 86400000;
let licenseInfo = {tier: "free", source: "free", who: "", checkedAt: 0};

function adsOptIn() {
  try {
    const saved = localStorage.getItem("cuspr.ads-opt-in");
    return saved === "1" || (saved === null && BUILD_EDITION === "ads");
  } catch (e) { return BUILD_EDITION === "ads"; }
}
const tierKey = () => BUILD_TIER || (licenseInfo.tier !== "free" ? licenseInfo.tier : adsOptIn() ? "ads" : "free");
const tier = () => TIERS[tierKey()] || TIERS.free;
const b64uToBytes = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
const maskKey = key => key && key.length > 8 ? `${key.slice(0, 4)}…${key.slice(-4)}` : "hidden";

async function verifyLicense(key) {
  try {
    const [tag, payload, sig] = String(key).trim().split(".");
    if (tag !== "CUSPR1" || !payload || !sig) return null;
    const k = await crypto.subtle.importKey("jwk", LICENSE_CONFIG.publicKey, {name: "ECDSA", namedCurve: "P-256"}, false, ["verify"]);
    const ok = await crypto.subtle.verify({name: "ECDSA", hash: "SHA-256"}, k, b64uToBytes(sig), new TextEncoder().encode(payload));
    if (!ok) return null;
    const d = JSON.parse(new TextDecoder().decode(b64uToBytes(payload)));
    return ["supporter", "pro"].includes(d.t) ? {tier: d.t, source: "complimentary", who: String(d.n || ""), checkedAt: Date.now()} : null;
  } catch (e) { return null; }
}
function readEntitlement() {
  try { return JSON.parse(localStorage.getItem(ENTITLEMENT_KEY) || "null"); } catch (e) { return null; }
}
function saveEntitlement(data) {
  try { localStorage.setItem(ENTITLEMENT_KEY, JSON.stringify(data)); } catch (e) {}
}
function gumroadMembershipState(result) {
  const p = result && result.purchase;
  if (!result || !result.success || !p) return {active: false, reason: "not-confirmed"};
  if (p.refunded) return {active: false, reason: "refunded"};
  if (p.chargebacked) return {active: false, reason: "chargeback"};
  if (p.cancelled || p.subscription_cancelled_at || p.subscription_ended_at) return {active: false, reason: "cancelled"};
  return {active: true, reason: "active"};
}
async function gumroadRequest(productId, key) {
  if (window.halleyNative && window.halleyNative.verifyGumroad) return window.halleyNative.verifyGumroad({productId, licenseKey: key});
  const body = new URLSearchParams({product_id: productId, license_key: key, increment_uses_count: "false"});
  const r = await fetch("https://api.gumroad.com/v2/licenses/verify", {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body});
  if (!r.ok) throw new Error(`Gumroad verification returned HTTP ${r.status}`);
  return r.json();
}
async function verifyGumroadKey(key, requestedTier) {
  const productId = LICENSE_CONFIG.gumroadProducts[requestedTier];
  if (!productId || !key) return null;
  const result = await gumroadRequest(productId, key);
  const state = gumroadMembershipState(result);
  if (!state.active) return {inactive: true, reason: state.reason};
  if (result.purchase.product_id && result.purchase.product_id !== productId) return {inactive: true, reason: "wrong-product"};
  return {
    tier: requestedTier, source: "gumroad", who: String(result.purchase.email || ""),
    checkedAt: Date.now(), graceUntil: Date.now() + OFFLINE_GRACE_MS, productId, licenseKey: String(key).trim(),
    membership: true, status: "active",
  };
}
async function loadLicense() {
  let saved = readEntitlement();
  if (!saved) {
    try {
      const legacyKey = localStorage.getItem("cuspr.license");
      if (legacyKey) {
        const legacy = await verifyLicense(legacyKey);
        if (legacy) {
          saved = {...legacy, licenseKey: legacyKey};
          saveEntitlement(saved);
          localStorage.removeItem("cuspr.license");
        }
      }
    } catch (e) {}
  }
  if (!saved) return licenseInfo;
  if (saved.source === "complimentary" && saved.licenseKey) {
    const valid = await verifyLicense(saved.licenseKey);
    licenseInfo = valid || {tier: "free", source: "free", who: "", checkedAt: 0};
    if (!valid) localStorage.removeItem(ENTITLEMENT_KEY);
    return licenseInfo;
  }
  if (saved.source === "gumroad" && saved.licenseKey && saved.productId && ["supporter", "pro"].includes(saved.tier)) {
    if ((saved.graceUntil || 0) < Date.now()) {
      licenseInfo = {tier: "free", source: "free", who: "", checkedAt: 0, expired: true};
    } else licenseInfo = saved;
    if (Date.now() - (saved.checkedAt || 0) >= GUMROAD_RECHECK_MS) {
      try {
        const fresh = await verifyGumroadKey(saved.licenseKey, saved.tier);
        if (fresh && !fresh.inactive) { saveEntitlement(fresh); licenseInfo = fresh; }
        else { localStorage.removeItem(ENTITLEMENT_KEY); licenseInfo = {tier: "free", source: "free", who: "", checkedAt: 0, revokedReason: fresh && fresh.reason}; }
      } catch (e) {
        licenseInfo = (saved.graceUntil || 0) >= Date.now() ? {...saved, offline: true} : {tier: "free", source: "free", who: "", checkedAt: 0, expired: true};
      }
    }
  }
  return licenseInfo;
}
async function activateLicense(key, requestedTier) {
  const clean = String(key || "").trim();
  if (!clean) return {ok: false, message: "Enter the buyer key from your Gumroad receipt or a complimentary CUSPR1 key."};
  if (clean.startsWith("CUSPR1.")) {
    const r = await verifyLicense(clean);
    if (!r) return {ok: false, message: "That complimentary key is not valid."};
    const saved = {...r, licenseKey: clean};
    saveEntitlement(saved); licenseInfo = saved;
    return {ok: true, entitlement: saved};
  }
  try {
    const r = await verifyGumroadKey(clean, requestedTier);
    if (!r || r.inactive) return {ok: false, message: `Gumroad did not confirm an active ${TIERS[requestedTier].name} membership${r && r.reason ? ` (${r.reason})` : ""}.`};
    saveEntitlement(r); licenseInfo = r;
    return {ok: true, entitlement: r};
  } catch (e) {
    return {ok: false, message: `Could not reach Gumroad. Check your connection and try again. (${e.message})`};
  }
}
function deactivateLicense() {
  try { localStorage.removeItem(ENTITLEMENT_KEY); localStorage.removeItem("cuspr.license"); } catch (e) {}
  licenseInfo = {tier: "free", source: "free", who: "", checkedAt: 0};
}
function setAdsEdition(on) {
  try { localStorage.setItem("cuspr.ads-opt-in", on ? "1" : "0"); } catch (e) {}
}
function buyLinks(t) {
  const L = LICENSE_CONFIG, amt = L.prices[t], out = [];
  if (L.storefrontUrls[t]) out.push(`<a class="btn sm" href="${esc(L.storefrontUrls[t])}" target="_blank" rel="noopener noreferrer">Join on Gumroad · $${amt.toFixed(2)}/month</a>`);
  if (L.paypalMe) out.push(`<a class="btn sm ghost" href="https://paypal.me/${encodeURIComponent(L.paypalMe)}" target="_blank" rel="noopener noreferrer">One-time tip via PayPal</a>`);
  return out.join(" ") + (!L.storefrontUrls[t] ? `<span class="tiny mut">Gumroad storefront URL pending; the configured value is a product ID, not a checkout link.</span>` : "");
}
const printBtn = () => tier().print ? `<button class="btn sm ghost" onclick="window.print()">Print / Save PDF</button>` : `<button class="btn sm ghost" onclick="go('plans')">🔒 Print / Save PDF</button>`;
function lockCard(what, need) {
  return `<div class="card fade"><h2>🔒 ${esc(what)}</h2><p>This is part of the ${TIERS[need].name} edition.</p><div class="actions"><button class="btn sm" onclick="go('plans')">See editions</button></div></div>`;
}
function sponsoredPlacement(location) {
  if (!tier().ads || !["home", "plans", "news-end", "forecast-end"].includes(location)) return "";
  const item = AFFILIATES[Math.abs(location.split("").reduce((n, c) => n + c.charCodeAt(0), 0)) % AFFILIATES.length];
  return `<aside class="card sponsored fade" aria-label="Sponsored recommendation"><div class="sponsored-label">Sponsored · affiliate link</div><h3>${esc(item.name)}</h3><p>${esc(item.text)}</p><a class="btn sm ghost" href="${esc(item.url)}" target="_blank" rel="sponsored noopener noreferrer">Visit ${esc(item.name)}</a><p class="tiny">Cuspr may earn a commission. No tracker, script, popup or automatic download is embedded.</p></aside>`;
}
function plansView() {
  const cur = tierKey(), L = LICENSE_CONFIG;
  const card = t => `<div class="card lift fade" style="${cur === t ? "outline:2px solid var(--gold)" : ""}"><div class="tier">${cur === t ? "Your edition" : "Edition"}</div>
    <h2>${TIERS[t].name}${["supporter", "pro"].includes(t) ? ` · $${L.prices[t].toFixed(2)}/month` : ""}</h2><ul>${TIER_FEATURES[t].map(f => `<li>${esc(f)}</li>`).join("")}</ul>
    ${["supporter", "pro"].includes(t) ? `<div class="actions">${buyLinks(t)}</div>` : t === "ads" ? `<div class="actions"><button class="btn sm" id="ads-toggle">${cur === "ads" ? "Use ad-free Free" : "Use Free with Ads"}</button></div>` : ""}</div>`;
  const test = BUILD_TIER ? `<p class="msg">Unlocked Pro test build. This is a local QA artifact and must not replace the public build.</p>` : "";
  const target = ["supporter", "pro"].includes(BUILD_EDITION) ? `<p class="msg">This package is tailored for ${TIERS[BUILD_EDITION].name} members. Sign in with the matching Gumroad license key to unlock it.</p>` : "";
  const graceText = licenseInfo.graceUntil ? ` · offline through ${new Date(licenseInfo.graceUntil).toLocaleDateString()}` : "";
  const status = licenseInfo.source === "gumroad" ? `Active Gumroad membership (${maskKey(licenseInfo.licenseKey)})${licenseInfo.offline ? " · using offline cache" : ""}${graceText}` :
    licenseInfo.source === "complimentary" ? `Signed complimentary key${licenseInfo.who ? ` for ${esc(licenseInfo.who)}` : ""}` : "No paid entitlement";
  return `<div class="card fade"><h1>Choose your Cuspr edition</h1><p class="mut">Free stays ad-free and useful. Free with Ads voluntarily unlocks Supporter limits. Supporter and Pro are ad-free recurring Gumroad memberships.</p>${test}${target}</div>
  <div class="grid2">${card("free")}${card("ads")}${card("supporter")}${card("pro")}</div>
  <div class="card fade"><h2>Verify a purchase or complimentary key</h2><p class="mut">Current status: <b>${status}</b></p>
  <div class="row"><label>Edition<select id="ltype"><option value="pro" ${BUILD_EDITION !== "supporter" ? "selected" : ""}>Pro</option><option value="supporter" ${BUILD_EDITION === "supporter" ? "selected" : ""}>Supporter</option></select></label><label>Buyer or complimentary key<input id="lkey" type="password" placeholder="Gumroad buyer key or CUSPR1.…" autocomplete="off" spellcheck="false"></label></div>
  <div class="actions"><button class="btn sm" id="lact">Verify and unlock</button>${licenseInfo.tier !== "free" && !BUILD_TIER ? '<button class="btn sm ghost" id="lrem">Remove entitlement</button>' : ""}</div><div class="msg" id="lmsg" role="status" aria-live="polite"></div>
  <p class="tiny">Verification uses Gumroad's official license endpoint. Active memberships revalidate every 7 days and have a 14-day offline grace period from the last successful check. Cancelled, ended, refunded or chargebacked memberships are removed on revalidation. Buyer keys are stored only on this device, never printed to logs, and can be removed here.</p>
  <div class="actions"><button class="btn sm ghost" id="lrestore">Restore / revalidate purchase</button><a class="btn sm ghost" href="https://cusprastro.github.io/membership.html" target="_blank" rel="noopener noreferrer">Membership help</a></div></div>
  ${sponsoredPlacement("plans")}`;
}
function bindPlans() {
  const ads = $("#ads-toggle");
  if (ads) ads.onclick = () => { setAdsEdition(tierKey() !== "ads"); render(); };
  const a = $("#lact"); if (!a) return;
  a.onclick = async () => {
    const m = $("#lmsg"), key = $("#lkey").value;
    m.className = "msg"; m.textContent = "Verifying…"; a.disabled = true;
    const result = await activateLicense(key, $("#ltype").value);
    a.disabled = false;
    if (result.ok) { m.textContent = `Unlocked: ${TIERS[result.entitlement.tier].name}.`; setTimeout(() => render(), 600); }
    else { m.className = "msg err"; m.textContent = result.message; }
  };
  const r = $("#lrem"); if (r) r.onclick = () => { deactivateLicense(); render(); };
  const restore = $("#lrestore");
  if (restore) restore.onclick = async () => {
    const saved = readEntitlement(), m = $("#lmsg");
    if (!saved || saved.source !== "gumroad") { m.className = "msg err"; m.textContent = "Enter your Gumroad membership key above to restore a purchase."; return; }
    m.className = "msg"; m.textContent = "Revalidating membership…";
    try {
      const fresh = await verifyGumroadKey(saved.licenseKey, saved.tier);
      if (fresh && !fresh.inactive) { saveEntitlement(fresh); licenseInfo = fresh; m.textContent = "Membership restored and grace period refreshed."; setTimeout(render, 600); }
      else { deactivateLicense(); m.className = "msg err"; m.textContent = `Membership is not active${fresh && fresh.reason ? ` (${fresh.reason})` : ""}.`; }
    } catch (e) { m.className = "msg err"; m.textContent = "Gumroad is unreachable. Your existing access remains available until the offline grace date."; }
  };
}
