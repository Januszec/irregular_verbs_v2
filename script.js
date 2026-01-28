/* ===============================
   GLOBAL STATE
=============================== */
let currentLesson = [];
let quizList = [];
let currentIndex = 0;
let correctCount = 0;

let voiceEnabled = true;
const themeKey = "quizTheme";

/* ===============================
   LOCALSTORAGE HELPERS
=============================== */
function getStore(key, def) {
  return JSON.parse(localStorage.getItem(key)) || def;
}
function setStore(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

/* ===============================
   LESSON LOADING
=============================== */
async function loadLessons() {
  const res = await fetch("lessons/index.json");
  const lessons = await res.json();
  const sel = document.getElementById("lessonSelect");
  sel.innerHTML = "";

  lessons.forEach(l => {
    const o = document.createElement("option");
    o.value = l.id;
    o.textContent = l.name;
    sel.appendChild(o);
  });
}

/* ===============================
   QUIZ LOGIC
=============================== */
function resetQuizState() {
  currentIndex = 0;
  correctCount = 0;
  document.getElementById("feedback").innerHTML = "";
}

async function startQuiz(useWrongOnly = false) {
  resetQuizState();

  const lessonId = document.getElementById("lessonSelect").value;
  const count = Number(document.getElementById("questionCount").value);
  const mode = document.getElementById("mode").value;

  const res = await fetch(`lessons/${lessonId}.json`);
  const allWords = await res.json();

  if (useWrongOnly) {
    const wordStats = getStore("wordStats", {});
    quizList = allWords.filter(w => (wordStats[w.base] && wordStats[w.base].wrong > 0));
  } else {
    quizList = shuffle(allWords);
  }
  quizList = quizList.slice(0, count);

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("statsScreen").classList.add("hidden");
  document.getElementById("quizScreen").classList.remove("hidden");

  showCurrentWord();
}

function showCurrentWord() {
  const w = quizList[currentIndex];
  if (!w) {
    finishQuiz();
    return;
  }

  document.getElementById("question").textContent = `Znaczenie: ${w.pl}`;

  document.getElementById("input1").value = "";
  document.getElementById("input2").value = "";
  document.getElementById("input3").value = "";

  document.getElementById("input1").disabled = (document.getElementById("mode").value === "two");
  document.getElementById("feedback").innerHTML = "";
}

function checkAnswer() {
  const w = quizList[currentIndex];
  const a1 = document.getElementById("input1").value.trim().toLowerCase();
  const a2 = document.getElementById("input2").value.trim().toLowerCase();
  const a3 = document.getElementById("input3").value.trim().toLowerCase();

  const ok = a1 === w.base && a2 === w.past && a3 === w.pp;

if (ok) {
  correctCount++;
  document.getElementById("feedback").innerHTML = `<span class="green">✔</span>`;
  if (voiceEnabled) {
    speak(`${w.base}. ${w.past}. ${w.pp}`);
  }
} else {
  document.getElementById("feedback").innerHTML = 
    `<span class="red">✖ ${w.base} – ${w.past} – ${w.pp}</span>`;
  if (voiceEnabled) {
    speak(`${w.base}. ${w.past}. ${w.pp}`);
  }
}

  updateWordStats(w.base, ok);

  currentIndex++;
  setTimeout(showCurrentWord, 900);
}

function finishQuiz() {
  saveQuizResult();
  alert(`Koniec quizu!\nPoprawne: ${correctCount}/${quizList.length}`);
  showStats();
}

/* ===============================
   VOICE
=============================== */
function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-GB";
  speechSynthesis.speak(u);
}

/* ===============================
   STATISTICS
=============================== */
function saveQuizResult() {
  const history = getStore("quizHistory", []);
  history.push({
    date: new Date().toLocaleString(),
    lesson: document.getElementById("lessonSelect").value,
    correct: correctCount,
    total: quizList.length
  });
  setStore("quizHistory", history);
}

function updateWordStats(word, ok) {
  const stats = getStore("wordStats", {});
  if (!stats[word]) stats[word] = { shown: 0, wrong: 0 };
  stats[word].shown++;
  if (!ok) stats[word].wrong++;
  setStore("wordStats", stats);
}

function showStats() {
  document.getElementById("quizScreen").classList.add("hidden");
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("statsScreen").classList.remove("hidden");

  const hist = getStore("quizHistory", []);
  document.getElementById("quizHistory").innerHTML = hist
    .map(q => `<li>${q.date} – ${q.lesson}: ${q.correct}/${q.total}</li>`)
    .join("");

  const wstats = getStore("wordStats", {});
  document.getElementById("wordStatsList").innerHTML = Object.entries(wstats)
    .map(([w,s]) =>
       `<li>${w}: ✔ ${s.shown - s.wrong} / ✖ ${s.wrong}</li>`
    ).join("");
}

/* ===============================
   CLEAR STATS
=============================== */
function clearStats() {
  if (!confirm("Na pewno wyczyścić wszystko?")) return;
  localStorage.removeItem("quizHistory");
  localStorage.removeItem("wordStats");
  showStats();
}

/* ===============================
   THEME
=============================== */
function loadTheme() {
  const saved = localStorage.getItem(themeKey) || "light";
  document.body.className = saved;
  document.getElementById("themeToggleBtn").textContent =
    saved === "light" ? "🌙 Ciemny motyw" : "☀️ Jasny motyw";
}

function toggleTheme() {
  const next = document.body.className === "light" ? "dark" : "light";
  document.body.className = next;
  localStorage.setItem(themeKey, next);
  loadTheme();
}

/* ===============================
   UTILS
=============================== */
function shuffle(a) { return a.sort(() => Math.random() - 0.5); }

/* ===============================
   HOOKS
=============================== */
document.getElementById("startBtn").onclick = () => startQuiz(false);
document.getElementById("repeatWrongOnlyBtn").onclick = () => startQuiz(true);
document.getElementById("checkBtn").onclick = checkAnswer;
document.getElementById("backBtn").onclick = () => location.reload();
document.getElementById("statsBtn").onclick = showStats;
document.getElementById("clearStatsBtn").onclick = clearStats;
document.getElementById("themeToggleBtn").onclick = toggleTheme;
document.getElementById("voiceToggle").onchange = (e) => {
  voiceEnabled = e.target.checked;
};
document.getElementById("backToStartFromStatsBtn").onclick = () => {
  document.getElementById("statsScreen").classList.add("hidden");
  document.getElementById("quizScreen").classList.add("hidden");
  document.getElementById("startScreen").classList.remove("hidden");
};

/* ===============================
   INIT
=============================== */
loadLessons();
loadTheme();