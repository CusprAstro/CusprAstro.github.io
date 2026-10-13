const fs = require("fs"), vm = require("vm");
const b = __dirname + "/";
const ctx = {console, Intl, Date, Math, Object, Array, Set, JSON, String, Number};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(b + "astronomy.min.js", "utf8") + "\n;this.Astronomy = Astronomy;", ctx);
for (const f of ["engine.js", "famous.js"]) vm.runInContext(fs.readFileSync(b + f, "utf8"), ctx);
vm.runInContext(`
const c = buildChart(localToUtc(1986,4,22,1,9,"America/Chicago"), 41.8008, -87.937);
const t0 = Date.now();
for (const r of closestFamous(c, true, 6)) console.log(r.pct + "%", r.f[0], "|", r.why.join("; "));
console.log("ms", Date.now() - t0);
const e = famousChart(FAMOUS[0]); console.log("Einstein", fmtLon(e.lonOf.Sun), fmtLon(e.lonOf.Moon), fmtLon(e.asc));
const m = famousChart(FAMOUS[1]); console.log("Monroe", fmtLon(m.lonOf.Sun), fmtLon(m.lonOf.Moon), fmtLon(m.asc));
`, ctx);
