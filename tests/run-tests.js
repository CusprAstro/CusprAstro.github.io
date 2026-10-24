"use strict";
const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
let passed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(() => { passed++; console.log("ok", name); }, e => { console.error("FAIL", name, e.stack || e); process.exitCode = 1; });
}
function storage() {
  const data = new Map();
  return {getItem: k => data.has(k) ? data.get(k) : null, setItem: (k, v) => data.set(k, String(v)), removeItem: k => data.delete(k)};
}
function loadPlanner() {
  const context = {
    console, localStorage: storage(),
    ASPECTS: [{name: "Conjunction", angle: 0, orb: 8, tone: "neutral"}, {name: "Square", angle: 90, orb: 7, tone: "hard"}, {name: "Trine", angle: 120, orb: 7, tone: "easy"}],
    ORDER: ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Node"],
    diff180: x => ((x + 540) % 360) - 180, norm: x => ((x % 360) + 360) % 360,
    houseOf: lon => Math.floor(((lon % 360) + 360) % 360 / 30) + 1,
    planetsAt: date => {
      const n = Math.floor(date.getTime() / 86400000);
      const lon = {};
      context.ORDER.forEach((k, i) => lon[k] = (n * (i + 1) * .73 + i * 31) % 360);
      return {lon, rx: {}};
    },
  };
  vm.createContext(context);
  vm.runInContext(read("app/planner.js") + "\nthis.api={plannerScoreDay,buildPlannerMonth,plannerRank,plannerAccessibleScore};", context);
  return context;
}
function loadLicense(nativeResult) {
  const {publicKey, privateKey} = crypto.generateKeyPairSync("ec", {namedCurve: "P-256"});
  const jwk = publicKey.export({format: "jwk"});
  let code = read("app/license.js")
    .replace('"x": "Ao6tAmZXO1d_QrzzoSFv5gkeBIIccmpoW-0IylrwcSw"', `"x": "${jwk.x}"`)
    .replace('"y": "sWFLD4J0YPCs-loVDM6VRxGB3-4JtgY7jyjp-El5hY0"', `"y": "${jwk.y}"`);
  const localStorage = storage();
  const context = {
    console, localStorage, crypto: crypto.webcrypto, TextEncoder, TextDecoder, URLSearchParams,
    atob: s => Buffer.from(s, "base64").toString("binary"),
    window: {halleyNative: {verifyGumroad: async () => nativeResult}},
    esc: String, $: () => null, render: () => {}, go: () => {},
  };
  vm.createContext(context);
  vm.runInContext(code + "\nthis.api={verifyLicense,activateLicense,loadLicense,deactivateLicense,setAdsEdition,tierKey,tier,sponsoredPlacement,LICENSE_CONFIG};", context);
  const payload = Buffer.from(JSON.stringify({t: "pro", n: "Test Buyer"})).toString("base64url");
  const sig = crypto.sign("sha256", Buffer.from(payload), {key: privateKey, dsaEncoding: "ieee-p1363"}).toString("base64url");
  return {context, key: `CUSPR1.${payload}.${sig}`};
}

