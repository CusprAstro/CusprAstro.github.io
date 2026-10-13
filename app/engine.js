/* Halley Astro engine — tropical zodiac, Placidus houses, mean node. Uses astronomy-engine (global Astronomy). */
const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const SIGN_GLYPH = "♈♉♊♋♌♍♎♏♐♑♒♓".split("");
const GLYPH = {Sun:"☉",Moon:"☽",Mercury:"☿",Venus:"♀",Mars:"♂",Jupiter:"♃",Saturn:"♄",Uranus:"♅",Neptune:"♆",Pluto:"♇",Node:"☊",Asc:"Asc",MC:"MC"};
const BODIES = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"];
const ORDER = [...BODIES, "Node"];
const ASPECTS = [
  {name:"Conjunction", angle:0, orb:8, g:"☌", tone:"neutral"},
  {name:"Sextile", angle:60, orb:5, g:"⚹", tone:"easy"},
  {name:"Square", angle:90, orb:7, g:"□", tone:"hard"},
  {name:"Trine", angle:120, orb:7, g:"△", tone:"easy"},
  {name:"Opposition", angle:180, orb:8, g:"☍", tone:"hard"},
];
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const norm = x => ((x % 360) + 360) % 360;
const diff180 = x => ((x + 540) % 360) - 180;

function fmtLon(l) {
  const s = Math.floor(l / 30), d = l - 30 * s;
  const dd = Math.floor(d), mm = Math.floor((d - dd) * 60);
  return `${dd}°${String(mm).padStart(2, "0")}′ ${SIGNS[s]}`;
}
const signOf = l => SIGNS[Math.floor(norm(l) / 30)];

function bodyLon(name, date) {
  const t = Astronomy.MakeTime(date);
  const vec = Astronomy.GeoVector(name, t, true);
  const v = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(t), vec);
  return norm(Astronomy.SphereFromVector(v).lon);
}
function meanNode(date) {
  const T = (date.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T);
}

function planetsAt(date) {
  const out = {}, rx = {};
  const later = new Date(date.getTime() + 12 * 3600 * 1000);
  for (const b of BODIES) {
    out[b] = bodyLon(b, date);
    rx[b] = (b === "Sun" || b === "Moon") ? false : diff180(bodyLon(b, later) - out[b]) < 0;
  }
  out.Node = meanNode(date); rx.Node = true;
  return {lon: out, rx};
}

function lonFromRA(ra, eps) { return Math.atan2(Math.sin(ra) / Math.cos(eps), Math.cos(ra)); }

function housesAt(date, lat, lon) {
  const t = Astronomy.MakeTime(date);
  const ramcDeg = norm(Astronomy.SiderealTime(t) * 15 + lon);
  const eps = rad(Astronomy.e_tilt(t).tobl);
  const r = rad(ramcDeg), la = rad(lat);
  const mc = norm(deg(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(eps))));
  const asc = norm(deg(Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(eps) + Math.tan(la) * Math.sin(eps)))));
  let cusps, system = "Placidus";
  if (Math.abs(lat) < 66) {
    const iter = (frac, below) => {
      let ra = r;
      for (let i = 0; i < 100; i++) {
        const lam = lonFromRA(ra, eps);
        const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
        const ad = deg(Math.asin(Math.max(-1, Math.min(1, Math.tan(la) * Math.tan(dec)))));
        ra = below ? r + rad(180) - rad(frac * (90 - ad)) : r + rad(frac * (90 + ad));
      }
      return norm(deg(lonFromRA(ra, eps)));
    };
    const c11 = iter(1 / 3, false), c12 = iter(2 / 3, false);
    const c3 = iter(1 / 3, true), c2 = iter(2 / 3, true);
    cusps = [asc, c2, c3, norm(mc + 180), norm(c11 + 180), norm(c12 + 180), norm(asc + 180), norm(c2 + 180), norm(c3 + 180), mc, c11, c12];
  } else { // polar fallback: whole-sign houses
    system = "Whole Sign (polar fallback)";
    const start = Math.floor(asc / 30) * 30;
    cusps = Array.from({length: 12}, (_, i) => norm(start + 30 * i));
  }
  return {cusps, mc, asc, system};
}
function houseOf(lon, cusps) {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i], b = cusps[(i + 1) % 12];
    if (norm(lon - a) < norm(b - a)) return i + 1;
  }
  return 12;
}

