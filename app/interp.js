/* Interpretation library — traditional Western meanings with a modern psychological emphasis. */
const ELEMENT = {Aries:"Fire",Leo:"Fire",Sagittarius:"Fire",Taurus:"Earth",Virgo:"Earth",Capricorn:"Earth",Gemini:"Air",Libra:"Air",Aquarius:"Air",Cancer:"Water",Scorpio:"Water",Pisces:"Water"};
const MODALITY = {Aries:"Cardinal",Cancer:"Cardinal",Libra:"Cardinal",Capricorn:"Cardinal",Taurus:"Fixed",Leo:"Fixed",Scorpio:"Fixed",Aquarius:"Fixed",Gemini:"Mutable",Virgo:"Mutable",Sagittarius:"Mutable",Pisces:"Mutable"};
const ELEMENT_TEXT = {
  Fire: "Fire is the element of initiative, enthusiasm and courage. A strong fire emphasis gives energy and inspiration; the risk is impatience and burnout.",
  Earth: "Earth is the element of practicality, patience and results. A strong earth emphasis gives reliability and material skill; the risk is rigidity and over-caution.",
  Air: "Air is the element of ideas, communication and connection. A strong air emphasis gives curiosity and social intelligence; the risk is overthinking and detachment.",
  Water: "Water is the element of feeling, intuition and empathy. A strong water emphasis gives emotional depth and sensitivity; the risk is overwhelm and moodiness.",
};
const MODALITY_TEXT = {
  Cardinal: "Cardinal emphasis: you are a starter who likes to lead, set direction and make things happen.",
  Fixed: "Fixed emphasis: you are a sustainer with persistence, loyalty and staying power, but resistance to change.",
  Mutable: "Mutable emphasis: you are adaptable and versatile, good at adjusting, but can scatter your energy.",
};
const STYLE = { // how each sign tends to express a planet
  Aries:"direct, bold and fast-moving", Taurus:"steady, sensual and determined", Gemini:"curious, quick and versatile",
  Cancer:"protective, intuitive and emotionally attuned", Leo:"warm, proud and expressive", Virgo:"careful, analytical and service-minded",
  Libra:"diplomatic, fair-minded and relationship-oriented", Scorpio:"intense, private and transformative", Sagittarius:"optimistic, free-spirited and truth-seeking",
  Capricorn:"disciplined, strategic and ambitious", Aquarius:"independent, original and unconventional", Pisces:"gentle, imaginative and boundary-dissolving",
};
const HOUSE = [
  "", "self, body, appearance and how you start things", "money, possessions, skills and self-worth", "communication, learning, siblings and your local environment",
  "home, family, roots and private life", "romance, creativity, pleasure and children", "daily work, routines, service and health habits",
  "partnerships, marriage, clients and open conflict", "shared resources, intimacy, depth, debts and transformation", "higher learning, travel, belief and publishing",
  "career, public reputation and long-term goals", "friends, groups, communities and future hopes", "solitude, the subconscious, hidden matters and rest",
];
const HOUSE_SHORT = ["", "1st (self)", "2nd (money)", "3rd (communication)", "4th (home)", "5th (creativity & romance)", "6th (work & health)", "7th (partnership)", "8th (intimacy & shared resources)", "9th (beliefs & travel)", "10th (career)", "11th (friends & goals)", "12th (inner life)"];
const PLANET = {
  Sun:"core identity, vitality and purpose", Moon:"emotions, instincts and need for security", Mercury:"thinking, speaking and learning", Venus:"love, values and enjoyment",
  Mars:"drive, desire and assertiveness", Jupiter:"growth, optimism and opportunity", Saturn:"discipline, responsibility and structure", Uranus:"change, freedom and originality",
  Neptune:"imagination, intuition and ideals", Pluto:"power, depth and transformation", Node:"the direction of growth in this life", Asc:"how you present yourself and approach new beginnings", MC:"career, reputation and long-term direction",
};

