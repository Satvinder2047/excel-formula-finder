const input = document.getElementById("queryInput");
const statusEl = document.getElementById("status");
const resultsList = document.getElementById("resultsList");
const template = document.getElementById("resultTemplate");

let formulas = [];

function setStatus(message) {
  statusEl.hidden = !message;
  statusEl.textContent = message || "";
}

// Simple relevance score: exact formula name match ranks highest,
// then "starts with", then a match anywhere in name/description/category.
function scoreEntry(entry, query) {
  const q = query.toLowerCase();
  const name = entry.formula.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.includes(q)) return 60;
  if (entry.description.toLowerCase().includes(q)) return 40;
  if (entry.category.toLowerCase().includes(q)) return 20;
  if ((entry.relatedFormulas || []).some((r) => r.toLowerCase().includes(q))) return 10;
  return 0;
}

function search(query) {
  if (!query.trim()) {
    resultsList.hidden = true;
    resultsList.innerHTML = "";
    setStatus("");
    return;
  }

  const scored = formulas
    .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  resultsList.innerHTML = "";

  if (scored.length === 0) {
    setStatus("");
    resultsList.hidden = false;
    const empty = document.createElement("p");
    empty.className = "no-match";
    empty.textContent = `No formula matching "${query}" yet — try a different term.`;
    resultsList.appendChild(empty);
    return;
  }

  setStatus("");
  scored.forEach(({ entry }) => resultsList.appendChild(renderCard(entry)));
  resultsList.hidden = false;
}

function renderCard(entry) {
  const node = template.content.cloneNode(true);

  node.querySelector(".r-formula").textContent = entry.formula;
  node.querySelector(".r-category").textContent = entry.category;
  node.querySelector(".r-syntax").textContent = entry.syntax;
  node.querySelector(".r-description").textContent = entry.description;
  node.querySelector(".r-example").textContent = entry.example;

  const mistakesRow = node.querySelector(".r-mistakes-row");
  const mistakesEl = node.querySelector(".r-mistakes");
  const mistakes = entry.commonMistakes || [];
  if (mistakes.length === 0) {
    mistakesRow.remove();
  } else {
    mistakes.forEach((m) => {
      const li = document.createElement("li");
      li.textContent = m;
      mistakesEl.appendChild(li);
    });
  }

  const relatedRow = node.querySelector(".r-related-row");
  const relatedEl = node.querySelector(".r-related");
  const related = entry.relatedFormulas || [];
  if (related.length === 0) {
    relatedRow.remove();
  } else {
    related.forEach((r) => {
      const span = document.createElement("span");
      span.textContent = r;
      span.style.cursor = "pointer";
      span.addEventListener("click", () => {
        input.value = r;
        search(r);
        input.focus();
      });
      relatedEl.appendChild(span);
    });
  }

  return node;
}

async function init() {
  setStatus("Loading formula database…");
  try {
    const res = await fetch("formulas.json");
    formulas = await res.json();
    setStatus("");
  } catch (err) {
    setStatus("Couldn't load the formula database. Try refreshing.");
    return;
  }

  input.addEventListener("input", () => search(input.value));
  document.getElementById("searchForm").addEventListener("submit", (e) => e.preventDefault());
}

init();
