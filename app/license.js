/* Editions and licensing. Gumroad product IDs identify products; customers activate with purchaser keys. */
const APP_VERSION = "0.3.0-beta";
const LICENSE_CONFIG = {
  paypalMe: "lircin",
  prices: {supporter: 5, pro: 15},
  currency: "USD",
  contact: "",
  gumroad: {
    verifyUrl: "https://api.gumroad.com/v2/licenses/verify",
    products: {
      supporter: {id: "S0wa78i_Tu7s5_A65WTrPg==", storefront: ""},
      pro: {id: "B2HpRnlL66EA931sJ9xOlg==", storefront: ""}
    },
    revalidateDays: 7
  },
  otherMethods: [
    {name: "GitHub Sponsors", supporter: "", pro: ""}
  ],
  publicKey: {"kty":"EC","x":"Ao6tAmZXO1d_QrzzoSFv5gkeBIIccmpoW-0IylrwcSw","y":"sWFLD4J0YPCs-loVDM6VRxGB3-4JtgY7jyjp-El5hY0","crv":"P-256"}
};

/* Set by bundle.py: free, free_ads, supporter, pro, or pro_test. Empty is the public Free build. */
const BUILD_EDITION = "";
const TIERS = {
  free:      {name:"Free", readingSections:3,   forecastMonths:3,  plannerMonths:1,  twins:3,  profiles:2,   print:false, ads:false},
  free_ads:  {name:"Free with Ads", readingSections:999, forecastMonths:6, plannerMonths:6, twins:10, profiles:10, print:true, ads:true},
  supporter: {name:"Supporter", readingSections:999, forecastMonths:6, plannerMonths:6, twins:10, profiles:10, print:true, ads:false},
  pro:       {name:"Pro", readingSections:999, forecastMonths:12, plannerMonths:12, twins:25, profiles:999, print:true, ads:false}
};
const TIER_FEATURES = {
  free:["Birth chart wheel, houses and aspects","First 3 reading sections","3-month transit forecast","1-month Cosmic Planner","Top 3 chart twins","2 saved profiles","No ads"],
  free_ads:["Complete natal reading","6-month forecasts and Cosmic Planner","Top 10 chart twins","10 saved profiles","Print / save PDF","Tasteful sponsored cards outside core readings"],
  supporter:["Everything in Free with Ads","No sponsored cards","One-time purchase","Supports independent development"],
  pro:["Everything in Supporter","12-month forecasts and Cosmic Planner","Top 25 chart twins","Unlimited profiles","All future Pro features"]
};
const SPONSORS = [
  {name:"AdGuard", copy:"A privacy-focused blocker for ads, trackers and malicious pages.", href:"https://adguard.com/promotion.html?aid=138471", cta:"View AdGuard offer"},
  {name:"AdGuard VPN", copy:"An optional VPN for private browsing across networks and devices.", href:"https://adguard-vpn.com/promotion.html?aid=138471", cta:"View VPN offer"},
  {name:"AdGuard DNS", copy:"Optional DNS-level blocking with device-wide filtering controls.", href:"https://adguard-dns.io/?aid=138471", cta:"Explore AdGuard DNS"}
];
const SPONSOR_LINKS = [
  ["AdGuard overview","https://adguard.com/?aid=138471"],
  ["AdGuard promotion","https://adguard.com/promotion.html?aid=138471"],
  ["AdGuard VPN overview","https://adguard-vpn.com/?aid=138471"],
  ["AdGuard VPN promotion","https://adguard-vpn.com/promotion.html?aid=138471"],
  ["AdGuard DNS","https://adguard-dns.io/?aid=138471"],
  ["AdGuard for Windows installer","https://download.adguardcdn.com/d/138471/adguardInstaller.exe"],
  ["AdGuard VPN for Windows installer","https://download.adguardcdn.com/d/138471/adguardVPNInstaller.exe"],
  ["AdGuard VPN Firefox extension","https://download.adguardcdn.com/d/138471/ext-vpn-firefox"],
  ["AdGuard VPN media information","https://adguard-vpn.com/en/media-materials.html?_plc=en"]
];

