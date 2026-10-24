"use strict";

const PLANNER_CATEGORIES = {
  overall: {label: "Overall", icon: "✦", planets: ["Sun", "Moon", "Jupiter", "Saturn"], houses: [1, 4, 7, 10]},
  luck: {label: "Luck", icon: "☘", planets: ["Jupiter", "Venus", "Sun"], houses: [1, 5, 9, 11]},
  love: {label: "Love", icon: "♥", planets: ["Venus", "Moon", "Mars"], houses: [5, 7, 8]},
  career: {label: "Career", icon: "◆", planets: ["Sun", "Saturn", "Jupiter", "Mars"], houses: [6, 10, 11]},
  money: {label: "Money & purchases", icon: "¤", planets: ["Venus", "Jupiter", "Saturn", "Mercury"], houses: [2, 8, 10]},
  energy: {label: "Health & energy", icon: "●", planets: ["Sun", "Mars", "Moon", "Saturn"], houses: [1, 6, 12]},
  travel: {label: "Travel", icon: "➜", planets: ["Mercury", "Jupiter", "Mars"], houses: [3, 9, 12]},
  creativity: {label: "Creativity & entertainment", icon: "★", planets: ["Venus", "Neptune", "Sun", "Moon"], houses: [5, 11]},
  home: {label: "Home & family", icon: "⌂", planets: ["Moon", "Venus", "Saturn"], houses: [4, 7, 10]},
  communication: {label: "Communication & learning", icon: "✎", planets: ["Mercury", "Jupiter", "Uranus"], houses: [3, 9, 11]},
  rest: {label: "Rest & reflection", icon: "☾", planets: ["Moon", "Neptune", "Saturn"], houses: [4, 8, 12]},
};
const PLANNER_ACTIONS = {
  overall: [["Choose the one priority that matters most", "Leave margin around commitments"], ["Overbook the day", "Treat a mood as a verdict"]],
  luck: [["Follow a warm introduction", "Try a low-risk experiment"], ["Rely on chance alone", "Promise more than you can deliver"]],
  love: [["Say what you appreciate directly", "Make room for unhurried connection"], ["Force an answer", "Read certainty into mixed signals"]],
  career: [["Ship a concrete next step", "Ask for clear expectations"], ["Challenge authority impulsively", "Confuse urgency with importance"]],
  money: [["Compare terms and total cost", "Prioritize durable value"], ["Impulse-buy to change your mood", "Ignore fees or return terms"]],
  energy: [["Pace effort and protect sleep", "Choose sustainable movement"], ["Push through pain or exhaustion", "Use this score as medical advice"]],
  travel: [["Confirm timing, documents and backups", "Allow extra transit time"], ["Book under pressure", "Skip practical checks"]],
  creativity: [["Make a rough first version", "Collect unusual references"], ["Wait for perfect inspiration", "Over-edit before the idea can breathe"]],
  home: [["Handle one practical home task", "Listen before fixing"], ["Reopen an old conflict casually", "Take family reactions personally"]],
  communication: [["Write the key point down", "Ask one clarifying question"], ["Send the heated draft", "Assume everyone shares your context"]],
  rest: [["Reduce inputs and review quietly", "Journal or take a slow walk"], ["Call recovery laziness", "Make a major decision while depleted"]],
};
const MOON_THEMES = [
  ["Aries", "Initiate", "#ef6a5b", "Action adventure"], ["Taurus", "Ground", "#7bbf72", "Comfort drama"],
  ["Gemini", "Connect", "#f0c75e", "Clever comedy"], ["Cancer", "Nurture", "#9db9e8", "Family story"],
  ["Leo", "Express", "#f59e4b", "Big-hearted musical"], ["Virgo", "Refine", "#9abf7a", "Mystery"],
  ["Libra", "Balance", "#e9a6c8", "Romantic comedy"], ["Scorpio", "Transform", "#9b6fc8", "Psychological thriller"],
  ["Sagittarius", "Explore", "#7d8ee8", "Road movie"], ["Capricorn", "Build", "#8d91a5", "Historical drama"],
  ["Aquarius", "Reimagine", "#5bc5d8", "Science fiction"], ["Pisces", "Dream", "#7f9be8", "Fantasy"],
];
const PLANET_WEIGHT = {Sun: 1.15, Moon: .8, Mercury: .75, Venus: .9, Mars: .85, Jupiter: 1.15, Saturn: 1.05, Uranus: .8, Neptune: .75, Pluto: .9, Node: .55};
const TONE_VALUE = {easy: 1, neutral: .35, hard: -1};
const plannerDateKey = d => d.toISOString().slice(0, 10);
const plannerClamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function plannerCacheGet(key) {
  try {
    const all = JSON.parse(localStorage.getItem("cuspr.planner.v1") || "{}");
    return all[key] && Date.now() - all[key].saved < 7 * 86400000 ? all[key].value : null;
  } catch (e) { return null; }
}
function plannerCachePut(key, value) {
  try {
    const all = JSON.parse(localStorage.getItem("cuspr.planner.v1") || "{}");
    all[key] = {saved: Date.now(), value};
    const trimmed = Object.fromEntries(Object.entries(all).sort((a, b) => b[1].saved - a[1].saved).slice(0, 8));
    localStorage.setItem("cuspr.planner.v1", JSON.stringify(trimmed));
  } catch (e) {}
}
function plannerAspectImpact(transit, natal, category) {
  const separation = Math.abs(diff180(transit.lon - natal.lon));
  let best = null;
  for (const asp of ASPECTS) {
    const orb = Math.abs(separation - asp.angle);
    if (orb <= Math.min(asp.orb, 6) && (!best || orb < best.orb)) best = {asp, orb};
  }
  if (!best || (!category.planets.includes(transit.name) && !category.planets.includes(natal.name))) return null;
  const tightness = 1 - best.orb / Math.min(best.asp.orb, 6);
  return {
    value: TONE_VALUE[best.asp.tone] * PLANET_WEIGHT[transit.name] * (.45 + .55 * tightness),
    orb: best.orb, aspect: best.asp.name, tone: best.asp.tone, transit: transit.name, natal: natal.name,
  };
}
function plannerScoreDay(chart, date) {
  const p = planetsAt(date);
  const transits = ORDER.map(name => ({name, lon: p.lon[name], house: houseOf(p.lon[name], chart.cusps)}));
  const natal = Object.entries(chart.points).map(([name, lon]) => ({name, lon}));
  const scores = {}, reasons = {};
  for (const [key, category] of Object.entries(PLANNER_CATEGORIES)) {
    let raw = 0, evidence = [], impacts = [];
    for (const t of transits) {
      if (category.houses.includes(t.house)) {
        const houseValue = ["Jupiter", "Venus", "Sun"].includes(t.name) ? .34 : ["Saturn", "Mars", "Pluto"].includes(t.name) ? -.18 : .12;
        raw += houseValue;
        if (Math.abs(houseValue) >= .18) evidence.push({value: houseValue, text: `${t.name} moving through house ${t.house}`});
      }
      for (const n of natal) {
        const impact = plannerAspectImpact(t, n, category);
        if (impact) {
          impacts.push({value: impact.value, text: `${impact.transit} ${impact.aspect.toLowerCase()} natal ${impact.natal} (${impact.orb.toFixed(1)}°)`});
        }
      }
    }
    impacts.sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 6).forEach((item, i) => {
      raw += item.value * [1, .85, .7, .55, .4, .3][i];
      evidence.push(item);
    });
    scores[key] = Math.round(plannerClamp(58 + raw * 7, 18, 92));
    const sorted = evidence.sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 3);
    reasons[key] = sorted.length ? sorted.map(x => x.text) : ["No unusually tight major transit dominates this area"];
  }
  scores.overall = Math.round(Object.entries(scores).filter(([k]) => k !== "overall").reduce((sum, [, v]) => sum + v, 0) / (Object.keys(scores).length - 1));
  const moon = MOON_THEMES[Math.floor(norm(p.lon.Moon) / 30)];
  const spread = Math.max(...Object.values(scores)) - Math.min(...Object.values(scores));
  const evidenceCount = Object.values(reasons).flat().filter(x => !x.startsWith("No unusually")).length;
  const confidence = plannerClamp(Math.round(48 + evidenceCount * 2.1 + Math.min(spread, 28)), 48, 92);
  const ranked = Object.entries(scores).filter(([k]) => k !== "overall").sort((a, b) => b[1] - a[1]);
  const strongest = ranked[0][0], weakest = ranked[ranked.length - 1][0];
  return {
    date: plannerDateKey(date), scores, reasons, confidence,
    moon: {sign: moon[0], theme: moon[1], color: moon[2], genre: moon[3], longitude: p.lon.Moon},
    strongest, weakest, suggested: PLANNER_ACTIONS[strongest][0], avoid: PLANNER_ACTIONS[weakest][1],
  };
}
function buildPlannerMonth(chart, year, month) {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cacheKey = `${chart.date.toISOString()}|${chart.lat}|${chart.lon}|${year}-${String(month).padStart(2, "0")}`;
  const cached = plannerCacheGet(cacheKey);
  if (cached) return cached;
  const value = Array.from({length: days}, (_, i) => plannerScoreDay(chart, new Date(Date.UTC(year, month - 1, i + 1, 12))));
  plannerCachePut(cacheKey, value);
  return value;
}
function plannerRank(days) {
  const sorted = [...days].sort((a, b) => b.scores.overall - a.scores.overall);
  return {best: sorted.slice(0, 3), caution: sorted.slice(-3).reverse()};
}
function plannerAccessibleScore(score) {
  return score >= 72 ? "strong" : score >= 58 ? "supportive" : score >= 43 ? "mixed" : "caution";
}
