# Vokabular — Firefox/Zen Browser Extension Design

**Date:** 2026-03-02
**Status:** Approved

## Overview

A Firefox/Zen browser extension that captures German vocabulary while using Nico's Weg (and any other German-learning site). Right-click any word or selection to save it. A full-tab dashboard lets you browse, study with flashcards, and export to Anki.

---

## Architecture

**Approach:** Self-contained WebExtension (Manifest V3), no server required.

```
vokabular/
├── manifest.json          # MV3 extension manifest
├── background.js          # Service worker: saves words, calls APIs, context menu
├── content.js             # Injected into pages: shows save confirmation toast
├── dashboard/
│   ├── index.html         # Full-tab dashboard page
│   ├── dashboard.js
│   └── dashboard.css
└── icons/
    ├── icon-48.png
    └── icon-128.png
```

**Save flow:**
1. User selects text on any page
2. Right-clicks → "Save to Vokabular"
3. Background service worker calls dictionary APIs
4. Stores enriched word entry in `browser.storage.local`
5. Content script shows a brief confirmation toast on the page

---

## Data Model

Each saved entry is stored in `browser.storage.local` under key `vokabular_words` as an array:

```json
{
  "id": "uuid-v4",
  "word": "fahren",
  "savedAt": "2026-03-02T09:30:00Z",
  "sourceUrl": "https://nicoswegurl...",
  "wordType": "verb",
  "definitions": {
    "de": "sich mit einem Fahrzeug fortbewegen.",
    "en": "to drive / to travel"
  },
  "example": "Ich fahre jeden Tag mit dem Bus.",
  "gender": null,
  "plural": null,
  "conjugation": {
    "present": {
      "ich": "fahre",
      "du": "fährst",
      "er/sie/es": "fährt",
      "wir": "fahren",
      "ihr": "fahrt",
      "sie/Sie": "fahren"
    },
    "past": {
      "ich": "fuhr",
      "du": "fuhrst",
      "er/sie/es": "fuhr",
      "wir": "fuhren",
      "ihr": "fuhrt",
      "sie/Sie": "fuhren"
    },
    "perfect": "ist gefahren"
  },
  "notes": "",
  "status": "new"
}
```

**For nouns:** `conjugation` is null, `gender` = `"der"/"die"/"das"`, `plural` = plural form.
**For adjectives/other:** `gender`, `plural`, `conjugation` are all null.

**`status` values:** `new` | `learning` | `known`

---

## Dictionary APIs

All free, no API key required for basic usage:

| Data | API | Notes |
|------|-----|-------|
| DE definition, gender, plural, conjugation | Wiktionary REST API (`en.wiktionary.org/api/rest_v1`) | Best source for German grammar data |
| EN translation | MyMemory API (`api.mymemory.translated.net`) | 5000 req/day free, no key needed |
| Example sentence | Wiktionary (extracted from entry) | Fallback: leave blank for manual fill |

If APIs fail or return no data, the word is saved with empty fields — user can fill them manually in the dashboard.

---

## Dashboard

Accessed by clicking the extension icon — opens as a full browser tab.

### View 1: Wortliste (Word List)

- Search bar at top (filters by word in real time)
- Table/list of all saved words showing: word, word type badge, DE definition, status badge
- **English translation is hidden by default** — click "Zeige Übersetzung" to reveal inline
- Click any row to expand:
  - Full conjugation table (for verbs) or gender + plural (for nouns)
  - Example sentence
  - Personal notes field (editable inline, auto-saved)
  - Status selector (new / learning / known)

### View 2: Karteikarten (Flashcards)

- Shows one word at a time: German word + DE definition
- Button: **"Zeige Englisch"** → reveals EN translation
- Self-rating buttons:
  - Nochmal (again) → status stays `new`
  - Schwierig (hard) → status = `learning`
  - Gut (good) → status = `learning`
  - Einfach (easy) → status = `known`
- Words with status `new` and `learning` are prioritised

### View 3: Export

- **CSV export** — columns: word, EN translation, DE definition, example, gender, plural, conjugation summary, word type
- CSV is formatted for Anki import (semicolon-separated)
- Button to copy all words to clipboard as JSON (for backup)

---

## UI Language

- All UI text in German
- English translations hidden behind "Zeige Übersetzung" / "Zeige Englisch" toggles
- Error messages and toasts also in German

---

## Browser Compatibility

- **Target:** Firefox and Zen Browser (Zen is Firefox-based, uses same WebExtension API)
- Manifest V3 with Firefox-specific adjustments where needed (`browser.*` namespace)
- No Chrome-only APIs used

---

## Out of Scope (for now)

- Cloud sync or multi-device support
- Spaced repetition algorithm (SRS) — status is manual
- Audio pronunciation
- Tagging / grouping by lesson
