/* Compose readings from a chart using the interpretation library. */
const ordinal = n => n + (["th","st","nd","rd"][(n % 100 > 10 && n % 100 < 14) ? 0 : (n % 10 < 4 ? n % 10 : 0)]);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function natalReading(c) {
  const sign = k => signOf(c.lonOf[k]);
  const ascS = signOf(c.asc), mcS = signOf(c.mc);
  const sun = sign("Sun"), moon = sign("Moon");
  const S = [];

  S.push({title: "Big Picture", paras: [
    `You are a ${ascS} Rising, ${sun} Sun, ${moon} Moon. In astrology the Sun shows your core self, the Moon your emotional needs, and the Rising sign the face you show the world and your approach to life.`,
    `Elements: ${elementSummary(c)} ${modalitySummary(c)}`,
  ]});
  S.push({title: `Rising Sign: ${ascS}`, paras: [RISING[ascS], `Your chart ruler is ${RULER[ascS]}${TRAD_RULER[ascS] !== RULER[ascS] ? " (traditionally " + TRAD_RULER[ascS] + ")" : ""}, in ${sign(RULER[ascS])} in the ${ordinal(c.houses[RULER[ascS]])} house (${HOUSE[c.houses[RULER[ascS]]]}). This placement shows where your life energy is most directed.`]});
  S.push({title: `Sun in ${sun}, ${ordinal(c.houses.Sun)} House`, paras: [SUN_SIGN[sun], `In the ${ordinal(c.houses.Sun)} house, your sense of purpose is focused on ${HOUSE[c.houses.Sun]}.`]});
  S.push({title: `Moon in ${moon}, ${ordinal(c.houses.Moon)} House`, paras: [MOON_SIGN[moon], `In the ${ordinal(c.houses.Moon)} house, your emotional life is tied to ${HOUSE[c.houses.Moon]}.`]});
  S.push({title: "Mind, Love and Drive", paras: [
    `Mercury in ${sign("Mercury")} (${ordinal(c.houses.Mercury)} house): ${cap(MERCURY_SIGN[sign("Mercury")])}, applied to ${HOUSE[c.houses.Mercury]}.`,
    `Venus in ${sign("Venus")} (${ordinal(c.houses.Venus)} house): in love and values you are ${VENUS_SIGN[sign("Venus")]}. Themes of affection and money connect to ${HOUSE[c.houses.Venus]}.`,
    `Mars in ${sign("Mars")} (${ordinal(c.houses.Mars)} house): your drive is ${MARS_SIGN[sign("Mars")]}, directed toward ${HOUSE[c.houses.Mars]}.`,
  ]});
  S.push({title: "Growth, Discipline and the Outer Planets", paras: [
    `Jupiter in ${sign("Jupiter")} (${ordinal(c.houses.Jupiter)} house): opportunity and optimism come through ${HOUSE[c.houses.Jupiter]}. You grow in a ${STYLE[sign("Jupiter")]} way.`,
    `Saturn in ${sign("Saturn")} (${ordinal(c.houses.Saturn)} house): your life lessons, responsibilities and eventual mastery are tied to ${HOUSE[c.houses.Saturn]}.${c.rx.Saturn ? " Saturn is retrograde, which often means self-imposed pressure and a late-blooming confidence." : ""}`,
    `Uranus in ${sign("Uranus")} (${ordinal(c.houses.Uranus)} house), Neptune in ${sign("Neptune")} (${ordinal(c.houses.Neptune)} house) and Pluto in ${sign("Pluto")} (${ordinal(c.houses.Pluto)} house) are generational placements; their houses show where you personally feel change (Uranus), idealism and confusion (Neptune), and deep transformation (Pluto): ${HOUSE[c.houses.Uranus]}; ${HOUSE[c.houses.Neptune]}; and ${HOUSE[c.houses.Pluto]}.`,
    `North Node in ${sign("Node")} (${ordinal(c.houses.Node)} house): your growth direction is ${NODE_SIGN[sign("Node")]}, particularly through ${HOUSE[c.houses.Node]}. (Mean node used; the South Node is in ${SIGNS[(SIGNS.indexOf(sign("Node")) + 6) % 12]}.)`,
  ]});

  // personality
  const strongest = c.aspects.filter(a => a.orb < 3).slice(0, 8);
  const aspParas = strongest.map(a => `${a.a} ${a.asp.name.toLowerCase()} ${a.b} (orb ${a.orb.toFixed(1)}°): this ${ASPECT_TEXT[a.asp.name]} ${PLANET[a.a]} and ${PLANET[a.b]}. ${PAIR_NOTE[pairKey(a.a, a.b)] || ""}`);
  S.push({title: "Personality: Strongest Aspects", paras: aspParas.length ? aspParas : ["No very tight aspects; the chart works through sign and house placements."]});

  const hard = c.aspects.filter(a => (a.asp.tone === "hard") && a.orb < 5 && !["Asc","MC"].includes(a.a) &&   !["Asc","MC"].includes(a.b)).slice(0, 5);  const easy = c.aspects.filter(a => a.asp.tone === "easy" && a.orb < 5 && !["Asc","MC"].includes(a.a) && !["Asc","MC"].includes(a.b)).slice(0, 4);
  S.push({title: "Strengths", paras: [
    `Sun in ${sun} and Moon in ${moon} give you: ${STYLE[sun]} willpower and ${STYLE[moon]} feelings. ${easy.length ? "Supportive aspects such as " + easy.map(a => `${a.a} ${a.asp.name.toLowerCase()} ${a.b}`).join(", ") + " are natural talents you can rely on." : ""}`,
  ]});
  S.push({title: "Growth Edges and Recurring Issues", paras: hard.length ? [
    `Challenging aspects show where life asks for growth: ${hard.map(a => `${a.a} ${a.asp.name.toLowerCase()} ${a.b} (${PAIR_NOTE[pairKey(a.a, a.b)] || PLANET[a.a] + " vs " + PLANET[a.b]})`).join(" ")}`,
    `Common lessons: balancing ${PLANET[hard[0].a]} with ${PLANET[hard[0].b]}${hard[1] ? ", and " + PLANET[hard[1].a] + " with " + PLANET[hard[1].b] : ""}.`,
  ] : ["No major hard aspects within a tight orb; growth tends to come from circumstances rather than inner tension."]});

  // career
  const tenth = c.houses, satH = c.houses.Saturn;
  const mcRuler = RULER[mcS];
  const inTenth = ORDER.filter(k => c.houses[k] === 10 && k !== "Node");
  const sixthSign = signOf(c.cusps[5]);
  S.push({title: "Career and Vocation", paras: [
    `Midheaven in ${mcS}: career themes suggest ${MC_CAREER[mcS]}. You want to be known for being ${STYLE[mcS]}.`,
    `The Midheaven ruler, ${mcRuler}, is in ${sign(mcRuler)} in the ${ordinal(c.houses[mcRuler])} house: your career path is shaped by ${HOUSE[c.houses[mcRuler]]}.`,
    inTenth.length ? `Planets in the 10th house (${inTenth.join(", ")}) give your public life extra emphasis: ${inTenth.map(k => PLANET[k]).join("; ")}.` : `No planets sit in the 10th house, so your career direction is read through the Midheaven ruler and the Sun (${sun}, ${ordinal(c.houses.Sun)} house).`,
    `Daily work style (6th house in ${sixthSign}): you work best in a ${STYLE[sixthSign]} way. Saturn in the ${ordinal(satH)} house shows where you build lasting mastery: ${HOUSE[satH]}.`,
    `Money: the 2nd house cusp is in ${signOf(c.cusps[1])}, so earning and spending tend to be ${STYLE[signOf(c.cusps[1])]}.${c.houses.Jupiter === 2 || c.houses.Venus === 2 ? " Jupiter or Venus in the 2nd house is a traditional sign of financial support." : ""}`,
  ]});
  S.push({title: "Health and Well-Being (symbolic, not medical advice)", paras: [
    `Rising sign ${ascS}: tends to relate to the ${BODY_AREA[ascS]}.`,
    `Sun in ${sun}: the ${BODY_AREA[sun]}. Moon in ${moon}: ${BODY_AREA[moon]}, and emotional stress often shows physically here.`,
    `The 6th house of health habits is in ${sixthSign}: routines that are ${STYLE[sixthSign]} suit you.`,
    `Always consult a qualified professional for any medical concern; astrology is a reflective tool only.`,
  ]});
  S.push({title: "Happiness and Fulfilment", paras: [
    SIGN_HAPPY[moon] + " (Moon in " + moon + ")",
    SIGN_HAPPY[sign("Venus")] + " (Venus in " + sign("Venus") + ")",
    `Jupiter in the ${ordinal(c.houses.Jupiter)} house suggests joy and good fortune through ${HOUSE[c.houses.Jupiter]}.`,
  ]});
  S.push({title: "Relationships", paras: [
    `Descendant in ${signOf(c.cusps[6])}: you are drawn to partners who are ${STYLE[signOf(c.cusps[6])]}. The 7th house cusp is in ${signOf(c.cusps[6])}${ORDER.filter(k => c.houses[k] === 7 && k !== "Node").length ? ", with " + ORDER.filter(k => c.houses[k] === 7 && k !== "Node").join(", ") + " in the 7th house, which strongly colors your partnerships" : ""}.`,
    `Venus in ${sign("Venus")}: ${VENUS_SIGN[sign("Venus")]}. Moon in ${moon}: ${MOON_SIGN[moon].toLowerCase()}`,
  ]});
  return S;
}

