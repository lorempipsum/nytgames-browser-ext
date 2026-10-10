# Crossword Date Navigator

A lightweight browser extension for NYT Mini, Midi and regular Daily crosswords. It adds date controls to the puzzle header so you can jump by year, month or day while staying in the same crossword type.

An independent extension, not affiliated with or endorsed by The New York Times.

![Preview](assets/preview.png)

## Features

- **On-Screen Navigation**: Adds `+ 1 Year`, `+ 1 Month`, and `+ 1 Day` buttons (with `−` decrement steppers) directly into the puzzle header.
- **Focus on Flow**: Advance years with one click without touching the URL bar.
- **Completion Screen Shortcut**: Adds a direct "Next Year" button in the puzzle completion moment screen.
- **Date Range Aware**: Disables future dates, dates before August 21, 2014 for Mini, and dates before November 21, 1993 for Daily. Handles leap years and month-end dates. Midi has no assumed archive start date: a target date may be unavailable if no puzzle was published then.
- **Keeps Your Puzzle Type**: Mini links remain Mini, Midi links remain Midi, and regular crossword links remain Daily. Supports today's undated pages and dated archive URLs.
- **Keyboard Shortcuts**:
  - `Alt + Y`: Next Year (+1Y)
  - `Alt + Shift + Y`: Previous Year (−1Y)
  - `Alt + M`: Next Month (+1M)
  - `Alt + Shift + M`: Previous Month (−1M)
  - `Alt + D`: Next Day (+1D)
  - `Alt + Shift + D`: Previous Day (−1D)

## Installation (Chrome, Edge, Brave)

1. Clone this repository:
   ```bash
   git clone https://github.com/lorempipsum/nytgames-browser-ext.git
   ```
2. Open `chrome://extensions` (or `edge://extensions` / `brave://extensions`).
3. Toggle on **Developer mode** in the top right.
4. Click **Load unpacked**.
5. Select the `nytgames-browser-ext` folder.
6. Open [The Mini](https://www.nytimes.com/crosswords/game/mini), [The Midi](https://www.nytimes.com/crosswords/game/midi), [The Daily Crossword](https://www.nytimes.com/crosswords/game/daily), or a dated archive puzzle.

Puzzle access still depends on your NYT account and subscription. The extension does not grant archive access. Legacy named puzzle packs under `/crosswords/game/paid/` are not supported.

## Build and verification

- Package: `uv run python scripts/package_extension.py`
- Output: `dist/crossword-date-navigator.zip`
- Tests: `node --test tests/navigation.test.cjs`

The extension waits for a puzzle date on undated pages and refreshes its controls when the page changes puzzles. Automated tests use local page fixtures; live NYT page compatibility must be checked after reloading the extension.

## License

This project is licensed under the [MIT License](LICENSE).
