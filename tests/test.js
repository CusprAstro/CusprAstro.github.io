"use strict";
const assert = require("assert");
const cryptoModule = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const b64u = bytes => Buffer.from(bytes).toString("base64url");

function context(extra = {}) {
  const storage = new Map();
  const ctx = {
    console,
    Date,
    Intl,
    Math,
    JSON,
    TextEncoder,
    TextDecoder,
    URL,
    URLSearchParams,
    Uint8Array,
    atob: s => Buffer.from(s, "base64").toString("binary"),
    btoa: s => Buffer.from(s, "binary").toString("base64"),
    crypto: cryptoModule.webcrypto,
    navigator: {onLine: false},
    localStorage: {
      getItem: k => storage.has(k) ? storage.get(k) : null,
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: k => storage.delete(k),
    },
    window: {},
    esc: s => String(s).replace(/[&<>"']/g, ""),
    setTimeout,
    clearTimeout,
    ...extra,
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  return ctx;
}

function load(ctx, files) {
  for (const file of files) {
    vm.runInContext(read(file), ctx, {filename:file});
    if (ctx.window && ctx.window.Astronomy) ctx.Astronomy = ctx.window.Astronomy;
  }
}

async function testPlanner() {
  const ctx = context();
  load(ctx, ["app/astronomy.min.js", "app/engine.js", "app/reading.js", "app/planner.js"]);
  vm.runInContext(`
    globalThis.testChart = buildChart(new Date("1986-04-22T06:09:00Z"), 41.8008, -87.937);
    globalThis.dayA = plannerDay(testChart, "2026-10-24");
    globalThis.dayB = plannerDay(testChart, "2026-10-24");
    globalThis.month = plannerMonth(testChart, 2026, 9);
    globalThis.highlights = plannerHighlights(month, "career");
  `, ctx);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(ctx.dayA)), JSON.parse(JSON.stringify(ctx.dayB)), "planner must be deterministic");
  assert.strictEqual(ctx.dayA.domains.length, 10);
  assert.strictEqual(ctx.dayA.date, "2026-10-24");
  assert.ok(ctx.dayA.transitCount > 0, "planner should reference real transits");
  for (const domain of ctx.dayA.domains) {
    assert.ok(domain.score >= 18 && domain.score <= 92, `${domain.key} score out of bounds`);
    assert.ok(["Low", "Medium", "High"].includes(domain.confidence));
    assert.ok(domain.action && domain.avoid);
  }
  assert.strictEqual(ctx.month.length, 31);
  assert.strictEqual(ctx.highlights.best.length, 4);
  assert.strictEqual(ctx.highlights.caution.length, 4);
}

async function testGumroadAndEditions() {
  const ctx = context();
  load(ctx, ["app/license.js"]);
  vm.runInContext("globalThis.exportsForTest={gumroadRequest,TIERS,TIER_FEATURES,SPONSORS,SPONSOR_LINKS,verifyLocalLicense,maskLicenseKey}", ctx);
  const api = ctx.exportsForTest;
  let request;
  const success = await api.gumroadRequest("supporter", "buyer-key-123", async input => {
    request = input;
    return {success:true,purchase:{id:"sale-1",email:"buyer@example.com"}};
  });
  assert.strictEqual(success.ok, true);
  assert.strictEqual(request.productId, "S0wa78i_Tu7s5_A65WTrPg==");
  assert.strictEqual(request.incrementUsesCount, false);
  assert.strictEqual(success.entitlement.tier, "supporter");
  assert.strictEqual(success.entitlement.maskedKey, "buye…-123");
  const revoked = await api.gumroadRequest("pro", "buyer-key-456", async () => ({success:true,purchase:{refunded:true}}));
  assert.strictEqual(revoked.ok, false);
  assert.strictEqual(revoked.code, "revoked");
  assert.strictEqual(api.TIERS.free_ads.readingSections, api.TIERS.supporter.readingSections);
  assert.strictEqual(api.TIERS.free_ads.ads, true);
  assert.strictEqual(api.TIERS.free.ads, false);
  assert.ok(api.SPONSOR_LINKS.every(x => /^https:\/\//.test(x[1])));

  const sponsoredCtx = context();
  const sponsoredSource = read("app/license.js").replace('const BUILD_EDITION = "";', 'const BUILD_EDITION = "free_ads";');
  vm.runInContext(sponsoredSource, sponsoredCtx);
  vm.runInContext("globalThis.sponsorHtml=sponsoredCard('home')", sponsoredCtx);
  assert.match(sponsoredCtx.sponsorHtml, /Sponsored · affiliate link/);
  assert.match(sponsoredCtx.sponsorHtml, /rel="noopener sponsored"/);
  const freeCtx = context();
  load(freeCtx, ["app/license.js"]);
  vm.runInContext("globalThis.sponsorHtml=sponsoredCard('home')", freeCtx);
  assert.strictEqual(freeCtx.sponsorHtml, "");
}

async function testComplimentarySignature() {
  const ctx = context();
  load(ctx, ["app/license.js"]);
  vm.runInContext("globalThis.verifyForTest=verifyLocalLicense", ctx);
  const pair = await cryptoModule.webcrypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"}, true, ["sign","verify"]);
  const publicKey = await cryptoModule.webcrypto.subtle.exportKey("jwk", pair.publicKey);
  const payload = b64u(JSON.stringify({t:"pro",n:"Test recipient"}));
  const signature = await cryptoModule.webcrypto.subtle.sign({name:"ECDSA",hash:"SHA-256"}, pair.privateKey, new TextEncoder().encode(payload));
  const key = `CUSPR1.${payload}.${b64u(signature)}`;
  const valid = await ctx.verifyForTest(key, publicKey);
  assert.strictEqual(valid.tier, "pro");
  assert.strictEqual(valid.source, "complimentary");
  assert.strictEqual(await ctx.verifyForTest(key.slice(0, -2) + "xx", publicKey), null);
}

async function main() {
  await testPlanner();
  await testGumroadAndEditions();
  await testComplimentarySignature();
  console.log("All Cuspr tests passed.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