(async () => {
  await test("planner produces deterministic category scores and rationale", () => {
    const c = loadPlanner(), chart = {date: new Date("1990-01-01T00:00:00Z"), lat: 41, lon: -87, cusps: Array.from({length: 12}, (_, i) => i * 30), points: {Sun: 10, Moon: 80, Venus: 125, Mars: 200, Jupiter: 245, Saturn: 310}};
    const day = c.api.plannerScoreDay(chart, new Date("2026-10-24T12:00:00Z"));
    assert.equal(Object.keys(day.scores).length, 11);
    assert.ok(Object.values(day.scores).every(x => x >= 12 && x <= 94));
    assert.ok(day.reasons.love.length && day.suggested.length && day.avoid.length);
    assert.equal(c.api.plannerScoreDay(chart, new Date("2026-10-24T12:00:00Z")).scores.overall, day.scores.overall);
  });
  await test("planner month, rank, and confidence labels work", () => {
    const c = loadPlanner(), chart = {date: new Date("1990-01-01T00:00:00Z"), lat: 0, lon: 0, cusps: Array.from({length: 12}, (_, i) => i * 30), points: {Sun: 0, Moon: 90, Venus: 180}};
    const days = c.api.buildPlannerMonth(chart, 2026, 2);
    assert.equal(days.length, 28);
    assert.equal(c.api.plannerRank(days).best.length, 3);
    assert.equal(c.api.plannerAccessibleScore(80), "strong");
  });
  await test("signed complimentary Pro key remains supported", async () => {
    const {context, key} = loadLicense({success: false});
    const valid = await context.api.verifyLicense(key);
    assert.equal(valid.tier, "pro");
    assert.equal((await context.api.activateLicense(key, "supporter")).ok, true);
    assert.equal(context.api.tierKey(), "pro");
  });
  await test("legacy complimentary key storage migrates without losing access", async () => {
    const {context, key} = loadLicense({success: false});
    context.localStorage.setItem("cuspr.license", key);
    const loaded = await context.api.loadLicense();
    assert.equal(loaded.tier, "pro");
    assert.equal(context.localStorage.getItem("cuspr.license"), null);
    assert.ok(context.localStorage.getItem("cuspr.entitlement.v2"));
  });
  await test("Gumroad buyer key uses official product mapping and cached entitlement", async () => {
    const {context} = loadLicense({success: true, purchase: {email: "buyer@example.test", refunded: false, chargebacked: false}});
    const result = await context.api.activateLicense("buyer-key-secret", "supporter");
    assert.equal(result.ok, true);
    assert.equal(context.api.tierKey(), "supporter");
    assert.equal(context.api.LICENSE_CONFIG.gumroadProducts.pro, "B2HpRnlL66EA931sJ9xOlg==");
  });
  await test("refunded Gumroad purchase never unlocks", async () => {
    const {context} = loadLicense({success: true, purchase: {refunded: true}});
    assert.equal((await context.api.activateLicense("buyer-key-secret", "pro")).ok, false);
    assert.equal(context.api.tierKey(), "free");
  });
  await test("edition gates and sponsored placement rules", () => {
    const {context} = loadLicense({success: false});
    assert.equal(context.api.tier().plannerDays, 7);
    context.api.setAdsEdition(true);
    assert.equal(context.api.tierKey(), "ads");
    assert.equal(context.api.tier().readingSections, 999);
    assert.match(context.api.sponsoredPlacement("home"), /Sponsored/);
    assert.equal(context.api.sponsoredPlacement("chart"), "");
  });
  await test("bundle has no unresolved source placeholders and includes planner", () => {
    const template = read("app/index.html"), bundle = read("app/bundle.py");
    for (const tag of ["CSS", "ASTRONOMY", "ENGINE", "LICENSE", "PLANNER", "APP"]) assert.ok(template.includes(`/*@@${tag}@@*/`));
    assert.match(bundle, /"PLANNER": rd\("planner\.js"\)/);
  });
  await test("responsive, desktop IPC, affiliate, and external link safety surfaces exist", () => {
    const css = read("app/style.css"), main = read("desktop/main.js"), license = read("app/license.js"), app = read("app/app.js");
    assert.match(css, /@media\(max-width:420px\)/);
    assert.match(main, /verify-gumroad/);
    assert.match(main, /\["https:", "mailto:"\]/);
    for (const url of ["https://adguard.com/?aid=138471", "https://adguard-vpn.com/?aid=138471", "https://adguard-dns.io/?aid=138471"]) assert.ok(license.includes(url));
    assert.match(app, /sponsoredPlacement\("news-end"\)/);
    assert.match(app, /sponsoredPlacement\("forecast-end"\)/);
  });
  if (!process.exitCode) console.log(`passed ${passed} tests`);
})();
