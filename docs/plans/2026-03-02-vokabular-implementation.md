# Vokabular Extension Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Firefox/Zen browser extension that saves German vocabulary via right-click, auto-fetches definitions/translations/conjugations from free APIs, and provides a German-first dashboard with flashcard mode and CSV export.

**Architecture:** Self-contained WebExtension (Manifest V3). Background service worker handles context menu and API calls. Dashboard is a full browser tab page. All data stored in `browser.storage.local`.

**Tech Stack:** Vanilla JavaScript (ES modules), Browser WebExtensions API (`browser.*` namespace), Wiktionary REST API, MyMemory Translation API, Jest (unit tests on pure logic modules).

---

## Design Reference

See `docs/plans/2026-03-02-vokabular-extension-design.md` for full data model and API details.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `manifest.json`
- Create: `background.js`
- Create: `content.js`
- Create: `dashboard/index.html`
- Create: `dashboard/dashboard.js`
- Create: `dashboard/dashboard.css`
- Create: `icons/icon-48.svg`
- Create: `icons/icon-128.svg`
- Create: `src/storage.js`
- Create: `src/api.js`
- Create: `src/utils.js`
- Create: `tests/storage.test.js`
- Create: `tests/api.test.js`
- Create: `tests/utils.test.js`
- Create: `package.json`

**Step 1: Create package.json for Jest testing**

```json
{
  "name": "vokabular",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/.bin/jest",
    "test:watch": "node --experimental-vm-modules node_modules/.bin/jest --watch"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  },
  "jest": {
    "testEnvironment": "node",
    "transform": {}
  }
}
```

**Step 2: Install dependencies**

```bash
cd /Users/rui.pina/vokabular && npm install
```

Expected: `node_modules/` created, no errors.

**Step 3: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Vokabular",
  "version": "1.0.0",
  "description": "Speichere deutsches Vokabular beim Lernen.",
  "permissions": [
    "contextMenus",
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://en.wiktionary.org/*",
    "https://api.mymemory.translated.net/*"
  ],
  "background": {
    "scripts": ["background.js"],
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],
  "action": {
    "default_title": "Vokabular öffnen",
    "default_icon": {
      "48": "icons/icon-48.svg",
      "128": "icons/icon-128.svg"
    }
  },
  "icons": {
    "48": "icons/icon-48.svg",
    "128": "icons/icon-128.svg"
  }
}
```

**Step 4: Create placeholder source files (empty stubs)**

Create `background.js`:
```javascript
// background.js — loaded as service worker
import { saveWord } from './src/storage.js';
import { fetchWordData } from './src/api.js';

browser.contextMenus.create({
  id: 'save-to-vokabular',
  title: 'Zu Vokabular hinzufügen',
  contexts: ['selection'],
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'save-to-vokabular') return;
  const word = info.selectionText.trim();
  if (!word) return;

  const data = await fetchWordData(word);
  await saveWord({ word, sourceUrl: tab.url, ...data });

  browser.tabs.sendMessage(tab.id, { type: 'WORD_SAVED', word });
});

browser.action.onClicked.addListener(() => {
  browser.tabs.create({ url: browser.runtime.getURL('dashboard/index.html') });
});
```

Create `content.js`:
```javascript
// content.js — injected into all pages
browser.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'WORD_SAVED') {
    showToast(`"${msg.word}" gespeichert!`);
  }
});

