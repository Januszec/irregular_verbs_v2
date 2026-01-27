let lessons = {};
let currentLesson = [];
let currentIndex = 0;
let correct = 0;

const statsKey = "quizStats";

fetch("index.json")
  .then(res => res.json())
  .then(data => {
    lessons = data;
    populateLessons();
  });

function populateLessons() {
  const select = document.getElementById("lessonSelect");
  select.innerHTML = "";

  Object.keys(lessons).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

function startQuiz() {
  const lessonName = lessonSelect.value;
  currentLesson = [...lessons[lessonName]];
  currentIndex = 0;
  correct = 0;

  document.getElementById("quizScreen").classList.remove("hidden");
  document.getElementById("statsScreen").classList.add("hidden");

  showQuestion();
}

function showQuestion() {
  document.getElementById("feedback").textContent = "";
  document.getElementById("answerInput").value = "";
  document.getElementById("question").textContent =
    currentLesson[currentIndex].question;
}

function checkAnswer() {
  const input = document.getElementById("answerInput").value.trim();
  const item = currentLesson[currentIndex];

  const isCorrect = item.answers.includes(input);

  saveWordStat(item.question, isCorrect);

  if (isCorrect) {
    correct++;
    document.getElementById("feedback").textContent = "✅ Poprawnie!";
    nextQuestion();
  } else {
    document.getElementById("feedback").textContent =
      "❌ Błąd. Poprawne: " + item.answers.join(", ");
  }
}

function nextQuestion() {
  setTimeout(() => {
    currentIndex++;
    if (currentIndex >= currentLesson.length) {
      finishQuiz();
    } else {
      showQuestion();
    }
  }, 800);
}

function finishQuiz() {
  saveQuizResult();
  alert(`Koniec! Wynik: ${correct}/${currentLesson.length}`);
  backToMenu();
}

/* 🔊 WYMOWA */
function speakCurrent() {
  const item = currentLesson[currentIndex];
  item.answers.forEach(word => {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "de-DE"; // zmień język jeśli trzeba
    speechSynthesis.speak(u);
  });
}

/* 📊 STATYSTYKI */
function loadStats() {
  return JSON.parse(localStorage.getItem(statsKey)) || {
    quizzes: [],
    words: {}
  };
}

function saveQuizResult() {
  const stats = loadStats();
  stats.quizzes.push({
    date: new Date().toLocaleString(),
    score: `${correct}/${currentLesson.length}`
  });
  localStorage.setItem(statsKey, JSON.stringify(stats));
}

function saveWordStat(word, isCorrect) {
  const stats = loadStats();
  if (!stats.words[word]) {
    stats.words[word] = { ok: 0, bad: 0 };
  }
  isCorrect ? stats.words[word].ok++ : stats.words[word].bad++;
  localStorage.setItem(statsKey, JSON.stringify(stats));
}

function showStats() {
  const stats = loadStats();

  document.getElementById("quizScreen").classList.add("hidden");
  document.getElementById("statsScreen").classList.remove("hidden");

  const history = document.getElementById("quizHistory");
  history.innerHTML = "";
  stats.quizzes.forEach(q => {
    const li = document.createElement("li");
    li.textContent = `${q.date} – ${q.score}`;
    history.appendChild(li);
  });

  const tbody = document.getElementById("wordStats");
  tbody.innerHTML = "";
  Object.entries(stats.words).forEach(([word, s]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${word}</td><td>${s.ok}</td><td>${s.bad}</td>`;
    tbody.appendChild(tr);
  });
}

function backToMenu() {
  document.getElementById("quizScreen").classList.add("hidden");
  document.getElementById("statsScreen").classList.add("hidden");
}