const SUN_SIGN = {
  Aries:"You are a self-starter with courage, competitive spirit and a need for independence. You act first and think later, and you thrive on challenge. Your lesson is patience and finishing what you start.",
  Taurus:"You are steady, loyal and grounded, with a love of beauty, comfort and the senses. You build slowly and keep what you build. Your lesson is flexibility; stubbornness is your main trap.",
  Gemini:"You are curious, witty and quick to learn, with a need for variety and conversation. You connect ideas and people. Your lesson is focus and depth over scattered attention.",
  Cancer:"You are caring, protective and deeply feeling, with strong family and home instincts. You read moods easily. Your lesson is emotional resilience and not taking everything personally.",
  Leo:"You are warm, generous and creative, with natural presence and a need to be appreciated. You lead through heart. Your lesson is humility and sharing the spotlight.",
  Virgo:"You are observant, practical and helpful, with high standards and a gift for improving things. Your lesson is self-acceptance; perfectionism and worry are the main traps.",
  Libra:"You are gracious, fair and relationship-minded, with an eye for balance and beauty. Your lesson is decisiveness and owning your needs rather than keeping the peace at any cost.",
  Scorpio:"You are intense, perceptive and resilient, with a need for depth and truth. You transform through crisis. Your lesson is trust and releasing control or grudges.",
  Sagittarius:"You are adventurous, honest and optimistic, with a need for freedom and meaning. You are a natural student and teacher. Your lesson is tact, commitment and follow-through.",
  Capricorn:"You are disciplined, responsible and ambitious, with patience for long-term goals. You gain authority with age. Your lesson is to allow joy, rest and vulnerability.",
  Aquarius:"You are independent, inventive and humanitarian, with a mind of your own. You value friendship and ideas. Your lesson is emotional closeness and accepting that you are not always detached.",
  Pisces:"You are compassionate, imaginative and intuitive, with a porous sensitivity to others. You are drawn to art and spirit. Your lesson is boundaries and grounding your dreams in action.",
};
const MOON_SIGN = {
  Aries:"Emotionally you react quickly and honestly; you need action, independence and room to be spontaneous. Anger flares and fades fast.",
  Taurus:"Emotionally you need calm, comfort and physical affection. You are loyal and slow to change, and security (including financial) soothes you.",
  Gemini:"Emotionally you process by talking and thinking. You need mental stimulation and variety, and can intellectualize feelings instead of feeling them.",
  Cancer:"Emotionally you are tender, protective and moody like the tides. Home, family and being needed give you security; you can retreat into a shell when hurt.",
  Leo:"Emotionally you need appreciation, warmth and loyalty. You are generous and dramatic with feelings, and pride makes it hard to ask for support.",
  Virgo:"Emotionally you feel secure when useful and organized. You show love through help and can be self-critical or anxious under stress.",
  Libra:"Emotionally you need harmony, companionship and fairness. You are charming and avoid conflict, sometimes at the cost of your own needs.",
  Scorpio:"Emotionally you feel everything deeply and privately. You need trust and loyalty, and you can be intense, guarded and slow to forgive.",
  Sagittarius:"Emotionally you need freedom, optimism and meaning. You bounce back quickly and dislike clinginess, but may avoid heavy feelings with humor or movement.",
  Capricorn:"Emotionally you are reserved and self-reliant, expressing care through responsibility. You may not show vulnerability easily, and feel safest when in control.",
  Aquarius:"Emotionally you are cool, independent and friendly, needing space and intellectual connection. You may analyze feelings instead of sharing them.",
  Pisces:"Emotionally you are empathic, dreamy and absorbent. You need solitude, creativity and spiritual connection, and must guard against taking on others' pain.",
};
const RISING = {
  Aries:"You come across as direct, energetic and confident. People see a pioneer who takes the initiative. First impressions are bold and a little impatient.",
  Taurus:"You come across as calm, steady and physically grounded. People see someone reliable with good taste and a slow, deliberate pace.",
  Gemini:"You come across as curious, talkative and youthful. People see a quick, witty communicator who is always interested in something new.",
  Cancer:"You come across as soft, protective and approachable, though guarded at first. People sense your sensitivity and nurturing nature.",
  Leo:"You come across as warm, dignified and magnetic. People notice your presence and sense of style and expect you to lead.",
  Virgo:"You come across as modest, neat and observant. People see a capable, helpful person with a careful eye for detail.",
  Libra:"You come across as charming, polite and balanced. People see a diplomatic, attractive person who is easy to be around.",
  Scorpio:"You come across as intense, magnetic and a little mysterious. People feel your depth and sense that you notice everything.",
  Sagittarius:"You come across as friendly, upbeat and adventurous. People see an honest, enthusiastic person with big ideas.",
  Capricorn:"You come across as serious, capable and composed, often seeming older than your years. People see an authority who can be relied on.",
  Aquarius:"You come across as friendly yet distinctive, a bit detached and unconventional. People see an original thinker who does things their own way.",
  Pisces:"You come across as gentle, dreamy and adaptable. People sense your empathy and artistic or spiritual side, and you take on the mood of your surroundings.",
};
const MERCURY_SIGN = {
  Aries:"quick, blunt and decisive thinking", Taurus:"slow, practical and persistent thinking", Gemini:"agile, curious and verbal thinking", Cancer:"memory-driven, intuitive and mood-sensitive thinking",
  Leo:"confident, dramatic and creative communication", Virgo:"precise, analytical and detail-oriented thinking", Libra:"balanced, diplomatic thinking that weighs both sides", Scorpio:"investigative, penetrating and secretive thinking",
  Sagittarius:"big-picture, philosophical and candid thinking", Capricorn:"structured, strategic and serious thinking", Aquarius:"original, independent and abstract thinking", Pisces:"imaginative, intuitive and impressionistic thinking",
};
const VENUS_SIGN = {
  Aries:"direct, passionate and quick to pursue; you love the chase", Taurus:"loyal, sensual and affectionate; you value comfort, touch and stability", Gemini:"playful, chatty and mentally stimulated; you need friendship in love",
  Cancer:"nurturing, devoted and sentimental; you need emotional safety", Leo:"warm, generous and romantic; you love to give and receive admiration", Virgo:"modest, thoughtful and helpful; you show love through acts of service",
  Libra:"graceful, romantic and partnership-oriented; you value harmony and beauty", Scorpio:"intense, committed and all-or-nothing; you seek deep bonding", Sagittarius:"free-spirited and fun-loving; you need honesty and adventure",
  Capricorn:"reserved, loyal and serious; you value commitment and long-term security", Aquarius:"friendly, independent and unconventional; you need freedom and friendship", Pisces:"romantic, devoted and idealistic; you love selflessly and dreamily",
};
const MARS_SIGN = {
  Aries:"fast, competitive and courageous", Taurus:"slow-burning, stubborn and enduring", Gemini:"restless, verbal and multitasking", Cancer:"indirect, protective and moody when angry",
  Leo:"proud, dramatic and generous", Virgo:"precise, industrious and critical", Libra:"diplomatic, indirect and conflict-averse", Scorpio:"strategic, intense and relentless",
  Sagittarius:"enthusiastic, restless and adventurous", Capricorn:"disciplined, strategic and enduring", Aquarius:"unconventional, detached and rebellious", Pisces:"fluid, intuitive and sometimes passive or indirect",
};
const MC_CAREER = {
  Aries:"leadership, entrepreneurship, sports, the military or emergency services, engineering and any pioneering role",
  Taurus:"finance, banking, real estate, agriculture, the arts, food, luxury goods and anything involving tangible value",
  Gemini:"writing, media, teaching, sales, technology, translation and communications",
  Cancer:"caregiving, healthcare, hospitality, real estate, education, food and family businesses",
  Leo:"management, entertainment, education, the creative arts, politics and any role with visible leadership",
  Virgo:"healthcare, analysis, editing, research, administration, technical or quality-focused work",
  Libra:"law, mediation, design, diplomacy, the arts, public relations and partnership-based work",
  Scorpio:"research, investigation, psychology, finance and insurance, surgery or medicine, crisis work and anything involving other people's resources or secrets",
  Sagittarius:"teaching, publishing, law, travel, international business, philosophy and coaching",
  Capricorn:"executive management, government, engineering, finance, construction and established institutions",
  Aquarius:"technology, science, social causes, innovation, networks and unconventional fields",
  Pisces:"the arts, healing, counselling, spirituality, music, film, non-profit and care work",
};
const BODY_AREA = {
  Aries:"head, face, eyes and adrenal energy (headaches, tension, accidents from haste)", Taurus:"throat, neck, thyroid and metabolism", Gemini:"lungs, arms, hands, shoulders and the nervous system",
  Cancer:"chest, stomach and digestion (strongly tied to emotions)", Leo:"heart, upper back and spine, and circulation", Virgo:"digestive system, intestines and nervous stress",
  Libra:"kidneys, lower back and skin balance", Scorpio:"reproductive and elimination systems, and stress-related burnout", Sagittarius:"hips, thighs, liver and the sciatic nerve",
  Capricorn:"bones, joints, knees, teeth and skin", Aquarius:"ankles, circulation and the nervous system", Pisces:"feet, immune system, sleep and sensitivity to substances",
};
const SIGN_HAPPY = {
  Aries:"Happiness comes from challenge, movement, independence and winning small victories.", Taurus:"Happiness comes from comfort, good food, nature, touch, music and a stable home.",
  Gemini:"Happiness comes from conversation, learning, variety and good company.", Cancer:"Happiness comes from family, home, belonging and caring for people you love.",
  Leo:"Happiness comes from creative self-expression, recognition, play and generous love.", Virgo:"Happiness comes from being useful, well-organized and improving things.",
  Libra:"Happiness comes from companionship, beauty, harmony and fair relationships.", Scorpio:"Happiness comes from deep trust, meaningful work and emotional honesty.",
  Sagittarius:"Happiness comes from freedom, travel, learning and a sense of purpose.", Capricorn:"Happiness comes from achievement, mastery and a secure future.",
  Aquarius:"Happiness comes from friendship, ideas, independence and contributing to something larger.", Pisces:"Happiness comes from creativity, spirituality, music and quiet time.",
};

