const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const navigation = fs.readFileSync(path.join(root, 'navigation.js'), 'utf8');
const content = fs.readFileSync(path.join(root, 'content.js'), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : [2026, 9, 10, 12]));
  }
}

function core() {
  const context = vm.createContext({ Date: FixedDate });
  vm.runInContext(navigation, context);
  return vm.runInContext('crosswordDates', context);
}

// Small DOM fixture for running the actual content scripts, including refreshes
// and keyboard events. No NYT requests, puzzle answers, or external dependencies.
function page(pathname, dateText = '', modalText = '') {
  class Element {
    constructor(tagName) {
      this.tagName = tagName.toUpperCase();
      this.children = [];
      this.dataset = {};
      this.attributes = {};
      this.className = '';
      this.innerText = '';
      this.classList = { add: name => { this.className += ` ${name}`; } };
    }
    appendChild(child) {
      child.parent = this;
      this.children.push(child);
      return child;
    }
    setAttribute(name, value) { this.attributes[name] = value; }
    remove() {
      if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this);
      this.parent = null;
    }
    querySelector() { return null; }
  }
  const row = new Element('div');
  const date = new Element('span');
  date.innerText = dateText;
  const modal = new Element('div');
  modal.innerText = modalText;
  const find = (element, id) => element.id === id ? element : element.children.map(child => find(child, id)).find(Boolean);
  const listeners = {};
  const location = { pathname, href: `https://www.nytimes.com${pathname}` };
  let observer;
  const frames = [];
  const document = {
    documentElement: {}, readyState: 'complete', activeElement: null,
    createElement: tag => new Element(tag),
    getElementById: id => find(row, id) || find(modal, id),
    querySelector: selector => {
      if (selector === '.xwd__header--row') return row;
      if (selector === '.xwd__details--date') return date;
      if (selector === '.xwd__modal--content, .pz-moment__container') return modalText ? modal : null;
      return null;
    }
  };
  const context = vm.createContext({
    Date: FixedDate, document,
    window: { location, addEventListener: (name, callback) => { listeners[name] = callback; } },
    MutationObserver: class {
      constructor(callback) { observer = callback; }
      observe() {}
    },
    requestAnimationFrame: callback => { frames.push(callback); return frames.length; }
  });
  vm.runInContext(navigation, context);
  vm.runInContext(content, context);
  return {
    document, row, date, modal, location,
    nav: () => document.getElementById('crossword-date-nav'),
    buttons: () => document.getElementById('crossword-date-nav')?.children.flatMap(group => group.children) || [],
    refresh: () => { observer(); frames.splice(0).forEach(callback => callback()); },
    key: (key, extras = {}) => {
      let prevented = false;
      listeners.keydown({ key, altKey: true, shiftKey: false, ctrlKey: false, metaKey: false,
        preventDefault: () => { prevented = true; }, ...extras });
      return prevented;
    }
  };
}

for (const type of ['mini', 'midi', 'daily']) {
  test(`${type}: date links, completion link and shortcuts retain puzzle type`, () => {
    const p = page(`/crosswords/game/${type}/2024/02/29`, '', 'Congratulations! You solved the puzzle.');
    const urls = p.buttons().map(button => button.href);
    assert.equal(urls.length, 6);
    assert.deepEqual(urls, ['2023/02/28', '2025/02/28', '2024/01/29', '2024/03/29', '2024/02/28', '2024/03/01']
      .map(date => `https://www.nytimes.com/crosswords/game/${type}/${date}`));
    assert.equal(p.document.getElementById('crossword-date-modal-nav').href,
      `https://www.nytimes.com/crosswords/game/${type}/2025/02/28`);
    assert.equal(p.key('D'), true);
    assert.equal(p.location.href, `https://www.nytimes.com/crosswords/game/${type}/2024/03/01`);
    p.key('M', { shiftKey: true });
    assert.equal(p.location.href, `https://www.nytimes.com/crosswords/game/${type}/2024/01/29`);
  });

  test(`${type}: undated pages wait for a date, then update when puzzle changes`, () => {
    const p = page(`/crosswords/game/${type}`);
    assert.equal(p.nav(), undefined);
    assert.equal(p.key('d'), false);
    p.date.innerText = 'Friday, January 31, 2025';
    p.refresh();
    assert.equal(p.buttons()[3].href, `https://www.nytimes.com/crosswords/game/${type}/2025/02/28`);
    const firstNav = p.nav();
    p.refresh();
    assert.equal(p.nav(), firstNav, 'Do not duplicate controls on unrelated DOM changes');
    p.date.innerText = 'Saturday, February 1, 2025';
    p.refresh();
    assert.notEqual(p.nav(), firstNav);
    assert.equal(p.buttons()[5].href, `https://www.nytimes.com/crosswords/game/${type}/2025/02/02`);
  });
}