function elementSummary(c) {
  const cnt = {Fire: 0, Earth: 0, Air: 0, Water: 0};
  const pts = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn"];
  for (const k of pts) cnt[ELEMENT[signOf(c.lonOf[k])]]++; cnt[ELEMENT[signOf(c.asc)]]++;
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  const low = top[top.length - 1];
  return `${top[0][0]} is your strongest element (${top.map(x => x[0] + " " + x[1]).join(", ")} among the seven classical planets and Ascendant). ${ELEMENT_TEXT[top[0][0]]}${low[1] === 0 ? " You have no planets in " + low[0] + ", so that area takes conscious effort." : ""}`;
}
function modalitySummary(c) {
  const cnt = {Cardinal: 0, Fixed: 0, Mutable: 0};
  for (const k of ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn"]) cnt[MODALITY[signOf(c.lonOf[k])]]++; cnt[MODALITY[signOf(c.asc)]]++;
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  return MODALITY_TEXT[top[0]];
}

const fmtDate = d => d.toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric", timeZone: "UTC"});
function monthKey(d) { return d.toLocaleDateString("en-US", {month: "long", year: "numeric", timeZone: "UTC"}); }

function describeEvent(e, c) {
  const date = fmtDate(e.date);
  if (e.type === "lunation") {
    const h = houseOf(e.lon, c.cusps);
    return {date, text: `${e.phase} in ${fmtLon(e.lon)} (your ${ordinal(h)} house): ${LUNATION_TEXT[e.phase]} around ${HOUSE[h]}.`, w: 2};
  }
  if (e.type === "eclipse") {
    const h = houseOf(e.lon, c.cusps);
    return {date, text: `${e.kind} eclipse (${e.sub}) at ${fmtLon(e.lon)} in your ${ordinal(h)} house: eclipses mark turning points and endings or beginnings in ${HOUSE[h]}; effects often unfold over several months.`, w: 4};
  }
  if (e.type === "station") {
    return {date, text: STATION_TEXT[e.body][e.dir] + ` (${e.body} ${e.dir} at ${fmtLon(e.lon)}, your ${ordinal(houseOf(e.lon, c.cusps))} house.)`, w: ["Mercury","Venus","Mars"].includes(e.body) ? 3 : 2};
  }
  if (e.type === "ingress") {
    if (["Sun","Mercury","Venus"].includes(e.body)) return null;
    const h = houseOf(SIGNS.indexOf(e.sign) * 30 + 1, c.cusps);
    return {date, text: `${e.body} enters ${e.sign}: ${TRANSIT_THEME[e.body]} ${HOUSE[h]} (your ${ordinal(h)} house).`, w: ["Jupiter","Saturn"].includes(e.body) ? 4 : 2};
  }
  if (e.type === "aspect") {
    const verb = e.asp.name === "Conjunction" ? "conjunct" : e.asp.name === "Opposition" ? "opposite" : e.asp.name.toLowerCase();
    const note = PAIR_NOTE[pairKey(e.body, e.natal)] ? " " + PAIR_NOTE[pairKey(e.body, e.natal)] : "";
    const tone = e.asp.tone === "easy" ? "supportive" : e.asp.tone === "hard" ? "challenging" : "intensifying";
    const nat = e.natal === "Asc" ? "your Ascendant" : e.natal === "MC" ? "your Midheaven" : `your natal ${e.natal}`;
    return {date, text: `Transiting ${e.body}${e.rx ? " (retrograde)" : ""} ${verb} ${nat}: a ${tone} contact; ${TRANSIT_THEME[e.body]} ${PLANET[e.natal]}.${note}`, w: e.weight + (["Asc","MC","Sun","Moon"].includes(e.natal) ? 1 : 0)};
  }
  return null;
}

function forecastReading(c, start, months, events) {
  const now = transitSnapshot(c, start);
  const out = {current: [], months: [], themes: [], progressed: null};
  for (const p of ["Jupiter","Saturn","Uranus","Neptune","Pluto"]) {
    const h = now.houses[p];
    out.current.push(`${p} in ${fmtLon(now.lon[p])}${now.rx[p] ? " ℞" : ""}, your ${ordinal(h)} house: ${SLOW_IN_HOUSE[p][0]} around ${HOUSE[h]}. ${SLOW_IN_HOUSE[p][1]}`);
  }
  for (const a of now.aspects.slice(0, 10)) {
    const verb = a.asp.name === "Conjunction" ? "conjunct" : a.asp.name === "Opposition" ? "opposite" : a.asp.name.toLowerCase();
    const nat = a.b === "Asc" ? "your Ascendant" : a.b === "MC" ? "your Midheaven" : `natal ${a.b}`;
    const tone = a.asp.tone === "easy" ? "supportive" : a.asp.tone === "hard" ? "challenging" : "intensifying";
    out.current.push(`Transiting ${a.a}${now.rx[a.a] ? " ℞" : ""} is ${verb} ${nat} (orb ${a.orb.toFixed(1)}°), a ${tone} influence on ${PLANET[a.b]}.${PAIR_NOTE[pairKey(a.a, a.b)] ? " " + PAIR_NOTE[pairKey(a.a, a.b)] : ""}`);
  }
  const buckets = new Map();
  for (const e of events) {
    const d = describeEvent(e, c); if (!d) continue;
    const k = monthKey(e.date); if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(d);
  }
  for (const [k, list] of buckets) out.months.push({month: k, items: list});
  // themes
  const jupH = now.houses.Jupiter, satH = now.houses.Saturn, plH = now.houses.Pluto;
  out.themes = [
    `Opportunity (Jupiter, ${ordinal(jupH)} house): ${HOUSE[jupH]}.`,
    `Pressure and building (Saturn, ${ordinal(satH)} house): ${HOUSE[satH]}.`,
    `Deep transformation (Pluto, ${ordinal(plH)} house): ${HOUSE[plH]}.`,
    `Change and awakening (Uranus, ${ordinal(now.houses.Uranus)} house): ${HOUSE[now.houses.Uranus]}.`,
    `Inspiration and fog (Neptune, ${ordinal(now.houses.Neptune)} house): ${HOUSE[now.houses.Neptune]}.`,
  ];
  const pr = progressedPositions(c, start);
  out.progressed = {age: pr.age, items: Object.entries(pr.pos).map(([k, v]) => `Progressed ${k} in ${fmtLon(v.lon)} (${ordinal(v.house)} house).`).concat([
    `Progressed Sun in ${signOf(pr.pos.Sun.lon)}: a life chapter of ${STYLE[signOf(pr.pos.Sun.lon)]} self-expression, focused on ${HOUSE[pr.pos.Sun.house]}.`,
    `Progressed Moon in ${signOf(pr.pos.Moon.lon)}: emotional tone for the next 2.5 years is ${STYLE[signOf(pr.pos.Moon.lon)]}, centered on ${HOUSE[pr.pos.Moon.house]}.`,
  ])};
  return out;
}
