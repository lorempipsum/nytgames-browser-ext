(() => {
  "use strict";

  function getPuzzle() {
    const route = crosswordDates.parsePath(window.location.pathname);
    if (!route) return null;
    // Dated URLs are authoritative. Undated pages must expose a puzzle date.
    const headerDate = document.querySelector(".xwd__details--date");
    const date = route.date || crosswordDates.parseDateFromText(headerDate?.innerText) ||
      crosswordDates.parseFilename(window.gameData?.filename, route.type);
    return date ? { type: route.type, date } : null;
  }

  function createNavButton(puzzle, { label, title, unit, delta, primary = false }) {
    const target = crosswordDates.shiftDate(puzzle.date, unit, delta);
    const button = document.createElement("a");
    button.className = "crossword-date-nav-btn";
    if (delta < 0) button.classList.add("crossword-date-nav-dec");
    if (primary) button.classList.add("crossword-date-nav-primary");
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-label", title);
    if (crosswordDates.isDateValid(puzzle.type, target)) {
      button.href = crosswordDates.buildUrl(puzzle.type, target);
    } else {
      button.classList.add("is-disabled");
      button.title += " (Date outside available range)";
      button.setAttribute("aria-disabled", "true");
    }
    return button;
  }

  function createNavGroup(puzzle, unit, name) {
    const group = document.createElement("div");
    group.className = "crossword-date-nav-group";
    const key = unit === "year" ? "Y" : unit === "month" ? "M" : "D";
    group.appendChild(createNavButton(puzzle, {
      label: "−", title: `Previous ${name} (−1) [Alt+Shift+${key}]`, unit, delta: -1
    }));
    group.appendChild(createNavButton(puzzle, {
      label: `+ 1 ${name}`, title: `Next ${name} (+1) [Alt+${key}]`, unit, delta: 1, primary: unit === "year"
    }));
    return group;
  }

  function injectNav(puzzle, key) {
    const existing = document.getElementById("crossword-date-nav");
    if (existing?.dataset.puzzle === key) return;
    existing?.remove();
    if (!puzzle) return;
    const row = document.querySelector(".xwd__header--row");
    if (!row) return;
    row.classList.add("crossword-date-nav-host");
    const nav = document.createElement("div");
    nav.id = "crossword-date-nav";
    nav.className = "crossword-date-nav";
    nav.dataset.puzzle = key;
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Crossword date navigation");
    for (const [unit, name] of [["year", "Year"], ["month", "Month"], ["day", "Day"]]) {
      nav.appendChild(createNavGroup(puzzle, unit, name));
    }
    row.appendChild(nav);
  }

  function injectModalButton(puzzle, key) {
    const existing = document.getElementById("crossword-date-modal-nav");
    if (existing?.dataset.puzzle === key) return;
    existing?.remove();
    if (!puzzle) return;
    const target = crosswordDates.shiftDate(puzzle.date, "year", 1);
    if (!crosswordDates.isDateValid(puzzle.type, target)) return;
    const modal = document.querySelector(".xwd__modal--content, .pz-moment__container");
    // Avoid adding a completion shortcut to login, help or start dialogs.
    if (!modal || !/congratulations|you solved|puzzle solved|completed the/i.test(modal.innerText || "")) return;
    const footer = modal.querySelector(".pz-moment__button-group") || modal;
    const button = document.createElement("a");
    button.id = "crossword-date-modal-nav";
    button.className = "crossword-date-modal-nav-btn";
    button.dataset.puzzle = key;
    button.textContent = `Next Year (${target.year}) →`;
    button.href = crosswordDates.buildUrl(puzzle.type, target);
    button.title = "Jump to next year on this date [Alt+Y]";
    footer.appendChild(button);
  }

  function refresh() {
    const puzzle = getPuzzle();
    const key = puzzle ? `${puzzle.type}/${puzzle.date.year}/${puzzle.date.month}/${puzzle.date.day}` : "";
    injectNav(puzzle, key);
    injectModalButton(puzzle, key);
  }

  window.addEventListener("keydown", (event) => {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT" || active.isContentEditable)) return;
    if (!event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const unit = { y: "year", m: "month", d: "day" }[event.key.toLowerCase()];
    const puzzle = getPuzzle();
    if (!unit || !puzzle) return;
    const target = crosswordDates.shiftDate(puzzle.date, unit, event.shiftKey ? -1 : 1);
    event.preventDefault();
    if (crosswordDates.isDateValid(puzzle.type, target)) {
      window.location.href = crosswordDates.buildUrl(puzzle.type, target);
    }
  });

  let frameId = null;
  const observer = new MutationObserver(() => {
    if (frameId !== null) return;
    frameId = requestAnimationFrame(() => {
      frameId = null;
      refresh();
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener("popstate", refresh);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh);
  else refresh();
})();