const ASPECT_TEXT = {
  Conjunction: "blends and intensifies",
  Sextile: "offers easy opportunity between",
  Square: "creates friction and a push toward growth between",
  Trine: "flows naturally and supportively between",
  Opposition: "creates a see-saw that needs balance between",
};
const PAIR_NOTE = {
  "Moon|Neptune": "Intuition and empathy are heightened, as is the tendency to absorb others' moods or idealize.",
  "Sun|Pluto": "Strong will and an intense, transformative life path; power and control themes recur in close relationships.",
  "Sun|Saturn": "Self-discipline and seriousness; a strong work ethic, with a need to overcome self-doubt.",
  "Sun|Jupiter": "Optimism, generosity and good fortune when you act with confidence.",
  "Sun|Moon": "Head and heart are either well-integrated or pulling in different directions, depending on the aspect.",
  "Sun|Mars": "Energy, courage and competitiveness.",
  "Sun|Venus": "Charm and affection.",
  "Sun|Uranus": "Independence, originality and a need for freedom.",
  "Sun|Neptune": "Creativity, idealism and sensitivity to subtle things.",
  "Moon|Saturn": "Emotional restraint and responsibility; feeling safe takes time.",
  "Moon|Pluto": "Emotional intensity and deep transformation through feeling.",
  "Moon|Jupiter": "Emotional generosity and optimism.",
  "Moon|Mars": "Passionate, reactive emotions.",
  "Moon|Venus": "Warmth, charm and a need for affection.",
  "Moon|Uranus": "Emotional restlessness and need for freedom.",
  "Venus|Mars": "Strong attraction and a lively love life.",
  "Venus|Saturn": "Loyalty and commitment, sometimes with fear of rejection.",
  "Venus|Pluto": "Intense, transformative love and strong attachments.",
  "Venus|Jupiter": "Generosity, affection and good luck in love and money.",
  "Venus|Neptune": "Romantic idealism and artistic gifts; avoid rose-colored glasses.",
  "Venus|Uranus": "Unconventional attractions and a need for freedom in love.",
  "Mercury|Saturn": "Disciplined, structured thinking; sometimes worry or self-criticism.",
  "Mercury|Neptune": "Imaginative, intuitive thinking; check facts and avoid vagueness.",
  "Mercury|Pluto": "Penetrating, investigative thinking.",
  "Mercury|Jupiter": "Optimistic, big-picture thinking and a love of learning.",
  "Mercury|Uranus": "Inventive, quick and unconventional ideas.",
  "Mercury|Mars": "Sharp, argumentative or fast-thinking style.",
  "Mars|Saturn": "Controlled, enduring energy; frustration if blocked.",
  "Mars|Pluto": "Powerful drive and intensity; avoid power struggles.",
  "Mars|Jupiter": "Confident, enthusiastic action.",
  "Mars|Neptune": "Idealistic drive but diffuse energy; spiritual or artistic action.",
  "Mars|Uranus": "Impulsive, independent energy and quick reactions.",
  "Jupiter|Saturn": "Tension or balance between expansion and caution.",
  "Jupiter|Uranus": "Sudden opportunities and a love of freedom.",
  "Jupiter|Neptune": "Faith, compassion and imagination; avoid overpromising.",
  "Jupiter|Pluto": "Large-scale ambition and opportunities through transformation.",
  "Saturn|Uranus": "Tension between security and change.",
  "Saturn|Neptune": "Making dreams real; dissolving old structures.",
  "Saturn|Pluto": "Deep resilience and intense pressure to rebuild.",
  "Uranus|Neptune": "Generational shifts in ideals and technology.",
  "Uranus|Pluto": "Generational drive for radical change.",
  "Neptune|Pluto": "Generational spiritual and cultural transformation.",
};
const pairKey = (a, b) => { const o = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto","Node","Asc","MC"]; return o.indexOf(a) < o.indexOf(b) ? `${a}|${b}` : `${b}|${a}`; };
const NODE_SIGN = {
  Aries:"to trust your own judgment, act independently and speak up for yourself", Taurus:"to build stability, trust your values and slow down", Gemini:"to stay curious, listen and communicate",
  Cancer:"to nurture, feel and build emotional security", Leo:"to express yourself, take creative risks and lead with heart", Virgo:"to be practical, of service and attentive to the details",
  Libra:"to cooperate, balance your needs with others' and build partnership", Scorpio:"to go deep, trust, share and transform", Sagittarius:"to explore, seek meaning and share your beliefs",
  Capricorn:"to take responsibility, build structure and develop mastery", Aquarius:"to connect with groups, think independently and serve a greater vision", Pisces:"to trust intuition, have compassion and let go of control",
};

const TRANSIT_THEME = {
  Sun:"a few days of focus on", Moon:"a brief emotional note on",
  Mercury:"a short period of communication and thinking about", Venus:"a few weeks of attention to relationships, values and pleasure in",
  Mars:"a period of heightened drive, urgency and friction in", Jupiter:"a period of growth, opportunity and optimism in",
  Saturn:"a period of testing, work and long-term restructuring in", Uranus:"a period of surprise, change and liberation in",
  Neptune:"a period of dissolving boundaries, idealism or confusion in", Pluto:"a deep, slow transformation of", Node:"a karmic turning point involving",
};
const SLOW_IN_HOUSE = {
  Jupiter:["growth and opportunity", "A time of expansion: look for openings, learn, and say yes to well-judged risks."],
  Saturn:["testing and building", "A time of responsibility and restructuring: patient, honest work in this area pays off over years."],
  Uranus:["disruption and awakening", "A time of sudden change and new freedom: expect the unexpected and stay flexible."],
  Neptune:["dissolving and dreaming", "A time of idealism, intuition and fog: avoid illusions and verify facts, but allow inspiration."],
  Pluto:["deep transformation", "A slow, powerful overhaul: what no longer works is released and rebuilt from the foundations."],
};
const LUNATION_TEXT = {
  "New Moon": "a new beginning and a good time to set intentions",
  "Full Moon": "a culmination, clarity and emotional release",
};
const STATION_TEXT = {
  Mercury: {retrograde: "Mercury retrogrades: review, revise and double-check communication, travel and contracts; avoid launching major new things.", direct: "Mercury turns direct: delays clear and plans can move forward again."},
  Venus: {retrograde: "Venus retrogrades: past relationships, values and finances are revisited; avoid drastic changes in style or love life.", direct: "Venus turns direct: clarity returns to relationships and money."},
  Mars: {retrograde: "Mars retrogrades: energy and motivation turn inward; avoid unnecessary conflict and start fewer new projects.", direct: "Mars turns direct: drive and momentum return."},
  Jupiter: {retrograde: "Jupiter retrogrades: growth turns inward; review plans and beliefs rather than expand.", direct: "Jupiter turns direct: opportunities resume forward movement."},
  Saturn: {retrograde: "Saturn retrogrades: review responsibilities and structures.", direct: "Saturn turns direct: a sense of relief and renewed progress on long-term plans."},
  Uranus: {retrograde: "Uranus retrogrades: change moves inward; reflect on what freedom means to you.", direct: "Uranus turns direct: change accelerates again."},
  Neptune: {retrograde: "Neptune retrogrades: illusions fade and spiritual insight deepens.", direct: "Neptune turns direct: clarity improves and inspiration returns."},
  Pluto: {retrograde: "Pluto retrogrades: transformation moves inward.", direct: "Pluto turns direct: transformation resumes outwardly."},
};
