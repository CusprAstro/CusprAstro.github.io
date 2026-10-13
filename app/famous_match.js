/* Chart-twin matching against FAMOUS_DB rows: [name, description, category, dob, place, lons[11], asc|null, mc|null]
   lons order: Sun Moon Mercury Venus Mars Jupiter Saturn Uranus Neptune Pluto Node. Rows without a birth time (asc null)
   use local noon, so Moon is approximate and Rising/Midheaven are never compared. */
const DB_KEYS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Node"];
const DB_CACHE = new Map();
function dbChart(row) {
  let c = DB_CACHE.get(row);
  if (c) return c;
  const lonOf = {};
  DB_KEYS.forEach((k, i) => lonOf[k] = row[5][i]);
  const timed = row[6] != null;
  c = {lonOf, timed, asc: timed ? row[6] : 0, mc: timed ? row[7] : 0, aspects: findAspects(lonOf, lonOf, true)};
  DB_CACHE.set(row, c);
  return c;
}

/* Scores resemblance: sign placements, tight degree matches, element balance and shared aspects. */
function compareCharts(c, row, timeKnown) {
  const o = dbChart(row), why = [], both = timeKnown && o.timed;
  let score = 0, max = 0;
  const add = (pts, tot, text) => { max += tot; if (pts > 0) { score += pts; if (text) why.push(text); } };
  const SG = [["Sun", 4], ["Moon", 4], ["Mercury", 2], ["Venus", 2], ["Mars", 2], ["Jupiter", 1], ["Saturn", 1], ["Uranus", .4], ["Neptune", .3], ["Pluto", .3]];
  for (const [k, w] of SG) {
    const same = signOf(c.lonOf[k]) === signOf(o.lonOf[k]);
    const tol = (k === "Moon" && !o.timed) ? 0 : 5;
    const close = tol > 0 && Math.abs(diff180(c.lonOf[k] - o.lonOf[k])) <= tol;
    add(same ? w : 0, w, same ? `${k} in ${signOf(c.lonOf[k])}` + (close ? " (within 5 deg)" : "") : "");
    if (tol > 0 && ["Sun", "Moon", "Mercury", "Venus", "Mars"].includes(k)) { max += 1; if (same && close) score += 1; }
  }
  if (both) {
    add(signOf(c.asc) === signOf(o.asc) ? 4 : 0, 4, `${signOf(c.asc)} Rising`);
    add(signOf(c.mc) === signOf(o.mc) ? 1.5 : 0, 1.5, `${signOf(c.mc)} Midheaven`);
  }
  const ev = cos(elementVec(c, both), elementVec(o, both));
  add(Math.max(0, (ev - .6) / .4) * 4, 4, ev > .93 ? "very similar element balance" : ev > .85 ? "similar element balance" : "");
  const personal = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const key = a => a.a + "|" + a.b + "|" + a.asp.name;
  const mine = new Set(c.aspects.filter(a => personal.includes(a.a) && personal.includes(a.b) && a.orb < 5).map(key));
  const shared = o.aspects.filter(a => personal.includes(a.a) && personal.includes(a.b) && mine.has(key(a)) && a.orb < 5);
  add(Math.min(shared.length, 4) * 1.25, 5, shared.length ? "shared aspects: " + shared.slice(0, 3).map(a => `${a.a} ${a.asp.name.toLowerCase()} ${a.b}`).join(", ") : "");
  return {f: row, pct: Math.round(100 * score / max), why, chart: o, approx: !o.timed};
}
function closestFamous(c, timeKnown, n = 8) {
  return FAMOUS_DB.map(r => compareCharts(c, r, timeKnown)).sort((a, b) => b.pct - a.pct).slice(0, n);
}