let licenseInfo = {tier:"free", who:"", source:"none", offline:false};
const baseEdition = () => BUILD_EDITION === "free_ads" ? "free_ads" : "free";
const isTestBuild = () => BUILD_EDITION === "pro_test";
const tierKey = () => isTestBuild() ? "pro" : (licenseInfo.tier === "supporter" || licenseInfo.tier === "pro" ? licenseInfo.tier : baseEdition());
const tier = () => TIERS[tierKey()] || TIERS.free;
const editionName = () => isTestBuild() ? "Unlocked Pro Test" : TIERS[tierKey()].name;
const isSponsoredEdition = () => tierKey() === "free_ads";
const preferredActivationTier = () => BUILD_EDITION === "supporter" || BUILD_EDITION === "pro" ? BUILD_EDITION : "supporter";
const b64uToBytes = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
const maskLicenseKey = key => {
  const s = String(key || "").trim();
  return s.length < 9 ? "••••••••" : `${s.slice(0, 4)}…${s.slice(-4)}`;
};

async function verifyLocalLicense(key, publicKey = LICENSE_CONFIG.publicKey) {
  try {
    const [tag, payload, sig] = String(key).trim().split(".");
    if (tag !== "CUSPR1" || !payload || !sig) return null;
    const k = await crypto.subtle.importKey("jwk", publicKey, {name:"ECDSA",namedCurve:"P-256"}, false, ["verify"]);
    const ok = await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"}, k, b64uToBytes(sig), new TextEncoder().encode(payload));
    if (!ok) return null;
    const d = JSON.parse(new TextDecoder().decode(b64uToBytes(payload)));
    return (d.t === "supporter" || d.t === "pro") ? {tier:d.t,who:String(d.n || ""),source:"complimentary",offline:true} : null;
  } catch (e) { return null; }
}