function showToast(message) {
  const existing = document.getElementById('vokabular-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'vokabular-toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: '#2d6a4f',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '15px',
    zIndex: '999999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'opacity 0.3s',
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
```

Create `src/utils.js`:
```javascript
export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function normalizeWord(word) {
  return word.trim().toLowerCase();
}
```

Create empty stubs for `src/storage.js` and `src/api.js` — just export empty objects for now:
```javascript
// src/storage.js
export async function saveWord(entry) {}
export async function getAllWords() { return []; }
export async function updateWord(id, updates) {}
export async function deleteWord(id) {}
```

```javascript
// src/api.js
export async function fetchWordData(word) { return {}; }
```

**Step 5: Create simple SVG icons**

Create `icons/icon-48.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <rect width="48" height="48" rx="10" fill="#2d6a4f"/>
  <text x="24" y="34" font-size="26" text-anchor="middle" fill="white" font-family="serif" font-weight="bold">V</text>
</svg>
```

Create `icons/icon-128.svg` (same content, different dimensions):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="20" fill="#2d6a4f"/>
  <text x="64" y="90" font-size="72" text-anchor="middle" fill="white" font-family="serif" font-weight="bold">V</text>
</svg>
```

**Step 6: Commit scaffold**

```bash
cd /Users/rui.pina/vokabular
git init
git config user.email "1201568@isep.ipp.pt"
git add .
git commit --no-gpg-sign -m "chore: scaffold vokabular extension structure"
```

---

### Task 2: Storage Module

**Files:**
- Modify: `src/storage.js`
- Modify: `tests/storage.test.js`

> **Note:** `browser.storage.local` is a browser API not available in Node test environment. We'll test the storage logic by mocking `browser.storage.local` in Jest.

**Step 1: Write failing tests first**

Write `tests/storage.test.js`:

```javascript
import { jest } from '@jest/globals';

// Mock browser.storage.local
const store = {};
global.browser = {
  storage: {
    local: {
      get: jest.fn(async (key) => ({ [key]: store[key] })),
      set: jest.fn(async (obj) => { Object.assign(store, obj); }),
    },
  },
};

// Reset store before each test
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  jest.clearAllMocks();
});

const { saveWord, getAllWords, updateWord, deleteWord } = await import('../src/storage.js');

test('saveWord stores a new word entry', async () => {
  await saveWord({ word: 'lernen', id: 'test-id-1', wordType: 'verb' });
  const words = await getAllWords();
  expect(words).toHaveLength(1);
  expect(words[0].word).toBe('lernen');
  expect(words[0].status).toBe('new');
  expect(words[0].savedAt).toBeDefined();
});

test('saveWord assigns id and savedAt if missing', async () => {
  await saveWord({ word: 'Hund' });
  const words = await getAllWords();
  expect(words[0].id).toBeDefined();
  expect(words[0].savedAt).toBeDefined();
});

test('getAllWords returns empty array when no words saved', async () => {
  const words = await getAllWords();
  expect(words).toEqual([]);
});

test('updateWord updates fields of existing word by id', async () => {
  await saveWord({ word: 'gehen', id: 'abc' });
  await updateWord('abc', { notes: 'wichtiges Wort', status: 'learning' });
  const words = await getAllWords();
  expect(words[0].notes).toBe('wichtiges Wort');
  expect(words[0].status).toBe('learning');
  expect(words[0].word).toBe('gehen');
});

test('deleteWord removes word by id', async () => {
  await saveWord({ word: 'kommen', id: 'del-id' });
  await deleteWord('del-id');
  const words = await getAllWords();
  expect(words).toHaveLength(0);
});
```

**Step 2: Run tests to verify they fail**

```bash
cd /Users/rui.pina/vokabular && npm test -- tests/storage.test.js
```

Expected: All 5 tests FAIL (storage functions are empty stubs).

**Step 3: Implement storage.js**

```javascript
// src/storage.js
import { generateId } from './utils.js';

const STORAGE_KEY = 'vokabular_words';

export async function getAllWords() {
  const result = await browser.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

export async function saveWord(entry) {
  const words = await getAllWords();
  const newEntry = {
    id: entry.id || generateId(),
    savedAt: entry.savedAt || new Date().toISOString(),
    status: 'new',
    notes: '',
    ...entry,
  };
  words.push(newEntry);
  await browser.storage.local.set({ [STORAGE_KEY]: words });
  return newEntry;
}

export async function updateWord(id, updates) {
  const words = await getAllWords();
  const idx = words.findIndex(w => w.id === id);
  if (idx === -1) throw new Error(`Word with id ${id} not found`);
  words[idx] = { ...words[idx], ...updates };
  await browser.storage.local.set({ [STORAGE_KEY]: words });
  return words[idx];
}

export async function deleteWord(id) {
  const words = await getAllWords();
  const filtered = words.filter(w => w.id !== id);
  await browser.storage.local.set({ [STORAGE_KEY]: filtered });
}
```

**Step 4: Run tests to verify they pass**

```bash
cd /Users/rui.pina/vokabular && npm test -- tests/storage.test.js
```

Expected: All 5 tests PASS.

**Step 5: Commit**

```bash
cd /Users/rui.pina/vokabular
git add src/storage.js tests/storage.test.js
git commit --no-gpg-sign -m "feat: implement storage module with tests"
```

---

### Task 3: Utils Module

**Files:**
- Modify: `src/utils.js`
- Modify: `tests/utils.test.js`

**Step 1: Write failing tests**

Write `tests/utils.test.js`:

```javascript
import { normalizeWord } from '../src/utils.js';

test('normalizeWord trims and lowercases', () => {
  expect(normalizeWord('  Hund  ')).toBe('hund');
  expect(normalizeWord('LERNEN')).toBe('lernen');
  expect(normalizeWord('fahren')).toBe('fahren');
});

test('normalizeWord handles empty string', () => {
  expect(normalizeWord('')).toBe('');
});
```

**Step 2: Run to verify they fail**

```bash
npm test -- tests/utils.test.js
```

Expected: FAIL — `normalizeWord` not exported or not working.

**Step 3: Verify/fix utils.js**

The `normalizeWord` function from Task 1 should already work. If the import path fails, ensure `src/utils.js` exports it correctly (it does from the stub in Task 1). Run again.

**Step 4: Run to verify they pass**

```bash
npm test -- tests/utils.test.js
```

Expected: Both tests PASS.

**Step 5: Commit**

```bash
git add src/utils.js tests/utils.test.js
git commit --no-gpg-sign -m "feat: add utils module with tests"
```

---

### Task 4: Wiktionary API Parser

**Files:**
- Modify: `src/api.js`
- Modify: `tests/api.test.js`

> **Context:** The Wiktionary REST API endpoint for a German word is:
> `https://en.wiktionary.org/api/rest_v1/page/definition/{word}`
> Response is JSON with sections per language. We look for the `de` (German) section.
> The response contains `partOfSpeech`, `definitions` (array), and sometimes `forms`.
>
> MyMemory translation endpoint:
> `https://api.mymemory.translated.net/get?q={word}&langpair=de|en`

**Step 1: Write failing tests with fixture data**

Write `tests/api.test.js`:

```javascript
import { jest } from '@jest/globals';
import {
  parseWiktionaryResponse,
  parseMyMemoryResponse,
  detectWordType,
  extractGender,
  extractPlural,
  extractConjugation,
} from '../src/api.js';

// Fixture: minimal Wiktionary response for "fahren" (verb)
const fahrenFixture = {
  de: [
    {
      partOfSpeech: 'Verb',
      definitions: [
        {
          definition: 'sich mit einem Fahrzeug fortbewegen',
          examples: ['Ich fahre mit dem Bus.'],
        },
      ],
    },
  ],
};

// Fixture for "Hund" (noun, masculine)
const hundFixture = {
  de: [
    {
      partOfSpeech: 'Noun',
      definitions: [
        {
          definition: 'Ein domestiziertes Tier.',
          examples: ['Der Hund bellt.'],
        },
      ],
    },
  ],
};

test('detectWordType returns verb for Verb partOfSpeech', () => {
  expect(detectWordType(fahrenFixture)).toBe('verb');
});

test('detectWordType returns noun for Noun partOfSpeech', () => {
  expect(detectWordType(hundFixture)).toBe('noun');
});

test('detectWordType returns other when no German section', () => {
  expect(detectWordType({})).toBe('other');
});

test('parseWiktionaryResponse extracts definition and example for verb', () => {
  const result = parseWiktionaryResponse('fahren', fahrenFixture);
  expect(result.definitions.de).toBe('sich mit einem Fahrzeug fortbewegen');
  expect(result.example).toBe('Ich fahre mit dem Bus.');
  expect(result.wordType).toBe('verb');
});

test('parseWiktionaryResponse returns empty fields on empty response', () => {
  const result = parseWiktionaryResponse('xyz', {});
  expect(result.definitions.de).toBe('');
  expect(result.example).toBe('');
  expect(result.wordType).toBe('other');
});

// MyMemory fixture
const myMemoryFixture = {
  responseData: { translatedText: 'to drive / to travel' },
  responseStatus: 200,
};

test('parseMyMemoryResponse extracts translation', () => {
  expect(parseMyMemoryResponse(myMemoryFixture)).toBe('to drive / to travel');
});

test('parseMyMemoryResponse returns empty string on failure', () => {
  expect(parseMyMemoryResponse({ responseStatus: 400 })).toBe('');
  expect(parseMyMemoryResponse(null)).toBe('');
});
```

**Step 2: Run to verify tests fail**

```bash
npm test -- tests/api.test.js
```

Expected: All tests FAIL — functions not exported from `src/api.js`.

**Step 3: Implement api.js**

```javascript
// src/api.js

// --- Parsers (pure functions, testable without network) ---

export function detectWordType(wiktionaryData) {
  const section = wiktionaryData?.de?.[0];
  if (!section) return 'other';
  const pos = section.partOfSpeech?.toLowerCase() || '';
  if (pos.includes('verb')) return 'verb';
  if (pos.includes('noun') || pos.includes('substantiv')) return 'noun';
  if (pos.includes('adjective') || pos.includes('adjektiv')) return 'adjective';
  return 'other';
}

export function parseWiktionaryResponse(word, data) {
  const section = data?.de?.[0];
  if (!section) {
    return { wordType: 'other', definitions: { de: '' }, example: '', gender: null, plural: null, conjugation: null };
  }

  const wordType = detectWordType(data);
  const firstDef = section.definitions?.[0] || {};
  const deDefinition = stripHtml(firstDef.definition || '');
  const example = stripHtml(firstDef.examples?.[0] || '');
  const gender = extractGender(section);
  const plural = extractPlural(section);
  const conjugation = wordType === 'verb' ? extractConjugation(section) : null;

  return {
    wordType,
    definitions: { de: deDefinition, en: '' },
    example,
    gender,
    plural,
    conjugation,
  };
}

export function extractGender(section) {
  // Wiktionary sometimes includes gender hints in the definition text
  // Look for patterns like "{{m}}", "{{f}}", "{{n}}" or "masculine/feminine/neuter"
  const defText = section.definitions?.[0]?.definition || '';
  if (/\bder\b/i.test(defText) || /masculine/i.test(defText)) return 'der';
  if (/\bdie\b/i.test(defText) || /feminine/i.test(defText)) return 'die';
  if (/\bdas\b/i.test(defText) || /neuter/i.test(defText)) return 'das';
  return null;
}

export function extractPlural(section) {
  // Wiktionary doesn't reliably expose plural in the REST API definitions endpoint
  // Return null — user can fill manually or we extend later
  return null;
}

export function extractConjugation(section) {
  // Wiktionary REST API /definition endpoint rarely includes full conjugation tables
  // Return null — the word is saved without conjugation; future enhancement can call
  // the full wiki page parse API for tables
  return null;
}

export function parseMyMemoryResponse(data) {
  if (!data || data.responseStatus !== 200) return '';
  return data.responseData?.translatedText || '';
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').trim();
}

// --- Network calls (used in extension, not in tests) ---

export async function fetchWiktionary(word) {
  const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function fetchTranslation(word) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=de|en`;
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const data = await res.json();
    return parseMyMemoryResponse(data);
  } catch {
    return '';
  }
}

