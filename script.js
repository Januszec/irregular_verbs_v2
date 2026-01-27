const state = {
  words: [],
  current: 0,
  correct: 0,
  wrong: 0,
  lesson: "",
  mode: "three"
};

const els = {
  start: document.getElementById("startScreen"),
  quiz: document.getElementById("quizScreen"),
  stats: document.getElementById("statsScreen"),
  lessonSelect: document.getElementById("lessonSelect"),
  question: document.getElementById("question"),
  feedback: document.getElementById("feedback"),
  quizHistory: document.getElementById("quizHistory"),
  wordStats: document.getElementById("wordStats")
};

/* ---------- AUDIO ---------- */
function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-GB";
  speechSynthesis.speak(u);
}

/* ---------- STORAGE ---------- */
function getStore(key, def) {
  return JSON.parse(localStorage.getItem(key)) || def;
}

function setStore(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

/* ---------- LESSONS ---------- */
async function loadLessons() {
  const res = await fetch("lessons/index.json");
  const lessons = await res.json();

  els.lessonSelect.innerHTML = "";
  lessons.forEach(l => {
    const o = document.createElement("option");
    o.value = l.id;
    o.textContent = l.name;
    els.lessonSelect.appendChild(o);
  });
}

/* ---------- QUIZ ---------- */
function resetState() {
  state.current = 0;
  state.correct = 0;
  state.wrong = 0;
  els.feedback.innerHTML = "";
}

async function startQuiz() {
  resetState();

  state.lesson = els.lessonSelect.value;
  state.mode = document.getElementById("mode").value;
  const count = Number(document.getElementById("questionCount").value);

  const res = await fetch(`lessons/${state.lesson}.json`);
  const all = await res.json();

  state.words = weightedPick(all, count);

  els.start.classList.add("hidden");
  els.quiz.classList.remove("hidden");

  showWord();
}

function showWord() {
  const w = state.words[state.current];
  if (!w) return endQuiz();

  els.question.textContent = `Znaczenie: ${w.pl}`;

  ["input1","input2","input3"].forEach(id => {
    document.getElementById(id).value = "";
  });

  if (state.mode === "two") {
    input1.value = w.base;
    input1.disabled = true;
  } else {
    input1.disabled = false;
  }

  els.feedback.innerHTML = "";
}

function checkAnswer() {
  const w = state.words[state.current];

  const a1 = input1.value.trim().toLowerCase();
  const a2 = input2.value.trim().toLowerCase();
  const a3 = input3.value.trim().toLowerCase();

  const ok = a1 === w.base && a2 === w.past && a3 === w.pp;

  updateWordStats(w.base, ok);

  if (ok) {
    els.feedback.innerHTML = `<span class="green">✔ Poprawnie</span>`;
    state.correct++;
  } else {
    els.feedback.innerHTML =
      `<span class="red">✖ ${w.base} – ${w.past} – ${w.pp}</span>`;
    speak(`${w.base}. ${w.past}. ${w.pp}`);
    state.wrong++;
  }

  state.current++;
  setTimeout(showWord, 1300);
}

function endQuiz() {
  saveQuizResult();
  alert(`Koniec!\n✔ ${state.correct} ✖ ${state.wrong}`);
  location.reload();
}

/* ---------- STATS ---------- */
function saveQuizResult() {
  const history = getStore("quizHistory", []);
  history.push({
    date: new Date().toLocaleString(),
    lesson: state.lesson,
    correct: state.correct,
    total: state.correct + state.wrong
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
  els.start.classList.add("hidden");
  els.stats.classList.remove("hidden");

  const history = getStore("quizHistory", []);
  els.quizHistory.innerHTML = history
    .map(h => `<li>${h.date} – ${h.lesson}: ${h.correct}/${h.total}</li>`)
    .join("");

  const stats = getStore("wordStats", {});
  els.wordStats.innerHTML = Object.entries(stats)
    .map(([w,s]) =>
      `<li>${w}: ${s.shown - s.wrong}/${s.shown}</li>`
    ).join("");
}

function clearStats() {
  if (!confirm("Czy na pewno wyczyścić wszystkie statystyki?")) return;
  localStorage.removeItem("quizHistory");
  localStorage.removeItem("wordStats");
  alert("Statystyki wyczyszczone");
  showStats();
}

function getWordWeight(word) {
  const stats = getStore("wordStats", {});
  const s = stats[word.base];

  if (!s) return 1; // nowe słowo

  const accuracy = (s.shown - s.wrong) / s.shown;

  if (accuracy < 0.5) return 5;
  if (accuracy < 0.8) return 3;
  return 1;
}

function weightedPick(words, count) {
  const pool = [];

  words.forEach(w => {
    const weight = getWordWeight(w);
    for (let i = 0; i < weight; i++) {
      pool.push(w);
    }
  });

  return shuffle(pool).slice(0, count);
}

/* ---------- UTILS ---------- */
function shuffle(a) {
  return a.sort(() => Math.random() - 0.5);
}

/* ---------- EVENTS ---------- */
startBtn.onclick = startQuiz;
checkBtn.onclick = checkAnswer;
statsBtn.onclick = showStats;
backBtn.onclick = () => location.reload();
clearStatsBtn.onclick = clearStats;

/* ---------- INIT ---------- */
loadLessons();