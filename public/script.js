const input = document.getElementById("queryInput");
const sidebar = document.getElementById("sidebar");
const intro = document.getElementById("intro");
const popularList = document.getElementById("popularList");
const resultsList = document.getElementById("resultsList");
const detail = document.getElementById("detail");
const homeLink = document.getElementById("homeLink");
const searchForm = document.getElementById("searchForm");

let formulas = [];
const POPULAR = ["IF", "VLOOKUP", "XLOOKUP", "SUMIFS", "INDEX", "MATCH", "COUNTIFS", "IFERROR"];

function showHome() {
  input.value = "";
  intro.hidden = false;
  resultsList.hidden = true;
  detail.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

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

function renderResultsList(query) {
  const scored = formulas
    .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  resultsList.innerHTML = "";
  intro.hidden = true;
  detail.hidden = true;

  if (scored.length === 0) {
    resultsList.hidden = false;
    resultsList.innerHTML = `<p class="no-match">No formula matching "${escapeHtml(query)}" yet — try a different term, or browse the list on the left.</p>`;
    return;
  }

  scored.forEach(({ entry }) => {
    const row = document.createElement("button");
    row.className = "match";
    row.innerHTML = `<span class="m-formula">=${entry.formula}</span><span class="m-description">${escapeHtml(entry.description)}</span>`;
    row.addEventListener("click", () => showDetail(entry.formula));
    resultsList.appendChild(row);
  });
  resultsList.hidden = false;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function buildSidebar() {
  const groups = { Beginner: [], Intermediate: [], Advanced: [] };
  formulas.forEach((f) => {
    if (groups[f.level]) groups[f.level].push(f);
  });

  const icons = { Beginner: "\u{1F7E2}", Intermediate: "\u{1F535}", Advanced: "\u{1F7E3}" };

  sidebar.innerHTML = "";
  Object.entries(groups).forEach(([level, items]) => {
    if (items.length === 0) return;
    const group = document.createElement("div");
    group.className = `sidebar-group ${level.toLowerCase()}`;
    const heading = document.createElement("h6");
    heading.textContent = `${icons[level]} ${level}`;
    group.appendChild(heading);

    const ul = document.createElement("ul");
    items
      .sort((a, b) => a.formula.localeCompare(b.formula))
      .forEach((f) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.textContent = f.formula;
        a.dataset.formula = f.formula;
        a.addEventListener("click", () => showDetail(f.formula));
        li.appendChild(a);
        ul.appendChild(li);
      });
    group.appendChild(ul);
    sidebar.appendChild(group);
  });
}

function markActiveSidebar(formulaName) {
  sidebar.querySelectorAll("a").forEach((a) => {
    a.classList.toggle("active", a.dataset.formula === formulaName);
  });
}

function renderPopular() {
  popularList.innerHTML = "";
  POPULAR.forEach((name) => {
    if (!formulas.some((f) => f.formula === name)) return;
    const btn = document.createElement("button");
    btn.textContent = `=${name}`;
    btn.addEventListener("click", () => showDetail(name));
    popularList.appendChild(btn);
  });
}

function levelClass(level) {
  return `level-${(level || "intermediate").toLowerCase()}`;
}

function showDetail(formulaName) {
  const entry = formulas.find((f) => f.formula === formulaName);
  if (!entry) return;

  intro.hidden = true;
  resultsList.hidden = true;
  input.value = "";
  markActiveSidebar(formulaName);

  const args = entry.arguments || [];
  const cellStrip = args.length
    ? `<div class="cell-strip">
        <span class="fn-token">=${entry.formula}(</span>
        ${args.map((a) => `<span class="arg-cell ${a.optional ? "optional" : ""}"><span class="arg-name">${escapeHtml(a.name)}</span><span class="arg-flag">${a.optional ? "optional" : "required"}</span></span>`).join('<span class="fn-token" style="padding:0 4px;background:transparent;color:var(--ink-faint);">,</span>')}
        <span class="fn-token">)</span>
      </div>`
    : `<div class="cell-strip"><span class="fn-token">=${entry.formula}()</span></div>`;

  const argList = args.length
    ? `<dl class="arg-list">${args.map((a) => `<div class="arg-row"><dt>${escapeHtml(a.name)}${a.optional ? '<span class="opt-tag">optional</span>' : ""}</dt><dd>${escapeHtml(a.description)}</dd></div>`).join("")}</dl>`
    : "";

  const examplesHtml = (entry.examples || [])
    .map((ex) => `<div class="example-item"><code class="ex-formula">${escapeHtml(ex.formula)}</code><p class="ex-explanation">${escapeHtml(ex.explanation)}</p></div>`)
    .join("");

  const hrUsesHtml = (entry.hrUses || []).length
    ? `<section><h3>Common uses</h3><ul class="plain-list">${entry.hrUses.map((u) => `<li>${escapeHtml(u)}</li>`).join("")}</ul></section>`
    : "";

  const mistakesHtml = (entry.commonMistakes || []).length
    ? `<section><h3>Watch out for</h3><ul class="plain-list mistakes">${entry.commonMistakes.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul></section>`
    : "";

  const related = (entry.relatedFormulas || []).filter((r) => formulas.some((f) => f.formula === r));
  const relatedHtml = related.length
    ? `<section><h3>Related functions</h3><div class="related-grid">${related.map((r) => `<button data-formula="${r}">=${r}</button>`).join("")}</div></section>`
    : "";

  detail.innerHTML = `
    <a class="back-link" id="backLink">&larr; Back to all formulas</a>
    <div class="detail-header">
      <h2>=${entry.formula}</h2>
      <span class="badge ${levelClass(entry.level)}">${entry.level}</span>
      <span class="badge category">${entry.category}</span>
    </div>
    ${cellStrip}
    <div class="copy-row"><button class="copy-btn" id="copySyntax">Copy syntax</button></div>
    <section><h3>What it does</h3><p class="description">${escapeHtml(entry.description)}</p></section>
    ${argList ? `<section><h3>Arguments</h3>${argList}</section>` : ""}
    <section><h3>Examples</h3>${examplesHtml}</section>
    ${hrUsesHtml}
    ${mistakesHtml}
    ${relatedHtml}
  `;

  detail.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });

  document.getElementById("backLink").addEventListener("click", showHome);
  const copyBtn = document.getElementById("copySyntax");
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(entry.syntax.replace(/^=/, "=")).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy syntax"), 1500);
    });
  });
  detail.querySelectorAll(".related-grid button").forEach((btn) => {
    btn.addEventListener("click", () => showDetail(btn.dataset.formula));
  });

  history.replaceState(null, "", `#${entry.formula}`);
}

async function init() {
  try {
    const res = await fetch("formulas.json");
    formulas = await res.json();
  } catch (err) {
    intro.innerHTML = `<p>Couldn't load the formula database. Try refreshing.</p>`;
    return;
  }

  buildSidebar();
  renderPopular();

  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (!q) {
      showHome();
      return;
    }
    renderResultsList(q);
  });

  searchForm.addEventListener("submit", (e) => e.preventDefault());
  homeLink.addEventListener("click", (e) => {
    e.preventDefault();
    showHome();
  });

  const hash = decodeURIComponent(location.hash.replace("#", ""));
  if (hash && formulas.some((f) => f.formula === hash)) {
    showDetail(hash);
  }
}

init();