export async function fetchWordData(word) {
  const [wiktData, enTranslation] = await Promise.all([
    fetchWiktionary(word),
    fetchTranslation(word),
  ]);

  const parsed = parseWiktionaryResponse(word, wiktData);
  parsed.definitions.en = enTranslation;
  return parsed;
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- tests/api.test.js
```

Expected: All 8 tests PASS.

**Step 5: Commit**

```bash
git add src/api.js tests/api.test.js
git commit --no-gpg-sign -m "feat: implement API module with Wiktionary and MyMemory parsers"
```

---

### Task 5: Run All Tests

**Step 1: Run full test suite**

```bash
cd /Users/rui.pina/vokabular && npm test
```

Expected: All tests PASS. If any fail, fix before continuing.

---

### Task 6: Dashboard HTML & CSS

**Files:**
- Modify: `dashboard/index.html`
- Modify: `dashboard/dashboard.css`

> **Context:** The dashboard is a full browser tab. It has three views: Wortliste, Karteikarten, Export. Navigation tabs at top switch between them. UI is in German. English translations are hidden by default.

**Step 1: Write dashboard/index.html**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vokabular</title>
  <link rel="stylesheet" href="dashboard.css" />
</head>
<body>
  <header>
    <h1>Vokabular</h1>
    <nav>
      <button class="tab-btn active" data-tab="wortliste">Wortliste</button>
      <button class="tab-btn" data-tab="karteikarten">Karteikarten</button>
      <button class="tab-btn" data-tab="export">Export</button>
    </nav>
  </header>

  <!-- Wortliste -->
  <section id="tab-wortliste" class="tab-content active">
    <div class="search-bar">
      <input type="search" id="search-input" placeholder="Wort suchen…" />
      <span id="word-count"></span>
    </div>
    <div id="word-list"></div>
  </section>

  <!-- Karteikarten -->
  <section id="tab-karteikarten" class="tab-content">
    <div id="flashcard-container">
      <div id="flashcard-empty" hidden>
        <p>Keine Wörter zum Üben. Füge zuerst Wörter hinzu!</p>
      </div>
      <div id="flashcard">
        <div id="flashcard-progress"></div>
        <div id="flashcard-word"></div>
        <div id="flashcard-type-badge"></div>
        <div id="flashcard-de-def"></div>
        <div id="flashcard-en" class="hidden-translation">
          <button id="btn-show-english">Zeige Englisch</button>
          <div id="flashcard-en-text" hidden></div>
        </div>
        <div id="flashcard-rating">
          <button class="rate-btn" data-rating="again">Nochmal</button>
          <button class="rate-btn" data-rating="hard">Schwierig</button>
          <button class="rate-btn" data-rating="good">Gut</button>
          <button class="rate-btn" data-rating="easy">Einfach</button>
        </div>
      </div>
    </div>
  </section>

  <!-- Export -->
  <section id="tab-export" class="tab-content">
    <div class="export-options">
      <h2>Export</h2>
      <p>Exportiere deine Wörter für Anki oder als Sicherung.</p>
      <button id="btn-export-csv">Als CSV herunterladen (Anki)</button>
      <button id="btn-export-json">Als JSON kopieren</button>
      <div id="export-status"></div>
    </div>
  </section>

  <script src="dashboard.js" type="module"></script>
</body>
</html>
```

**Step 2: Write dashboard/dashboard.css**

```css
:root {
  --green: #2d6a4f;
  --green-light: #40916c;
  --green-pale: #d8f3dc;
  --text: #1b1b1b;
  --text-muted: #555;
  --bg: #f8f9fa;
  --card-bg: #fff;
  --border: #dee2e6;
  --radius: 10px;
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

header {
  background: var(--green);
  color: white;
  padding: 16px 32px;
  display: flex;
  align-items: center;
  gap: 32px;
}

header h1 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

nav { display: flex; gap: 8px; }

.tab-btn {
  background: transparent;
  border: 2px solid rgba(255,255,255,0.4);
  color: white;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s, border-color 0.2s;
}

.tab-btn:hover { background: rgba(255,255,255,0.1); }
.tab-btn.active { background: white; color: var(--green); border-color: white; font-weight: 600; }

.tab-content { display: none; padding: 32px; max-width: 900px; margin: 0 auto; }
.tab-content.active { display: block; }

/* Wortliste */
.search-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

#search-input {
  flex: 1;
  padding: 10px 16px;
  font-size: 16px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  outline: none;
  transition: border-color 0.2s;
}

#search-input:focus { border-color: var(--green); }
#word-count { color: var(--text-muted); font-size: 14px; white-space: nowrap; }

.word-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.word-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
  user-select: none;
}

.word-card-header:hover { background: #f1f3f5; }

.word-text { font-size: 18px; font-weight: 600; }

.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-verb { background: #cce5ff; color: #004085; }
.badge-noun { background: #fff3cd; color: #856404; }
.badge-adjective { background: #d4edda; color: #155724; }
.badge-other { background: #e2e3e5; color: #383d41; }

.badge-new { background: #e2e3e5; color: #383d41; }
.badge-learning { background: #fff3cd; color: #856404; }
.badge-known { background: #d4edda; color: #155724; }

.de-preview {
  flex: 1;
  color: var(--text-muted);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-show-en {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 5px;
  cursor: pointer;
  background: var(--bg);
  color: var(--text-muted);
  white-space: nowrap;
}

.btn-show-en:hover { border-color: var(--green); color: var(--green); }

.word-card-body { padding: 0 18px 18px; border-top: 1px solid var(--border); }

.en-translation {
  margin-top: 12px;
  color: var(--text-muted);
  font-style: italic;
  font-size: 15px;
}

.de-definition { margin-top: 12px; font-size: 15px; }
.example-sentence { margin-top: 8px; color: var(--text-muted); font-size: 14px; }

.conjugation-table { margin-top: 12px; border-collapse: collapse; width: 100%; }
.conjugation-table th, .conjugation-table td {
  border: 1px solid var(--border);
  padding: 6px 12px;
  font-size: 13px;
  text-align: left;
}
.conjugation-table th { background: var(--green-pale); font-weight: 600; }

.notes-field { margin-top: 12px; }
.notes-field label { font-size: 13px; color: var(--text-muted); display: block; margin-bottom: 4px; }
.notes-field textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 60px;
  outline: none;
  transition: border-color 0.2s;
}
.notes-field textarea:focus { border-color: var(--green); }

.status-selector { margin-top: 10px; display: flex; gap: 8px; align-items: center; }
.status-selector label { font-size: 13px; color: var(--text-muted); }
.status-selector select {
  font-size: 13px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 5px;
}

/* Karteikarten */
#flashcard-container { max-width: 600px; margin: 0 auto; }

#flashcard {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: var(--shadow);
  text-align: center;
}

#flashcard-progress { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }
#flashcard-word { font-size: 42px; font-weight: 700; margin-bottom: 12px; }
#flashcard-type-badge { margin-bottom: 16px; }
#flashcard-de-def { font-size: 18px; color: var(--text-muted); margin-bottom: 32px; min-height: 28px; }

#btn-show-english {
  background: var(--green);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  margin-bottom: 16px;
}

#btn-show-english:hover { background: var(--green-light); }

#flashcard-en-text { font-size: 20px; font-weight: 600; color: var(--green); margin-top: 12px; }

#flashcard-rating { display: flex; gap: 12px; justify-content: center; margin-top: 32px; flex-wrap: wrap; }

.rate-btn {
  padding: 10px 20px;
  border: 2px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  background: white;
  transition: background 0.2s, border-color 0.2s;
}

.rate-btn[data-rating="again"] { border-color: #dc3545; color: #dc3545; }
.rate-btn[data-rating="again"]:hover { background: #dc3545; color: white; }
.rate-btn[data-rating="hard"] { border-color: #fd7e14; color: #fd7e14; }
.rate-btn[data-rating="hard"]:hover { background: #fd7e14; color: white; }
.rate-btn[data-rating="good"] { border-color: #198754; color: #198754; }
.rate-btn[data-rating="good"]:hover { background: #198754; color: white; }
.rate-btn[data-rating="easy"] { border-color: var(--green); color: var(--green); }
.rate-btn[data-rating="easy"]:hover { background: var(--green); color: white; }

/* Export */
.export-options { max-width: 500px; }
.export-options h2 { margin-bottom: 12px; }
.export-options p { color: var(--text-muted); margin-bottom: 24px; }

.export-options button {
  display: block;
  width: 100%;
  margin-bottom: 12px;
  padding: 14px;
  font-size: 16px;
  border: 2px solid var(--green);
  border-radius: var(--radius);
  background: white;
  color: var(--green);
  cursor: pointer;
  text-align: left;
  font-weight: 600;
  transition: background 0.2s, color 0.2s;
}

.export-options button:hover { background: var(--green); color: white; }
#export-status { margin-top: 12px; color: var(--green); font-size: 14px; min-height: 20px; }

.empty-state { text-align: center; color: var(--text-muted); padding: 60px 0; font-size: 18px; }
```

**Step 3: Commit**

```bash
git add dashboard/index.html dashboard/dashboard.css
git commit --no-gpg-sign -m "feat: add dashboard HTML and CSS"
```

---

### Task 7: Dashboard JavaScript — Word List View

**Files:**
- Modify: `dashboard/dashboard.js`

**Step 1: Write dashboard.js — tab switching + word list**

```javascript
// dashboard/dashboard.js
import { getAllWords, updateWord, deleteWord } from '../src/storage.js';

// --- Tab switching ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
    if (tabId === 'karteikarten') initFlashcards();
  });
});

// --- Word list ---
const searchInput = document.getElementById('search-input');
const wordListEl = document.getElementById('word-list');
const wordCountEl = document.getElementById('word-count');

let allWords = [];

async function loadWords() {
  allWords = await getAllWords();
  renderWordList(allWords);
}

function renderWordList(words) {
  wordCountEl.textContent = `${words.length} Wörter`;
  if (words.length === 0) {
    wordListEl.innerHTML = '<div class="empty-state">Noch keine Wörter gespeichert.<br>Wähle Text auf einer Seite aus und klicke rechts.</div>';
    return;
  }
  wordListEl.innerHTML = words.map(w => wordCardHtml(w)).join('');
  attachCardListeners();
}

function typeBadge(type) {
  const labels = { verb: 'Verb', noun: 'Substantiv', adjective: 'Adjektiv', other: 'Sonstige' };
  return `<span class="badge badge-${type}">${labels[type] || type}</span>`;
}

function statusBadge(status) {
  const labels = { new: 'Neu', learning: 'Lernend', known: 'Gelernt' };
  return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
}

function wordCardHtml(w) {
  const conjTable = w.conjugation ? conjugationTableHtml(w.conjugation) : '';
  const nounInfo = (w.wordType === 'noun' && (w.gender || w.plural)) ?
    `<div style="margin-top:10px;font-size:14px;"><b>Geschlecht:</b> ${w.gender || '—'} &nbsp; <b>Plural:</b> ${w.plural || '—'}</div>` : '';

  return `
<div class="word-card" data-id="${w.id}">
  <div class="word-card-header">
    <span class="word-text">${escapeHtml(w.word)}</span>
    ${typeBadge(w.wordType || 'other')}
    <span class="de-preview">${escapeHtml(w.definitions?.de || '')}</span>
    ${statusBadge(w.status)}
    <button class="btn-show-en" data-id="${w.id}">Zeige Englisch</button>
  </div>
  <div class="word-card-body" hidden>
    <div class="en-translation" hidden data-en-block="${w.id}">
      <b>Übersetzung:</b> ${escapeHtml(w.definitions?.en || '—')}
    </div>
    <div class="de-definition"><b>Definition:</b> ${escapeHtml(w.definitions?.de || '—')}</div>
    ${w.example ? `<div class="example-sentence"><b>Beispiel:</b> ${escapeHtml(w.example)}</div>` : ''}
    ${nounInfo}
    ${conjTable}
    <div class="notes-field">
      <label>Notizen</label>
      <textarea data-notes-id="${w.id}">${escapeHtml(w.notes || '')}</textarea>
    </div>
    <div class="status-selector">
      <label>Status:</label>
      <select data-status-id="${w.id}">
        <option value="new" ${w.status === 'new' ? 'selected' : ''}>Neu</option>
        <option value="learning" ${w.status === 'learning' ? 'selected' : ''}>Lernend</option>
        <option value="known" ${w.status === 'known' ? 'selected' : ''}>Gelernt</option>
      </select>
    </div>
  </div>
</div>`;
}

function conjugationTableHtml(conj) {
  const tenses = Object.keys(conj);
  if (tenses.length === 0) return '';
  return tenses.map(tense => {
    const data = conj[tense];
    if (typeof data === 'string') {
      return `<div style="margin-top:10px;font-size:14px;"><b>${tense}:</b> ${escapeHtml(data)}</div>`;
    }
    const rows = Object.entries(data).map(([pronoun, form]) =>
      `<tr><td>${escapeHtml(pronoun)}</td><td><b>${escapeHtml(form)}</b></td></tr>`
    ).join('');
    return `<div style="margin-top:12px;"><b>${tense}</b><table class="conjugation-table">${rows}</table></div>`;
  }).join('');
}

function attachCardListeners() {
  // Expand/collapse on header click
  document.querySelectorAll('.word-card-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-show-en')) return;
      const body = header.nextElementSibling;
      body.hidden = !body.hidden;
    });
  });

  // Show English button
  document.querySelectorAll('.btn-show-en').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const enBlock = document.querySelector(`[data-en-block="${id}"]`);
      const body = btn.closest('.word-card').querySelector('.word-card-body');
      body.hidden = false;
      enBlock.hidden = !enBlock.hidden;
      btn.textContent = enBlock.hidden ? 'Zeige Englisch' : 'Verstecke Englisch';
    });
  });

  // Auto-save notes
  document.querySelectorAll('[data-notes-id]').forEach(textarea => {
    textarea.addEventListener('change', async () => {
      await updateWord(textarea.dataset.notesId, { notes: textarea.value });
    });
  });

  // Status change
  document.querySelectorAll('[data-status-id]').forEach(select => {
    select.addEventListener('change', async () => {
      await updateWord(select.dataset.statusId, { status: select.value });
    });
  });
}

// Search
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  const filtered = allWords.filter(w => w.word.toLowerCase().includes(q));
  renderWordList(filtered);
});

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Initial load
await loadWords();

// Reload when storage changes (word just saved from another tab)
browser.storage.onChanged.addListener((changes) => {
  if (changes.vokabular_words) loadWords();
});
```

**Step 2: Commit**

```bash
git add dashboard/dashboard.js
git commit --no-gpg-sign -m "feat: implement word list view in dashboard"
```

---

### Task 8: Dashboard JavaScript — Flashcard & Export Views

**Files:**
- Modify: `dashboard/dashboard.js` (append to existing)

**Step 1: Add flashcard logic to dashboard.js**

Append to `dashboard/dashboard.js`:

```javascript
// --- Flashcards ---
let flashQueue = [];
let flashIndex = 0;

async function initFlashcards() {
  const words = await getAllWords();
  // Prioritise new and learning words
  flashQueue = words.filter(w => w.status !== 'known');
  if (flashQueue.length === 0) flashQueue = words; // fallback: show all
  flashIndex = 0;
  showFlashcard();
}

function showFlashcard() {
  const container = document.getElementById('flashcard');
  const emptyEl = document.getElementById('flashcard-empty');

  if (flashQueue.length === 0) {
    container.hidden = true;
    emptyEl.hidden = false;
    return;
  }

  container.hidden = false;
  emptyEl.hidden = true;

  const w = flashQueue[flashIndex];
  document.getElementById('flashcard-progress').textContent =
    `${flashIndex + 1} / ${flashQueue.length}`;
  document.getElementById('flashcard-word').textContent = w.word;
  document.getElementById('flashcard-type-badge').innerHTML = typeBadge(w.wordType || 'other');
  document.getElementById('flashcard-de-def').textContent = w.definitions?.de || '';

  // Reset English reveal
  const enText = document.getElementById('flashcard-en-text');
  const showBtn = document.getElementById('btn-show-english');
  enText.hidden = true;
  enText.textContent = w.definitions?.en || '—';
  showBtn.textContent = 'Zeige Englisch';
  showBtn.hidden = false;
}

document.getElementById('btn-show-english')?.addEventListener('click', () => {
  const enText = document.getElementById('flashcard-en-text');
  const btn = document.getElementById('btn-show-english');
  enText.hidden = false;
  btn.hidden = true;
});

document.querySelectorAll('.rate-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const rating = btn.dataset.rating;
    const w = flashQueue[flashIndex];
    const statusMap = { again: 'new', hard: 'learning', good: 'learning', easy: 'known' };
    await updateWord(w.id, { status: statusMap[rating] });

    flashIndex = (flashIndex + 1) % flashQueue.length;
    showFlashcard();
  });
});

// --- Export ---
document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
  const words = await getAllWords();
  const csv = buildCsv(words);
  downloadFile(csv, 'vokabular-export.csv', 'text/csv;charset=utf-8;');
  document.getElementById('export-status').textContent = 'CSV heruntergeladen!';
});

document.getElementById('btn-export-json')?.addEventListener('click', async () => {
  const words = await getAllWords();
  await navigator.clipboard.writeText(JSON.stringify(words, null, 2));
  document.getElementById('export-status').textContent = 'JSON in Zwischenablage kopiert!';
});

function buildCsv(words) {
  const header = ['Wort', 'Englisch', 'Definition (DE)', 'Beispiel', 'Typ', 'Geschlecht', 'Plural', 'Status'];
  const rows = words.map(w => [
    w.word,
    w.definitions?.en || '',
    w.definitions?.de || '',
    w.example || '',
    w.wordType || '',
    w.gender || '',
    w.plural || '',
    w.status || '',
  ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'));
  return [header.join(';'), ...rows].join('\n');
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Step 2: Commit**

```bash
git add dashboard/dashboard.js
git commit --no-gpg-sign -m "feat: add flashcard and export views to dashboard"
```

---

### Task 9: Manual Testing in Browser

> **Context:** Browser extensions can't be unit-tested end-to-end without a real browser. These steps load the extension in Firefox/Zen and verify the full flow manually.

**Step 1: Load extension in Firefox/Zen**

1. Open Firefox or Zen Browser
2. Navigate to `about:debugging`
3. Click "This Firefox" in left sidebar
4. Click "Load Temporary Add-on…"
5. Navigate to `/Users/rui.pina/vokabular/` and select `manifest.json`
6. The Vokabular icon should appear in the toolbar

**Step 2: Test save flow**

1. Navigate to `https://learngerman.dw.com/en/nicos-weg/s-54121798` (or any page with German text)
2. Select a German word with your mouse (e.g., "lernen")
3. Right-click → click "Zu Vokabular hinzufügen"
4. Verify: a green toast notification appears saying `"lernen" gespeichert!`

**Step 3: Test dashboard — Word List**

1. Click the Vokabular toolbar icon
2. Verify: new tab opens with the dashboard
3. Verify: saved word appears in the Wortliste
4. Click the word card header → verify it expands with definition, example, notes
5. Click "Zeige Englisch" → verify English translation appears
6. Edit the notes field → navigate away and back → verify notes were saved
7. Change status dropdown → verify status badge updates

**Step 4: Test dashboard — Karteikarten**

1. Click "Karteikarten" tab
2. Verify: flashcard shows the German word and DE definition
3. Click "Zeige Englisch" → verify EN translation appears
4. Click a rating button (e.g., "Gut") → verify next card appears

**Step 5: Test dashboard — Export**

1. Click "Export" tab
2. Click "Als CSV herunterladen" → verify a `.csv` file downloads
3. Open the CSV → verify columns: Wort, Englisch, Definition, Beispiel, Typ, Geschlecht, Plural, Status
4. Click "Als JSON kopieren" → paste into a text editor → verify valid JSON array

**Step 6: Commit if any fixes were made**

```bash
git add -p  # stage only what changed
git commit --no-gpg-sign -m "fix: manual testing corrections"
```

---

### Task 10: Final Test Run & Clean Up

**Step 1: Run all automated tests one last time**

```bash
cd /Users/rui.pina/vokabular && npm test
```

Expected: All tests PASS.

**Step 2: Final commit**

```bash
git add .
git commit --no-gpg-sign -m "chore: final cleanup and all tests passing"
```

---

## Summary

| Task | Deliverable |
|------|-------------|
| 1 | Project scaffold, manifest, icons, package.json |
| 2 | `src/storage.js` — tested CRUD for words |
| 3 | `src/utils.js` — tested helper functions |
| 4 | `src/api.js` — tested Wiktionary + MyMemory parsers |
| 5 | Full test suite green |
| 6 | Dashboard HTML + CSS |
| 7 | Word list view (expand, show EN, edit notes, status) |
| 8 | Flashcard + export views |
| 9 | Manual browser testing |
| 10 | All tests pass, final commit |
