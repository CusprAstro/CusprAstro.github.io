/* Famous and infamous birth data (date, local time, UTC offset hours, lat, lon).
   Times follow commonly cited Astro-Databank entries; birth times are sometimes disputed, so verify via the link. */
const FAMOUS = [
  ["Albert Einstein","Physicist","Icon","1879-03-14","11:30",0.666,48.40,9.99,"Ulm, Germany"],
  ["Marilyn Monroe","Actress","Icon","1926-06-01","09:30",-8,34.05,-118.24,"Los Angeles, CA"],
  ["Steve Jobs","Apple co-founder","Icon","1955-02-24","19:15",-8,37.77,-122.42,"San Francisco, CA"],
  ["Elvis Presley","Musician","Icon","1935-01-08","04:35",-6,34.26,-88.70,"Tupelo, MS"],
  ["John Lennon","Musician","Icon","1940-10-09","18:30",1,53.41,-2.98,"Liverpool, England"],
  ["Princess Diana","Royal and humanitarian","Icon","1961-07-01","19:45",1,52.83,0.50,"Sandringham, England"],
  ["Barack Obama","U.S. President","Icon","1961-08-04","19:24",-10,21.31,-157.86,"Honolulu, HI"],
  ["Bill Gates","Microsoft co-founder","Icon","1955-10-28","21:15",-8,47.61,-122.33,"Seattle, WA"],
  ["Oprah Winfrey","Media mogul","Icon","1954-01-29","04:30",-6,33.06,-89.59,"Kosciusko, MS"],
  ["Michael Jackson","Musician","Icon","1958-08-29","19:33",-6,41.59,-87.35,"Gary, IN"],
  ["Martin Luther King Jr.","Civil rights leader","Icon","1929-01-15","12:00",-6,33.75,-84.39,"Atlanta, GA"],
  ["John F. Kennedy","U.S. President","Icon","1917-05-29","15:00",-5,42.33,-71.12,"Brookline, MA"],
  ["Adolf Hitler","Dictator","Infamous","1889-04-20","18:30",0.869,48.26,13.04,"Braunau, Austria"],
  ["Charles Manson","Cult leader","Infamous","1934-11-12","16:40",-5,39.10,-84.51,"Cincinnati, OH"],
  ["Ted Bundy","Serial killer","Infamous","1946-11-24","22:35",-5,44.48,-73.21,"Burlington, VT"],
  ["Napoleon Bonaparte","Emperor","Infamous","1769-08-15","11:30",0.58,41.92,8.74,"Ajaccio, Corsica"],
  ["Richard Nixon","U.S. President","Infamous","1913-01-09","21:35",-8,33.89,-117.81,"Yorba Linda, CA"],
  ["Donald Trump","U.S. President","Infamous","1946-06-14","10:54",-4,40.73,-73.79,"Queens, NY"],
  ["Bill Clinton","U.S. President","Icon","1946-08-19","08:51",-6,33.67,-93.59,"Hope, AR"],
  ["Madonna","Singer","Icon","1958-08-16","07:05",-5,43.60,-83.89,"Bay City, MI"],
  ["David Bowie","Musician","Icon","1947-01-08","09:00",0,51.46,-0.11,"Brixton, London"],
  ["Jimi Hendrix","Guitarist","Icon","1942-11-27","10:15",-7,47.61,-122.33,"Seattle, WA"],
  ["Kurt Cobain","Musician","Icon","1967-02-20","19:38",-8,46.98,-123.81,"Aberdeen, WA"],
  ["Prince","Musician","Icon","1958-06-07","18:17",-5,44.98,-93.27,"Minneapolis, MN"],
  ["Muhammad Ali","Boxer","Icon","1942-01-17","18:35",-6,38.25,-85.76,"Louisville, KY"],
  ["Mark Zuckerberg","Facebook founder","Icon","1984-05-14","14:39",-4,41.03,-73.77,"White Plains, NY"],
  ["Taylor Swift","Singer-songwriter","Icon","1989-12-13","05:17",-5,40.34,-75.93,"West Reading, PA"],
  ["Leonardo DiCaprio","Actor","Icon","1974-11-11","02:47",-8,34.05,-118.24,"Los Angeles, CA"],
  ["Tom Cruise","Actor","Icon","1962-07-03","11:06",-4,43.05,-76.15,"Syracuse, NY"],
  ["Sigmund Freud","Psychoanalyst","Icon","1856-05-06","18:30",1.21,49.64,18.14,"Příbor, Moravia"],
  ["Carl Jung","Psychiatrist","Icon","1875-07-26","19:32",0.62,47.59,9.32,"Kesswil, Switzerland"],
  ["Vincent van Gogh","Painter","Icon","1853-03-30","11:00",0.31,51.47,4.65,"Zundert, Netherlands"],
  ["Mahatma Gandhi","Independence leader","Icon","1869-10-02","07:12",4.64,21.64,69.60,"Porbandar, India"],
  ["Walt Disney","Animator and founder","Icon","1901-12-05","00:35",-6,41.88,-87.63,"Chicago, IL"],
  ["Frida Kahlo","Painter","Icon","1907-07-06","08:30",-6.61,19.35,-99.16,"Coyoacán, Mexico"],
  ["Whitney Houston","Singer","Icon","1963-08-09","20:55",-4,40.74,-74.17,"Newark, NJ"],
  ["Bruce Lee","Martial artist and actor","Icon","1940-11-27","07:12",-8,37.77,-122.42,"San Francisco, CA"],
  ["Pablo Picasso","Painter","Icon","1881-10-25","23:15",-0.29,36.72,-4.42,"Málaga, Spain"],
  ["Meryl Streep","Actress","Icon","1949-06-22","08:05",-4,40.72,-74.36,"Summit, NJ"],
  ["Lady Gaga","Singer","Icon","1986-03-28","09:53",-5,40.71,-74.01,"New York, NY"],
  ["Marlon Brando","Actor","Icon","1924-04-03","23:00",-6,41.26,-95.94,"Omaha, NE"],
  ["Johnny Depp","Actor","Icon","1963-06-09","08:44",-5,37.77,-87.11,"Owensboro, KY"],
  ["Angelina Jolie","Actress and activist","Icon","1975-06-04","09:09",-7,34.05,-118.24,"Los Angeles, CA"],
  ["Brad Pitt","Actor","Icon","1963-12-18","06:31",-6,35.33,-96.93,"Shawnee, OK"],
  ["Winston Churchill","Prime Minister","Icon","1874-11-30","01:30",-0.09,51.84,-1.36,"Blenheim Palace, England"],
  ["Mother Teresa","Missionary","Icon","1910-08-26","14:25",1.43,41.99,21.43,"Skopje"],
  ["Bob Dylan","Singer-songwriter","Icon","1941-05-24","21:05",-6,46.79,-92.10,"Duluth, MN"],
  ["Britney Spears","Singer","Icon","1981-12-02","01:30",-6,31.24,-90.45,"McComb, MS"],
  ["Wolfgang Amadeus Mozart","Composer","Icon","1756-01-27","20:00",0.87,47.80,13.04,"Salzburg, Austria"],
  ["Jim Morrison","Singer of The Doors","Icon","1943-12-08","11:55",-4,28.08,-80.62,"Melbourne, FL"],
  ["Janis Joplin","Singer","Icon","1943-01-19","09:45",-5,29.90,-93.93,"Port Arthur, TX"],
  ["Sylvia Plath","Poet","Icon","1932-10-27","14:10",-5,42.36,-71.06,"Boston, MA"],
  ["Ernest Hemingway","Novelist","Icon","1899-07-21","08:00",-6,41.89,-87.78,"Oak Park, IL"],
  ["Charlie Chaplin","Actor and filmmaker","Icon","1889-04-16","20:00",-0.01,51.51,-0.13,"London, England"],
];

