"use strict";
(() => {
const letters = window.atelierLetters;
const { chooseLetter, WEATHER } = window.atelierWeather;
const weatherSelect = document.querySelector("#weather");
const letterElement = document.querySelector("#letter");
const statusElement = document.querySelector("#status");
const invitationElement = document.querySelector("#invitation");
const nextButton = document.querySelector("#next-letter");
const bookmarkButton = document.querySelector("#bookmark-letter");
const bookmarkList = document.querySelector("#bookmark-list");
const bookmarkCount = document.querySelector("#bookmark-count");
const storageNote = document.querySelector("#bookmark-storage-note");
const STORAGE_KEY = "occasional-atelier-bookmarks-v1";
const byId = new Map(letters.map(letter => [letter.id, letter]));
let currentLetter = null;
let bookmarks = [];
let storageAvailable = true;
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
try {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (Array.isArray(raw)) {
    const seen = new Set();
    bookmarks = raw.filter(item => {
      if (!item || !Number.isInteger(item.id) || !byId.has(item.id) || seen.has(item.id)) return false;
      seen.add(item.id); return true;
    }).map(item => ({id:item.id, note:typeof item.note === "string" ? item.note.slice(0,2000) : ""}));
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
} catch {
  storageAvailable = false;
  storageNote.hidden = false;
  storageNote.textContent = "this browser is not allowing local storage. bookmarks will last only until you close or reload this page.";
}
function saveBookmarks() {
  if (!storageAvailable) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks)); }
  catch {
    storageAvailable = false;
    storageNote.hidden = false;
    storageNote.textContent = "bookmarks cannot be saved in this browser right now; they will remain available until the page is reloaded.";
  }
}
function updateBookmarkButton() {
  const saved = !!currentLetter && bookmarks.some(item => item.id === currentLetter.id);
  bookmarkButton.setAttribute("aria-pressed", String(saved));
  document.querySelector("#bookmark-label").textContent = saved ? "bookmarked" : "bookmark";
  bookmarkButton.setAttribute("aria-label", saved ? "remove bookmark from this letter" : "bookmark this letter");
  bookmarkButton.disabled = !currentLetter;
}
function displayLetter(selected) {
  currentLetter = selected;
  if (!selected) {
    statusElement.textContent = "No letters match this weather yet.";
    invitationElement.textContent = "";
    letterElement.replaceChildren();
    updateBookmarkButton(); return;
  }
  statusElement.textContent = `${selected.collection} · correspondence no. ${String(selected.id).padStart(3,"0")}`;
  invitationElement.textContent = `invitation for creativity : ${selected.subsection}`;
  letterElement.innerHTML = `<h2>${escapeHTML(selected.title)}</h2>` +
    selected.text.split(/\n\n/).map(p => `<p>${escapeHTML(p).replace(/\n/g,"<br>")}</p>`).join("") +
    `<p class="signature"><em>${escapeHTML(selected.signature)}</em></p>`;
  updateBookmarkButton();
}
function showLetter() { displayLetter(chooseLetter(letters, weatherSelect.value)); }
function renderBookmarks() {
  bookmarkCount.textContent = `${bookmarks.length} saved`;
  bookmarkList.replaceChildren();
  if (!bookmarks.length) {
    const empty = document.createElement("p");
    empty.className = "bookmark-empty";
    empty.textContent = "no letters tucked away just yet.";
    bookmarkList.append(empty); return;
  }
  bookmarks.forEach(item => {
    const letter = byId.get(item.id);
    const wrapper = document.createElement("div"); wrapper.className = "bookmark-item";
    const open = document.createElement("button");
    open.className = "bookmark-name"; open.type = "button";
    open.textContent = letter.title; open.title = "";
    open.addEventListener("click", () => {
      displayLetter(letter);
      statusElement.scrollIntoView({behavior:"smooth",block:"start"});
    });
    const meta = document.createElement("p"); meta.className = "bookmark-meta";
    meta.textContent = `no. ${String(letter.id).padStart(3,"0")} · ${letter.subsection}`;
    const tools = document.createElement("div"); tools.className = "bookmark-tools";
    const remove = document.createElement("button"); remove.type = "button";
    remove.textContent = "remove bookmark";
    remove.setAttribute("aria-label", `remove bookmark for ${letter.title}`);
    remove.addEventListener("click", () => {
      bookmarks = bookmarks.filter(entry => entry.id !== item.id);
      saveBookmarks(); renderBookmarks(); updateBookmarkButton();
    });
    tools.append(remove);
    const note = document.createElement("textarea"); note.className = "bookmark-notes";
    note.placeholder = "a little note to myself ..";
    note.setAttribute("aria-label", `personal note for ${letter.title}`);
    note.maxLength = 2000; note.value = item.note;
    note.addEventListener("input", () => { item.note = note.value; saveBookmarks(); });
    wrapper.append(open,meta,tools,note); bookmarkList.append(wrapper);
  });
}
bookmarkButton.addEventListener("click", () => {
  if (!currentLetter) return;
  const existing = bookmarks.find(item => item.id === currentLetter.id);
  if (existing) bookmarks = bookmarks.filter(item => item.id !== currentLetter.id);
  else bookmarks.unshift({id:currentLetter.id,note:""});
  saveBookmarks(); renderBookmarks(); updateBookmarkButton();
});
nextButton.addEventListener("click", showLetter);
// Choose a new weather condition when the page opens or is refreshed.
// The "another letter" button uses the current selection without changing it.
const weatherOptions = Array.from(weatherSelect.options).filter(option => !option.disabled);
weatherSelect.value = weatherOptions[Math.floor(Math.random() * weatherOptions.length)].value;
// Manually choosing a different weather condition also brings a matching letter.
weatherSelect.addEventListener("change", showLetter);
showLetter(); renderBookmarks();