function findAspects(A, B, same, scale = 1, filter) {
  const res = [];
  for (const a of Object.keys(A)) for (const b of Object.keys(B)) {
    if (same && a >= b) continue;
    const d = Math.abs(diff180(A[a] - B[b]));
    for (const asp of ASPECTS) {
      const o = Math.abs(d - asp.angle);
      if (o <= asp.orb * scale && (!filter || filter(a, b, asp))) res.push({a, b, asp, orb: o});
    }
  }
  return res.sort((x, y) => x.orb - y.orb);
}

/* ---- time zone helpers ---- */
function tzOffsetMinutes(utcMs, tz) {
  const f = new Intl.DateTimeFormat("en-US", {timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric"});
  const p = {}; for (const x of f.formatToParts(new Date(utcMs))) p[x.type] = +x.value;
  return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - utcMs) / 60000;
}
function localToUtc(y, mo, d, h, mi, tz) {
  const naive = Date.UTC(y, mo - 1, d, h, mi, 0);
  let guess = naive - tzOffsetMinutes(naive, tz) * 60000;
  guess = naive - tzOffsetMinutes(guess, tz) * 60000;
  return new Date(guess);
}

/* ---- natal chart ---- */
function buildChart(birthUtc, lat, lon) {
  const p = planetsAt(birthUtc);
  const h = housesAt(birthUtc, lat, lon);
  const houses = {};
  for (const k of ORDER) houses[k] = houseOf(p.lon[k], h.cusps);
  const points = {...p.lon, Asc: h.asc, MC: h.mc};
  const aspects = findAspects(points, points, true, 1, (a, b) => !((a === "Asc" || a === "MC") && (b === "Asc" || b === "MC")));
  return {date: birthUtc, lat, lon, lonOf: p.lon, rx: p.rx, cusps: h.cusps, asc: h.asc, mc: h.mc, houseSystem: h.system, houses, aspects, points};
}

/* ---- ruler of sign (traditional+modern mix commonly used) ---- */
const RULER = {Aries:"Mars",Taurus:"Venus",Gemini:"Mercury",Cancer:"Moon",Leo:"Sun",Virgo:"Mercury",Libra:"Venus",Scorpio:"Pluto",Sagittarius:"Jupiter",Capricorn:"Saturn",Aquarius:"Uranus",Pisces:"Neptune"};
const TRAD_RULER = {...RULER, Scorpio:"Mars", Aquarius:"Saturn", Pisces:"Jupiter"};

/* ---- transits & forecasts ---- */
function transitSnapshot(chart, date) {
  const p = planetsAt(date);
  const houses = {}; for (const k of ORDER) houses[k] = houseOf(p.lon[k], chart.cusps);
  const slow = findAspects(p.lon, chart.points, false, 1, (a) => ["Jupiter","Saturn","Uranus","Neptune","Pluto","Node"].includes(a))
    .filter(x => x.orb <= (x.a === "Node" ? 2 : 3));
  const mars = findAspects(p.lon, chart.points, false, 1, a => a === "Mars").filter(x => x.orb <= 2);
  return {date, lon: p.lon, rx: p.rx, houses, aspects: [...slow, ...mars]};
}

function scanForecast(chart, start, days) {
  const events = [];
  const nat = chart.points;
  const dayMs = 86400000;
  const major = ASPECTS.filter(a => a.name !== "Sextile" || true);
  const fast = ["Sun","Mercury","Venus"];
  const mid = ["Mars"];
  const slow = ["Jupiter","Saturn","Uranus","Neptune","Pluto","Node"];
  let prev = null;
  for (let i = 0; i <= days; i++) {
    const d = new Date(start.getTime() + i * dayMs);
    const cur = planetsAt(d);
    if (prev) {
      for (const b of ORDER) {
        // ingress
        const s0 = Math.floor(prev.lon[b] / 30), s1 = Math.floor(cur.lon[b] / 30);
        if (s0 !== s1 && b !== "Moon" && (b !== "Node")) events.push({date: d, type: "ingress", body: b, sign: SIGNS[s1], rx: cur.rx[b]});
        if (b !== "Sun" && b !== "Moon" && b !== "Node" && prev.rx[b] !== cur.rx[b]) events.push({date: d, type: "station", body: b, dir: cur.rx[b] ? "retrograde" : "direct", lon: cur.lon[b]});
        // exact aspects to natal points
        const kind = fast.includes(b) ? 0 : mid.includes(b) ? 1 : 2;
        for (const [pn, nl] of Object.entries(nat)) {
          if (kind === 0 && !["Sun","Moon","Asc","MC"].includes(pn)) continue;
          if (kind === 1 && pn === "Node") continue;
          for (const asp of ASPECTS) {
            if (kind === 0 && asp.name === "Sextile") continue;
            const d0 = diff180(prev.lon[b] - nl - asp.angle), d1 = diff180(cur.lon[b] - nl - asp.angle);
            if (d0 * d1 <= 0 && Math.abs(d0) < 5 && Math.abs(d1) < 5 && !(asp.angle === 180 && (Math.abs(d0) > 5))) {
              if (asp.angle === 0 && b === pn) continue;
              events.push({date: d, type: "aspect", body: b, natal: pn, asp, weight: kind === 2 ? 3 : kind === 1 ? 2 : 1, rx: cur.rx[b]});
            }
          }
        }
      }
    }
    prev = cur;
  }
  // lunations and eclipses
  const end = new Date(start.getTime() + days * dayMs);
  const addPhases = (phase, label) => {
    let t = Astronomy.SearchMoonPhase(phase, start, days + 2);
    while (t && t.date <= end) {
      events.push({date: t.date, type: "lunation", phase: label, lon: bodyLon("Moon", t.date), sunLon: bodyLon("Sun", t.date)});
      t = Astronomy.SearchMoonPhase(phase, new Date(t.date.getTime() + 5 * dayMs), days + 2);
    }
  };
  addPhases(0, "New Moon"); addPhases(180, "Full Moon");
  try {
    let se = Astronomy.SearchGlobalSolarEclipse(start);
    while (se && se.peak.date <= end) { events.push({date: se.peak.date, type: "eclipse", kind: "Solar", sub: se.kind, lon: bodyLon("Sun", se.peak.date)}); se = Astronomy.NextGlobalSolarEclipse(se.peak); }
    let le = Astronomy.SearchLunarEclipse(start);
    while (le && le.peak.date <= end) { events.push({date: le.peak.date, type: "eclipse", kind: "Lunar", sub: le.kind, lon: bodyLon("Moon", le.peak.date)}); le = Astronomy.NextLunarEclipse(le.peak); }
  } catch (e) { /* eclipses optional */ }
  events.sort((a, b) => a.date - b.date);
  // dedupe aspects repeated on the same day
  const seen = new Set();
  return events.filter(e => {
    const k = e.type + e.date.toISOString().slice(0, 10) + (e.body || "") + (e.natal || "") + (e.asp ? e.asp.name : "") + (e.phase || "") + (e.kind || "") + (e.dir || "") + (e.sign || "");
    if (seen.has(k)) return false; seen.add(k); return true;
  });
}

function progressedPositions(chart, now) {
  const ageYears = (now - chart.date) / (365.2422 * 86400000);
  const pd = new Date(chart.date.getTime() + ageYears * 86400000);
  const p = planetsAt(pd);
  const out = {};
  for (const k of ["Sun","Moon","Mercury","Venus","Mars"]) out[k] = {lon: p.lon[k], house: houseOf(p.lon[k], chart.cusps)};
  return {age: ageYears, pos: out};
}
