// Interpret weather conditions and select a letter without repeating recent ones.
const WEATHER = Object.freeze({
  SUNNY_MILD: "sunny-mild", RAINY_OVERCAST: "rainy-overcast",
  COLD_FROSTY: "cold-frosty", WARM_BRIGHT: "warm-bright"
});
const RECENT_KEY = "occasional-atelier-recent-letters-v1";
const MAX_RECENT = 12;

function classifyWeather({ temperatureC, precipitation = false, cloudCover = 0 } = {}) {
  if (!Number.isFinite(temperatureC)) return null;
  if (temperatureC <= 12) return WEATHER.COLD_FROSTY;
  if (precipitation || cloudCover >= 65) return WEATHER.RAINY_OVERCAST;
  if (temperatureC >= 27) return WEATHER.WARM_BRIGHT;
  return WEATHER.SUNNY_MILD;
}

function readRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Number.isInteger).slice(-MAX_RECENT) : [];
  } catch { return []; }
}
function writeRecent(ids) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(-MAX_RECENT))); }
  catch { /* The site still works if storage is unavailable. */ }
}
function chooseLetter(letters, weather, rng = Math.random) {
  const eligible = letters.filter(letter => letter.weather.includes(weather));
  if (!eligible.length) return null;
  const recent = readRecent();
  let candidates = eligible.filter(letter => !recent.includes(letter.id));
  // When the weather pool is small, relax exclusions starting with the oldest.
  if (!candidates.length) {
    for (const id of recent) {
      candidates = eligible.filter(letter => letter.id === id);
      if (candidates.length) break;
    }
  }
  const selected = candidates[Math.floor(rng() * candidates.length)];
  writeRecent([...recent.filter(id => id !== selected.id), selected.id]);
  return selected;
}
function recentLetterIds() { return [...readRecent()]; }

window.atelierWeather = { WEATHER, classifyWeather, chooseLetter, recentLetterIds };