// Replace the operating-system dropdown with a gently coloured menu.
// Keep the original select as the source of truth for letter selection.
const picker = document.querySelector(".weather-picker");
const trigger = document.querySelector("#weather-trigger");
const valueLabel = document.querySelector("#weather-value");
const menu = document.querySelector("#weather-menu");
const options = Array.from(weatherSelect.options).filter(option => !option.disabled);
let menuButtons = [];
function syncWeatherMenu() {
  const chosen = options.find(option => option.value === weatherSelect.value);
  valueLabel.textContent = chosen ? chosen.textContent : "";
  menuButtons.forEach(button => button.setAttribute("aria-selected", String(button.dataset.value === weatherSelect.value)));
}
function closeWeatherMenu(returnFocus = false) {
  menu.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
  if (returnFocus) trigger.focus();
}
function openWeatherMenu(focusIndex = -1) {
  syncWeatherMenu();
  menu.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  if (focusIndex >= 0) menuButtons[focusIndex]?.focus();
}
function selectWeather(value) {
  weatherSelect.value = value;
  syncWeatherMenu();
  closeWeatherMenu(true);
  weatherSelect.dispatchEvent(new Event("change", {bubbles:true}));
}
options.forEach(option => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "weather-option";
  button.setAttribute("role", "option");
  button.dataset.value = option.value;
  button.textContent = option.textContent;
  button.addEventListener("click", () => selectWeather(option.value));
  menu.append(button);
  menuButtons.push(button);
});
trigger.hidden = false;
picker.classList.add("weather-ready");
syncWeatherMenu();
trigger.addEventListener("click", () => {
  if (!menu.hidden) closeWeatherMenu();
  else openWeatherMenu();
});
trigger.addEventListener("keydown", event => {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const selected = menuButtons.findIndex(button => button.dataset.value === weatherSelect.value);
    openWeatherMenu(event.key === "ArrowDown" ? (selected + 1) % menuButtons.length : (selected - 1 + menuButtons.length) % menuButtons.length);
  } else if (event.key === "Escape") closeWeatherMenu();
});
menu.addEventListener("keydown", event => {
  const index = menuButtons.indexOf(document.activeElement);
  if (event.key === "Escape") {event.preventDefault();closeWeatherMenu(true);}
  else if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? menuButtons.length - 1 :
      (index + (event.key === "ArrowDown" ? 1 : -1) + menuButtons.length) % menuButtons.length;
    menuButtons[next].focus();
  } else if (event.key === "Tab") closeWeatherMenu();
});
document.addEventListener("pointerdown", event => {
  if (!picker.contains(event.target)) closeWeatherMenu();
});
weatherSelect.addEventListener("change", syncWeatherMenu);

})();
