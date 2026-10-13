const fs = require("fs"), vm = require("vm");
const base = __dirname + "/";
const ctx = {console, Intl, Date, Math, Object, Array, Set, JSON, String, Number};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(base + "astronomy.min.js", "utf8") + "\n;this.Astronomy = Astronomy;", ctx);
vm.runInContext(fs.readFileSync(base + "engine.js", "utf8"), ctx);
vm.runInContext(`
const b = localToUtc(1986,4,22,1,9,"America/Chicago");
console.log(b.toISOString());
const c = buildChart(b, 41.8008, -87.937);
for (const k of ORDER) console.log(k, fmtLon(c.lonOf[k]), c.rx[k]?"R":"", c.houses[k]);
console.log("Asc", fmtLon(c.asc), "MC", fmtLon(c.mc), c.houseSystem);
console.log(c.cusps.map(fmtLon).join(" | "));
const t0 = Date.now();
const ev = scanForecast(c, new Date("2026-10-13T12:00:00Z"), 183);
console.log("events", ev.length, "ms", Date.now()-t0);
for (const e of ev.filter(e=>e.type!=="aspect")) console.log(e.date.toISOString().slice(0,10), e.type, e.body||e.phase||e.kind, e.sign||e.dir||e.sub||"", e.lon?fmtLon(e.lon):"");
`, ctx);