async function gumroadRequest(tierName, key, requestFn) {
  const product = LICENSE_CONFIG.gumroad.products[tierName];
  if (!product || !product.id) return {ok:false,code:"configuration",message:"This Gumroad product is not configured."};
  const cleanKey = String(key || "").trim();
  if (!cleanKey) return {ok:false,code:"input",message:"Enter the purchaser license key from Gumroad."};
  try {
    let data;
    if (requestFn) {
      data = await requestFn({productId:product.id,licenseKey:cleanKey,incrementUsesCount:false});
    } else if (window.cusprNative && window.cusprNative.verifyGumroad) {
      data = await window.cusprNative.verifyGumroad({productId:product.id,licenseKey:cleanKey});
    } else {
      const body = new URLSearchParams({product_id:product.id,license_key:cleanKey,increment_uses_count:"false"});
      const response = await fetch(LICENSE_CONFIG.gumroad.verifyUrl, {method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
      data = await response.json().catch(() => ({}));
      if (!response.ok && !data.message) data.message = `Gumroad returned HTTP ${response.status}.`;
    }
    if (!data || data.success !== true) return {ok:false,code:"invalid",message:String(data && (data.message || data.error) || "Gumroad did not recognize that key.")};
    const purchase = data.purchase || {};
    if (purchase.refunded || purchase.chargebacked || purchase.disputed) return {ok:false,code:"revoked",message:"This purchase is no longer eligible for activation."};
    if (purchase.subscription_cancelled_at && purchase.subscription_ended_at) return {ok:false,code:"expired",message:"This license is no longer active."};
    return {
      ok:true,
      entitlement:{version:1,tier:tierName,source:"gumroad",key:cleanKey,maskedKey:maskLicenseKey(cleanKey),
        productId:product.id,verifiedAt:new Date().toISOString(),purchaseId:String(purchase.id || purchase.sale_id || ""),
        who:String(purchase.email || ""),offline:false}
    };
  } catch (e) {
    return {ok:false,code:"network",message:"Could not reach Gumroad. Check your connection and try again."};
  }
}

function saveGumroadEntitlement(entitlement) {
  try { localStorage.setItem("cuspr.gumroad.entitlement", JSON.stringify(entitlement)); } catch (e) {}
}
function readGumroadEntitlement() {
  try {
    const e = JSON.parse(localStorage.getItem("cuspr.gumroad.entitlement") || "null");
    return e && e.version === 1 && (e.tier === "supporter" || e.tier === "pro") && e.key && e.productId ? e : null;
  } catch (e) { return null; }
}
function clearStoredLicenses() {
  try { localStorage.removeItem("cuspr.license"); localStorage.removeItem("cuspr.gumroad.entitlement"); } catch (e) {}
}
async function revalidateGumroad(entitlement, requestFn) {
  const result = await gumroadRequest(entitlement.tier, entitlement.key, requestFn);
  if (result.ok) {
    saveGumroadEntitlement(result.entitlement);
    licenseInfo = result.entitlement;
  } else if (result.code !== "network") {
    try { localStorage.removeItem("cuspr.gumroad.entitlement"); } catch (e) {}
    licenseInfo = {tier:"free",who:"",source:"none",offline:false};
  }
  return result;
}
async function loadLicense() {
  if (isTestBuild()) { licenseInfo = {tier:"pro",who:"Test build",source:"test",offline:true}; return licenseInfo; }
  let localKey = "";
  try { localKey = localStorage.getItem("cuspr.license") || ""; } catch (e) {}
  const local = localKey && await verifyLocalLicense(localKey);
  if (local) { licenseInfo = local; return licenseInfo; }
  const cached = readGumroadEntitlement();
  if (!cached) { licenseInfo = {tier:"free",who:"",source:"none",offline:false}; return licenseInfo; }
  licenseInfo = {...cached,offline:true};
  const age = Date.now() - Date.parse(cached.verifiedAt || 0);
  if (navigator.onLine && age > LICENSE_CONFIG.gumroad.revalidateDays * 86400000) {
    revalidateGumroad(cached).then(() => { if (typeof render === "function") { nav(); render(); header(); } });
  }
  return licenseInfo;
}
async function activateLicense(key, requestedTier, requestFn) {
  const clean = String(key || "").trim();
  if (clean.startsWith("CUSPR1.")) {
    const local = await verifyLocalLicense(clean);
    if (!local) return {ok:false,code:"invalid",message:"That complimentary key is not valid."};
    try { localStorage.setItem("cuspr.license", clean); } catch (e) {}
    licenseInfo = local;
    return {ok:true,entitlement:local};
  }
  const result = await gumroadRequest(requestedTier, clean, requestFn);
  if (result.ok) { saveGumroadEntitlement(result.entitlement); licenseInfo = result.entitlement; }
  return result;
}
function deactivateLicense() {
  clearStoredLicenses();
  licenseInfo = {tier:"free",who:"",source:"none",offline:false};
}

function buyLinks(t) {
  const L = LICENSE_CONFIG, product = L.gumroad.products[t], out = [];
  if (product && product.storefront) out.push(`<a class="btn sm" href="${esc(product.storefront)}" target="_blank" rel="noopener">Buy on Gumroad</a>`);
  if (L.paypalMe) out.push(`<a class="btn sm ghost" href="https://paypal.me/${encodeURIComponent(L.paypalMe)}/${L.prices[t]}${L.currency}" target="_blank" rel="noopener">Pay ${L.prices[t]} ${L.currency} with PayPal</a>`);
  for (const m of L.otherMethods) if (m[t]) out.push(`<a class="btn sm ghost" href="${esc(m[t])}" target="_blank" rel="noopener">${esc(m.name)}</a>`);
  return out.length ? out.join(" ") : `<span class="tiny mut">Storefront link coming soon.</span>`;
}
const printBtn = () => tier().print ? `<button class="btn sm ghost" onclick="window.print()">Print / Save PDF</button>` : `<button class="btn sm ghost" onclick="go('plans')">🔒 Print / Save PDF</button>`;
function lockCard(what, need) {
  return `<div class="card fade lock"><span class="eyebrow">Plan feature</span><h2>🔒 ${esc(what)}</h2><p>Available in ${TIERS[need].name} and higher.</p><div class="actions"><button class="btn sm" onclick="go('plans')">Compare editions</button></div></div>`;
}
function planBadge() {
  return `<span class="plan-badge ${tierKey()}">${esc(editionName())}</span>`;
}
function sponsoredCard(slot = "home") {
  if (!isSponsoredEdition()) return "";
  const item = SPONSORS[(new Date().getUTCDate() + slot.length) % SPONSORS.length];
  return `<aside class="card sponsor fade" aria-label="Sponsored recommendation"><div class="sponsor-label">Sponsored · affiliate link</div><div class="sponsor-body"><div><h2>${esc(item.name)}</h2><p>${esc(item.copy)}</p><p class="tiny">Cuspr may earn a commission if you purchase. This does not affect your price or your reading.</p></div><a class="btn sm ghost" href="${esc(item.href)}" target="_blank" rel="noopener sponsored">${esc(item.cta)} ↗</a></div></aside>`;
}
function sponsoredDirectory() {
  if (!isSponsoredEdition()) return "";
  return `<div class="card sponsor fade"><div class="sponsor-label">Sponsored resources · affiliate links</div><h2>Optional privacy tools</h2><p>These are external AdGuard destinations supplied by Cuspr's publisher. Downloads only begin after you explicitly choose a download link.</p><div class="chips">${SPONSOR_LINKS.map(([name,url]) => `<a class="chip" href="${esc(url)}" target="_blank" rel="noopener sponsored">${esc(name)} ↗</a>`).join("")}</div></div>`;
}

function plansView() {
  const cur = tierKey(), L = LICENSE_CONFIG;
  const card = t => {
    const paid = t === "supporter" || t === "pro";
    return `<div class="card lift fade plan-card ${cur === t ? "current" : ""}"><span class="eyebrow">${cur === t ? "Current edition" : t === "free_ads" ? "Ad-supported" : paid ? "One-time purchase" : "Essentials"}</span>
      <h2>${TIERS[t].name}${paid ? ` · ${L.prices[t]} ${L.currency}` : ""}</h2><ul>${TIER_FEATURES[t].map(f => `<li>${esc(f)}</li>`).join("")}</ul>
      ${paid ? `<div class="actions">${buyLinks(t)}</div>` : ""}</div>`;
  };
  const buildNotice = BUILD_EDITION ? `<p class="msg">${isTestBuild() ? "Unlocked Pro test build. Do not distribute publicly." : `Package: ${BUILD_EDITION.replace("_"," ")} edition.`}</p>` : "";
  const fixed = BUILD_EDITION === "supporter" || BUILD_EDITION === "pro";
  return `<div class="card hero compact fade"><span class="eyebrow">Cuspr ${APP_VERSION}</span><h1>Choose your edition</h1><p>Start privately for free, unlock Supporter-level tools with a restrained sponsored edition, or buy a permanent ad-free license.</p>${buildNotice}</div>
  <div class="plans-grid">${card("free")}${card("free_ads")}${card("supporter")}${card("pro")}</div>
  <div class="card fade"><span class="eyebrow">License activation</span><h2>Activate a Gumroad or complimentary key</h2>
  <p class="mut">Current access: <b>${esc(editionName())}</b>${licenseInfo.who && !isTestBuild() ? ` · ${esc(licenseInfo.who)}` : ""}${licenseInfo.offline && licenseInfo.source === "gumroad" ? " · saved offline" : ""}</p>
  <div class="form-line">${fixed ? `<input type="hidden" id="lplan" value="${BUILD_EDITION}"><span class="chip g">${TIERS[BUILD_EDITION].name} product</span>` : `<label>Product<select id="lplan"><option value="supporter" ${preferredActivationTier() === "supporter" ? "selected" : ""}>Supporter</option><option value="pro" ${preferredActivationTier() === "pro" ? "selected" : ""}>Pro</option></select></label>`}<label class="grow">Purchaser license key<input id="lkey" placeholder="Paste the key from your Gumroad receipt" autocomplete="off" spellcheck="false"></label></div>
  <div class="actions"><button class="btn sm" id="lact">Verify and activate</button>${licenseInfo.tier !== "free" && !isTestBuild() ? '<button class="btn sm ghost" id="lrem">Remove license</button>' : ""}</div>
  <div class="msg" id="lmsg" role="status" aria-live="polite"></div><p class="tiny">Verification uses Gumroad's official license API. Cuspr stores the key locally for offline access and periodic revalidation; it never prints or logs the full key.</p></div>
  ${sponsoredDirectory()}
  <div class="card fade"><h2>Purchase notes</h2><p>PayPal.me remains available above. Gumroad storefront URLs are intentionally left as configuration placeholders until the product pages are supplied. The product IDs already embedded here are only for verification and cannot unlock the app by themselves.</p></div>`;
}
function bindPlans() {
  const a = $("#lact"); if (!a) return;
  a.onclick = async () => {
    const m = $("#lmsg"), key = $("#lkey").value, requested = $("#lplan").value;
    m.className = "msg"; m.textContent = "Contacting Gumroad securely…"; a.disabled = true;
    const result = await activateLicense(key, requested);
    a.disabled = false;
    if (result.ok) {
      m.textContent = `Activated ${TIERS[licenseInfo.tier].name}. Thank you.`;
      setTimeout(() => { header(); nav(); render(); }, 500);
    } else {
      m.className = "msg err"; m.textContent = result.message;
    }
  };
  const r = $("#lrem");
  if (r) r.onclick = () => { deactivateLicense(); header(); nav(); render(); };
}
