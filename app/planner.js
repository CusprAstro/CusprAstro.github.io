/* Cosmic Planner: deterministic daily guidance derived from transits to the natal chart. */
const PLANNER_DOMAINS = [
  {key:"overall", label:"Overall & luck", icon:"✦", actions:["Set one clear intention and follow the strongest opening.","Say yes to the opportunity that still feels sound after a second look.","Use momentum on a task that benefits several areas of life."], cautions:["Treat a promising signal as permission to skip practical checks.","Pack the day so tightly that useful spontaneity disappears."]},
  {key:"love", label:"Love & relationships", icon:"♡", actions:["Make room for an honest, low-pressure conversation.","Show appreciation in the other person's preferred language.","Choose connection over mind-reading."], cautions:["Force a resolution before both people are ready.","Read temporary mood as a permanent verdict."]},
  {key:"career", label:"Career & work", icon:"◇", actions:["Move the most visible, consequential task forward.","Ask for clarity on ownership, expectations or the next milestone.","Document progress and make the next decision easy."], cautions:["Commit to a deadline before checking capacity.","Turn useful feedback into a referendum on your worth."]},
  {key:"money", label:"Money & purchases", icon:"$", actions:["Review the numbers before making the decision.","Compare long-term value, not only the immediate price.","Handle one practical money task you have postponed."], cautions:["Make an impulse purchase to change your mood.","Treat symbolic timing as financial advice."]},
  {key:"health", label:"Health & energy", icon:"◌", actions:["Match the workload to your actual energy.","Choose a sustainable routine over an all-or-nothing push.","Build in food, hydration, movement and recovery."], cautions:["Ignore symptoms or substitute astrology for qualified care.","Spend tomorrow's energy to impress someone today."]},
  {key:"travel", label:"Travel & exploration", icon:"⌁", actions:["Confirm the route, timing and backup plan.","Explore a new place, idea or perspective with curiosity.","Leave extra room for discovery and delays."], cautions:["Rush logistics or assume every connection will run perfectly.","Book from restlessness without checking the details."]},
  {key:"creativity", label:"Creativity & entertainment", icon:"✧", actions:["Make, watch or play with something outside your usual lane.","Share a draft before polishing away its personality.","Use the day's mood as a creative constraint."], cautions:["Wait for perfect inspiration before beginning.","Confuse attention with artistic value."]},
  {key:"home", label:"Home & family", icon:"⌂", actions:["Improve one small part of your environment.","Create a calmer rhythm for the people who share your space.","Address the practical need underneath an emotional reaction."], cautions:["Reopen an old family pattern just to win the current argument.","Take responsibility for feelings that are not yours to manage."]},
  {key:"communication", label:"Communication & learning", icon:"↗", actions:["Write the key point before the meeting or message.","Ask one better question and listen past the first answer.","Study, edit or organize information that has been scattered."], cautions:["Send the fast reply before checking tone and facts.","Mistake volume or certainty for clarity."]},
  {key:"rest", label:"Rest & reflection", icon:"☾", actions:["Protect a quiet interval with no performance goal.","Journal, meditate or take a slow walk without solving everything.","Close one open loop, then deliberately stop."], cautions:["Use withdrawal to avoid a conversation that needs care.","Turn rest into another metric to optimize."]}
];

const PLANNER_DOMAIN = Object.fromEntries(PLANNER_DOMAINS.map(x => [x.key, x]));
const PLANET_DOMAINS = {
  Sun:["overall","career","health","creativity"], Moon:["love","health","home","rest"],
  Mercury:["career","money","travel","communication"], Venus:["overall","love","money","creativity","home"],
  Mars:["career","health","travel","creativity"], Jupiter:["overall","career","money","travel","communication"],
  Saturn:["career","money","health","home","rest"], Uranus:["overall","career","travel","creativity","communication"],
  Neptune:["love","health","creativity","rest"], Pluto:["overall","career","money","love","rest"],
  Node:["overall","career","love"], Asc:["overall","health"], MC:["career","overall"]
};
const HOUSE_DOMAINS = {
  1:["overall","health"], 2:["money"], 3:["communication","travel"], 4:["home","rest"],
  5:["love","creativity"], 6:["career","health"], 7:["love"], 8:["money","love","rest"],
  9:["travel","communication"], 10:["career","overall"], 11:["overall","love","communication"], 12:["health","rest"]
};
const PLANET_WEIGHT = {Sun:6,Moon:4,Mercury:6,Venus:7,Mars:7,Jupiter:10,Saturn:10,Uranus:9,Neptune:9,Pluto:9,Node:6};
const CONJUNCTION_TONE = {Sun:.45,Moon:.1,Mercury:.1,Venus:.7,Mars:-.15,Jupiter:.85,Saturn:-.45,Uranus:0,Neptune:-.1,Pluto:-.25,Node:.1};
const MOON_GUIDE = {
  Aries:{theme:"initiate with courage",color:"#ff6f61",genre:"action or sports drama",boost:["career","health"],ease:["rest"]},
  Taurus:{theme:"stabilize what matters",color:"#7fc36a",genre:"food, nature or comfort comedy",boost:["money","home"],ease:["travel"]},
  Gemini:{theme:"connect the dots",color:"#ffd166",genre:"witty mystery or ensemble comedy",boost:["communication","travel"],ease:["rest"]},
  Cancer:{theme:"protect and replenish",color:"#a9d6e5",genre:"family drama or nostalgic classic",boost:["home","love"],ease:["career"]},
  Leo:{theme:"create and be seen",color:"#ffb347",genre:"musical, awards drama or big adventure",boost:["creativity","overall"],ease:["rest"]},
  Virgo:{theme:"refine the system",color:"#b7c98b",genre:"documentary or precise procedural",boost:["health","career"],ease:["love"]},
  Libra:{theme:"restore balance",color:"#f3a6c8",genre:"romance or stylish social comedy",boost:["love","creativity"],ease:["career"]},
  Scorpio:{theme:"go beneath the surface",color:"#8d5a97",genre:"psychological thriller or noir",boost:["rest","love"],ease:["communication"]},
  Sagittarius:{theme:"widen the horizon",color:"#7b8cff",genre:"road movie, epic or travel documentary",boost:["travel","overall"],ease:["home"]},
  Capricorn:{theme:"build for the long term",color:"#9aa0a6",genre:"historical drama or ambitious biography",boost:["career","money"],ease:["creativity"]},
  Aquarius:{theme:"experiment intelligently",color:"#55c2ff",genre:"science fiction or inventive indie",boost:["communication","creativity"],ease:["home"]},
  Pisces:{theme:"listen to imagination",color:"#8fb9ff",genre:"fantasy, music film or gentle animation",boost:["rest","creativity"],ease:["money"]}
};

