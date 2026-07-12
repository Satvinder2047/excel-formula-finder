const form = document.getElementById("searchForm");
const input = document.getElementById("queryInput");
const btn = document.getElementById("searchBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

const fields = {
  formula: document.getElementById("resultFormula"),
  syntax: document.getElementById("resultSyntax"),
  description: document.getElementById("resultDescription"),
  example: document.getElementById("resultExample"),
  mistakes: document.getElementById("resultMistakes"),
  mistakesRow: document.getElementById("mistakesRow"),
  related: document.getElementById("resultRelated"),
  relatedRow: document.getElementById("relatedRow"),
};

function setStatus(message, isError = false) {
  statusEl.hidden = !message;
  statusEl.textContent = message || "";
  statusEl.classList.toggle("error", isError);
}

function renderResult(data) {
  fields.formula.textContent = data.formula || "—";
  fields.syntax.textContent = data.syntax || "Not available.";
  fields.description.textContent = data.description || "";
  fields.example.textContent = data.example || "";

  fields.mistakes.innerHTML = "";
  const mistakes = Array.isArray(data.commonMistakes) ? data.commonMistakes : [];
  fields.mistakesRow.hidden = mistakes.length === 0;
  mistakes.forEach((m) => {
    const li = document.createElement("li");
    li.textContent = m;
    fields.mistakes.appendChild(li);
  });

  fields.related.innerHTML = "";
  const related = Array.isArray(data.relatedFormulas) ? data.relatedFormulas : [];
  fields.relatedRow.hidden = related.length === 0;
  related.forEach((r) => {
    const span = document.createElement("span");
    span.textContent = r;
    span.style.cursor = "pointer";
    span.addEventListener("click", () => {
      input.value = r;
      form.requestSubmit();
    });
    fields.related.appendChild(span);
  });

  resultEl.hidden = false;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  resultEl.hidden = true;
  btn.disabled = true;
  setStatus("Searching the web for that formula…");

  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Something went wrong.", true);
      return;
    }

    setStatus("");
    renderResult(data);
  } catch (err) {
    setStatus("Network error — check your connection and try again.", true);
  } finally {
    btn.disabled = false;
  }
});