const FAMOUS_CACHE = {};
function famousChart(f) {
  if (FAMOUS_CACHE[f[0]]) return FAMOUS_CACHE[f[0]];
  const [y, m, d] = f[3].split("-").map(Number), [hh, mm] = f[4].split(":").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, hh, mm) - f[5] * 3600000);
  return FAMOUS_CACHE[f[0]] = buildChart(utc, f[6], f[7]);
}
function famousDbLink(name) {
  return "https://www.astro.com/astro-databank/index.php?go=Go&title=Special%3ASearch&search=" + encodeURIComponent(name);
}

const EL = {Aries:0,Leo:0,Sagittarius:0,Taurus:1,Virgo:1,Capricorn:1,Gemini:2,Libra:2,Aquarius:2,Cancer:3,Scorpio:3,Pisces:3};
const EL_NAME = ["Fire","Earth","Air","Water"];
function elementVec(c, withAsc = true) {
  const v = [0, 0, 0, 0], w = {Sun:2,Moon:2,Asc:2,Mercury:1,Venus:1,Mars:1,Jupiter:.5,Saturn:.5};
  if (!withAsc) delete w.Asc;
  for (const k in w) v[EL[signOf(k === "Asc" ? c.asc : c.lonOf[k])]] += w[k];
  return v;
}
const cos = (a, b) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] ** 2; y += b[i] ** 2; } return d / Math.sqrt(x * y || 1); };