const clampScore = n => Math.max(18, Math.min(92, Math.round(n)));
const utcDate = value => {
  const s = typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  return new Date(s + "T12:00:00Z");
};
const plannerDateKey = value => utcDate(value).toISOString().slice(0, 10);
const plannerAspectTone = (body, aspect) => aspect.tone === "easy" ? 1 : aspect.tone === "hard" ? -1 : (CONJUNCTION_TONE[body] || 0);
const plannerAspectText = (a, p, c) => {
  const natal = a.b === "Asc" ? "Ascendant" : a.b === "MC" ? "Midheaven" : `natal ${a.b}`;
  const motion = p.rx[a.a] ? " retrograde" : "";
  return `${a.a}${motion} ${a.asp.name.toLowerCase()} ${natal} (${a.orb.toFixed(1)}°), moving through your ${ordinal(houseOf(p.lon[a.a], c.cusps))} house`;
};

function plannerDay(chart, value) {
  const date = utcDate(value), p = planetsAt(date), moonSign = signOf(p.lon.Moon), moon = MOON_GUIDE[moonSign];
  const raw = Object.fromEntries(PLANNER_DOMAINS.map(d => [d.key, 50]));
  const notes = Object.fromEntries(PLANNER_DOMAINS.map(d => [d.key, []]));
  const aspects = findAspects(p.lon, chart.points, false, .58, (a, b) => a !== "Node" && !(a === b && Math.abs(diff180(p.lon[a] - chart.points[b])) > 5));
  for (const a of aspects) {
    const tone = plannerAspectTone(a.a, a.asp);
    const exactness = Math.max(.15, 1 - a.orb / Math.max(1, a.asp.orb * .58));
    const impact = tone * (PLANET_WEIGHT[a.a] || 5) * exactness;
    const transitHouse = houseOf(p.lon[a.a], chart.cusps);
    const domains = new Set([...(PLANET_DOMAINS[a.a] || []), ...(PLANET_DOMAINS[a.b] || []), ...(HOUSE_DOMAINS[transitHouse] || [])]);
    const text = plannerAspectText(a, p, chart);
    for (const key of domains) {
      raw[key] += impact;
      notes[key].push({text, impact, exactness});
    }
  }
  for (const key of moon.boost) raw[key] += 4;
  for (const key of moon.ease) raw[key] -= 2;
  raw.overall += ((raw.love + raw.career + raw.money + raw.health + raw.creativity) / 5 - 50) * .35;
  const domains = PLANNER_DOMAINS.map(d => {
    const score = clampScore(raw[d.key]);
    const sorted = notes[d.key].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    const totalStrength = sorted.slice(0, 4).reduce((sum, x) => sum + Math.abs(x.impact), 0);
    const confidence = sorted.length >= 4 && totalStrength >= 18 ? "High" : sorted.length >= 2 ? "Medium" : "Low";
    const strength = totalStrength >= 22 ? "Strong" : totalStrength >= 10 ? "Moderate" : "Subtle";
    const mode = score >= 64 ? "flow" : score <= 42 ? "caution" : "steady";
    const action = d.actions[(date.getUTCDate() + d.key.length) % d.actions.length];
    const avoid = d.cautions[(date.getUTCDate() + d.label.length) % d.cautions.length];
    return {...d, score, mode, confidence, strength, action, avoid, rationale: sorted.slice(0, 3).map(x => x.text)};
  });
  const strongest = domains.filter(x => x.key !== "overall").sort((a, b) => b.score - a.score)[0];
  const overall = domains.find(x => x.key === "overall");
  return {
    date: plannerDateKey(date), moonSign, moonLongitude:p.lon.Moon, color:moon.color,
    theme:`${moonSign} Moon: ${moon.theme}. ${strongest.label} has the clearest tailwind.`,
    genre:moon.genre, overall:overall.score, domains,
    best:domains.filter(x => x.key !== "overall").sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.key),
    cautions:domains.filter(x => x.key !== "overall").sort((a, b) => a.score - b.score).slice(0, 2).map(x => x.key),
    transitCount:aspects.length
  };
}

function plannerMonth(chart, year, monthIndex) {
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return Array.from({length:days}, (_, i) => plannerDay(chart, new Date(Date.UTC(year, monthIndex, i + 1, 12))));
}

function plannerHighlights(days, domainKey = "overall") {
  const score = d => (d.domains.find(x => x.key === domainKey) || d.domains[0]).score;
  const ranked = [...days].sort((a, b) => score(b) - score(a));
  return {best:ranked.slice(0, 4), caution:[...ranked].reverse().slice(0, 4)};
}
