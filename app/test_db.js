const fs = require("fs"), vm = require("vm");
const b = __dirname + "/";
const ctx = {console, Intl, Date, Math, Object, Array, Set, Map, JSON, String, Number};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(b + "astronomy.min.js", "utf8") + "\n;this.Astronomy = Astronomy;", ctx);
for (const f of ["engine.js", "famous.js", "famous_data.js", "famous_match.js"]) vm.runInContext(fs.readFileSync(b + f, "utf8"), ctx);
vm.runInContext(`
const c = buildChart(localToUtc(1986,4,22,1,9,"America/Chicago"), 41.8008, -87.937);
for (const known of [true, false]) {
  const t0 = Date.now();
  const r = closestFamous(c, known, 8);
  console.log("known", known, "ms", Date.now() - t0, "db", FAMOUS_DB.length);
  for (const x of r) console.log(" ", x.pct + "%", x.f[0], "|", x.f[2], "|", x.approx ? "noon" : "timed", "|", x.why.join("; "));
}
console.log("infamous", FAMOUS_DB.filter(r => r[2] === "Infamous").length, "timed", FAMOUS_DB.filter(r => r[6] != null).length);
`, ctx);
