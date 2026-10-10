(() => {
  "use strict";

  const MIN_DATE = new Date(2014, 7, 21); // NYT Mini launched August 21, 2014
  const TODAY = new Date();

  function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function parseDateFromText(text) {
    if (!text) return null;
    const months = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };
    const match = text.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (match) {
      const monthName = match[1].toLowerCase();
      const month = months[monthName];
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      if (month && day && year) {
        return { year, month, day };
      }
    }
    return null;
  }

  function getCurrentDate() {
    // 1. From URL pathname: /crosswords/game/mini/YYYY/MM/DD
    const urlMatch = window.location.pathname.match(/\/crosswords\/game\/mini\/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (urlMatch) {
      return {
        year: parseInt(urlMatch[1], 10),
        month: parseInt(urlMatch[2], 10),
        day: parseInt(urlMatch[3], 10)
      };
    }

    // 2. From window.gameData if available
    try {
      if (window.gameData && typeof window.gameData.filename === "string") {
        const gameMatch = window.gameData.filename.match(/mini\/(\d{4})-(\d{2})-(\d{2})/);
        if (gameMatch) {
          return {
            year: parseInt(gameMatch[1], 10),
            month: parseInt(gameMatch[2], 10),
            day: parseInt(gameMatch[3], 10)
          };
        }
      }
    } catch (_) {}

    // 3. From puzzle header date element (.xwd__details--date)
    const dateEl = document.querySelector(".xwd__details--date");
    if (dateEl) {
      const parsed = parseDateFromText(dateEl.innerText);
      if (parsed) return parsed;
    }

    // Fallback: Current local date
    return {
      year: TODAY.getFullYear(),
      month: TODAY.getMonth() + 1,
      day: TODAY.getDate()
    };
  }

  function calculateTargetDate(current, unit, delta) {
    let { year, month, day } = current;

    if (unit === "year") {
      year += delta;
      const maxDays = getDaysInMonth(year, month);
      day = Math.min(day, maxDays);
    } else if (unit === "month") {
      let targetMonth = month + delta;
      let targetYear = year;
      while (targetMonth > 12) {
        targetMonth -= 12;
        targetYear += 1;
      }
      while (targetMonth < 1) {
        targetMonth += 12;
        targetYear -= 1;
      }
      year = targetYear;
      month = targetMonth;
      const maxDays = getDaysInMonth(year, month);
      day = Math.min(day, maxDays);
    } else if (unit === "day") {
      const dt = new Date(year, month - 1, day);
      dt.setDate(dt.getDate() + delta);
      year = dt.getFullYear();
      month = dt.getMonth() + 1;
      day = dt.getDate();
    }

    return { year, month, day };
  }

  function isDateValid(dateObj) {
    const dt = new Date(dateObj.year, dateObj.month - 1, dateObj.day);
    // Strip time for comparison
    const minCompare = new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), MIN_DATE.getDate());
    const maxCompare = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
    return dt >= minCompare && dt <= maxCompare;
  }

  function buildUrl(dateObj) {
    const mm = String(dateObj.month).padStart(2, "0");
    const dd = String(dateObj.day).padStart(2, "0");
    return `https://www.nytimes.com/crosswords/game/mini/${dateObj.year}/${mm}/${dd}`;
  }

  function createNavButton({ label, title, targetDate, isPrimary = false, isDecrement = false }) {
    const a = document.createElement("a");
    a.className = "nyt-mini-nav-btn";
    if (isDecrement) a.classList.add("nyt-mini-nav-dec");
    if (isPrimary) a.classList.add("nyt-mini-nav-primary");

    const valid = isDateValid(targetDate);
    const url = buildUrl(targetDate);
    a.href = url;
    a.textContent = label;

    if (!valid) {
      a.classList.add("is-disabled");
      a.title = `${title} (Date outside available range)`;
      a.removeAttribute("href");
    } else {
      a.title = title;
      a.addEventListener("click", (e) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
          e.preventDefault();
          window.location.href = url;
        }
      });
    }

    return a;
  }

  function createNavGroup(unit, name, currentDate) {
    const group = document.createElement("div");
    group.className = "nyt-mini-nav-group";

    const nextDate = calculateTargetDate(currentDate, unit, 1);
    const prevDate = calculateTargetDate(currentDate, unit, -1);

    const shortcutNext = unit === "year" ? "Alt+Y" : unit === "month" ? "Alt+M" : "Alt+D";
    const shortcutPrev = unit === "year" ? "Alt+Shift+Y" : unit === "month" ? "Alt+Shift+M" : "Alt+Shift+D";

    // Decrement button
    const decBtn = createNavButton({
      label: "−",
      title: `Previous ${name} (−1) [${shortcutPrev}]`,
      targetDate: prevDate,
      isDecrement: true
    });

    // Increment button
    const incBtn = createNavButton({
      label: `+ 1 ${name}`,
      title: `Next ${name} (+1) [${shortcutNext}]`,
      targetDate: nextDate,
      isPrimary: unit === "year" // Make Year primary per user request
    });

    group.appendChild(decBtn);
    group.appendChild(incBtn);
    return group;
  }

  function injectNav() {
    const existing = document.getElementById("nyt-mini-date-nav");
    if (existing) return;

    // Target the header row inside the red box
    const row = document.querySelector(".xwd__header--row");
    if (!row) return;

    // Adjust details container flex if needed
    const details = row.querySelector(".xwd__header--puzzle-details-container");
    if (details) {
      details.style.width = "auto";
      details.style.flex = "1 1 auto";
    }

    const currentDate = getCurrentDate();
    const nav = document.createElement("div");
    nav.id = "nyt-mini-date-nav";
    nav.className = "nyt-mini-nav";

    nav.appendChild(createNavGroup("year", "Year", currentDate));
    nav.appendChild(createNavGroup("month", "Month", currentDate));
    nav.appendChild(createNavGroup("day", "Day", currentDate));

    row.appendChild(nav);
  }

  function injectModalButton() {
    if (document.getElementById("nyt-mini-modal-nav")) return;

    // Look for completion modal moments
    const modalFooter = document.querySelector(".xwd__modal--content, .pz-moment__button-group, .pz-moment__container");
    if (!modalFooter) return;

    const currentDate = getCurrentDate();
    const nextYear = calculateTargetDate(currentDate, "year", 1);
    if (!isDateValid(nextYear)) return;

    const modalBtn = document.createElement("a");
    modalBtn.id = "nyt-mini-modal-nav";
    modalBtn.className = "nyt-mini-modal-nav-btn";
    modalBtn.textContent = `Next Year (${nextYear.year}) →`;
    modalBtn.href = buildUrl(nextYear);
    modalBtn.title = "Jump to next year on this date [Alt+Y]";

    modalFooter.appendChild(modalBtn);
  }

  // Keyboard shortcut listener
  window.addEventListener("keydown", (e) => {
    // Ignore when user is typing in form inputs
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
      return;
    }

    if (!e.altKey) return;

    const key = e.key.toLowerCase();
    const direction = e.shiftKey ? -1 : 1;
    let unit = null;

    if (key === "y") unit = "year";
    else if (key === "m") unit = "month";
    else if (key === "d") unit = "day";

    if (unit) {
      e.preventDefault();
      const current = getCurrentDate();
      const target = calculateTargetDate(current, unit, direction);
      if (isDateValid(target)) {
        window.location.href = buildUrl(target);
      }
    }
  });

  // DOM observer to re-inject when React re-renders header
  let frameId = null;
  const observer = new MutationObserver(() => {
    if (frameId) return;
    frameId = requestAnimationFrame(() => {
      frameId = null;
      injectNav();
      injectModalButton();
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Initial runs
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      injectNav();
      injectModalButton();
    });
  } else {
    injectNav();
    injectModalButton();
  }
})();