test('different archive limits and future dates apply to buttons and shortcuts', () => {
  const mini = page('/crosswords/game/mini/2014/08/21');
  assert.equal(mini.buttons()[4].href, undefined);
  assert.equal(mini.buttons()[4].attributes['aria-disabled'], 'true');
  const daily = page('/crosswords/game/daily/1993/11/21');
  assert.equal(daily.buttons()[4].href, undefined);
  const olderDaily = page('/crosswords/game/daily/2000/01/01');
  assert.equal(olderDaily.buttons()[4].href, 'https://www.nytimes.com/crosswords/game/daily/1999/12/31');
  const current = page('/crosswords/game/midi/2026/10/10');
  assert.equal(current.buttons()[5].href, undefined);
  current.key('d');
  assert.equal(current.location.href, 'https://www.nytimes.com/crosswords/game/midi/2026/10/10');
});

test('date arithmetic handles month ends, leap years and year rollover', () => {
  const dates = core();
  assert.deepEqual(plain(dates.shiftDate({ year: 2024, month: 1, day: 31 }, 'month', 1)), { year: 2024, month: 2, day: 29 });
  assert.deepEqual(plain(dates.shiftDate({ year: 2025, month: 12, day: 31 }, 'day', 1)), { year: 2026, month: 1, day: 1 });
  assert.deepEqual(plain(dates.shiftDate({ year: 2025, month: 1, day: 31 }, 'month', -1)), { year: 2024, month: 12, day: 31 });
});

test('invalid dates and unrelated routes are rejected', () => {
  const dates = core();
  for (const pathname of ['/crosswords/game/mini/2025/02/29', '/crosswords/game/daily/2025/13/01',
    '/crosswords/game/minimal', '/crosswords/game/paid/midi-07-25-25', '/games/wordle']) {
    assert.equal(dates.parsePath(pathname), null);
    assert.equal(page(pathname).nav(), undefined);
  }
  assert.equal(dates.parseDateFromText('February 31, 2025'), null);
  assert.equal(dates.parseDateFromText('Unknown 5, 2025'), null);
  assert.equal(dates.parseFilename('mini/2024-02-29', 'daily'), null);
  assert.deepEqual(plain(dates.parseFilename('daily/2024-02-29.puz', 'daily')), { year: 2024, month: 2, day: 29 });
  assert.equal(dates.buildUrl('paid', { year: 2024, month: 2, day: 29 }), null);
});

test('editing inputs and browser shortcuts do not trigger navigation', () => {
  const p = page('/crosswords/game/daily/2024/02/29');
  for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) {
    p.document.activeElement = { tagName };
    assert.equal(p.key('d'), false);
  }
  p.document.activeElement = { isContentEditable: true };
  assert.equal(p.key('d'), false);
  p.document.activeElement = null;
  for (const extras of [{ ctrlKey: true }, { metaKey: true }, { altKey: false }, { repeat: true }]) {
    assert.equal(p.key('d', extras), false);
  }
  assert.equal(p.location.href, 'https://www.nytimes.com/crosswords/game/daily/2024/02/29');
});

test('controls refresh on a route change without switching types accidentally', () => {
  const p = page('/crosswords/game/mini/2024/02/29');
  p.location.pathname = '/crosswords/game/daily/2024/03/01';
  p.refresh();
  assert.equal(p.row.children.length, 1);
  assert.equal(p.buttons()[5].href, 'https://www.nytimes.com/crosswords/game/daily/2024/03/02');
  p.location.pathname = '/crosswords/game/paid/unrelated';
  p.refresh();
  assert.equal(p.nav(), undefined);
});

test('login and start dialogs do not get a completion shortcut', () => {
  const p = page('/crosswords/game/daily/2024/02/29', '', 'Log in to start solving');
  assert.equal(p.document.getElementById('crossword-date-modal-nav'), undefined);
});

test('manifest declares all three crossword types and loads date helpers first', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  assert.equal(manifest.name, 'Crossword Date Navigator');
  assert.equal(manifest.version, '1.1.0');
  assert.deepEqual(manifest.content_scripts[0].matches, ['mini', 'midi', 'daily']
    .map(type => `https://www.nytimes.com/crosswords/game/${type}*`));
  assert.deepEqual(manifest.content_scripts[0].js, ['navigation.js', 'content.js']);
});
