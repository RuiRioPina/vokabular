// dashboard/dashboard.js
import { getAllWords, updateWord } from '../src/storage.js';

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
  return `<span class="badge badge-${escapeHtml(type)}">${escapeHtml(labels[type] || type)}</span>`;
}

function statusBadge(status) {
  const labels = { new: 'Neu', learning: 'Lernend', known: 'Gelernt' };
  return `<span class="badge badge-${escapeHtml(status)}">${escapeHtml(labels[status] || status)}</span>`;
}

function wordCardHtml(w) {
  const conjTable = w.conjugation ? conjugationTableHtml(w.conjugation) : '';
  const nounInfo = (w.wordType === 'noun' && (w.gender || w.plural))
    ? `<div style="margin-top:10px;font-size:14px;"><b>Geschlecht:</b> ${escapeHtml(w.gender || '—')} &nbsp; <b>Plural:</b> ${escapeHtml(w.plural || '—')}</div>`
    : '';

  return `
<div class="word-card" data-id="${escapeHtml(w.id)}">
  <div class="word-card-header">
    <span class="word-text">${escapeHtml(w.word)}</span>
    ${typeBadge(w.wordType || 'other')}
    <span class="de-preview">${escapeHtml(w.definitions?.de || '')}</span>
    ${statusBadge(w.status)}
    <button class="btn-show-en" data-id="${escapeHtml(w.id)}">Zeige Englisch</button>
  </div>
  <div class="word-card-body" hidden>
    <div class="en-translation" hidden data-en-block="${escapeHtml(w.id)}">
      <b>Übersetzung:</b> ${escapeHtml(w.definitions?.en || '—')}
    </div>
    <div class="de-definition"><b>Definition:</b> ${escapeHtml(w.definitions?.de || '—')}</div>
    ${w.example ? `<div class="example-sentence"><b>Beispiel:</b> ${escapeHtml(w.example)}</div>` : ''}
    ${nounInfo}
    ${conjTable}
    <div class="notes-field">
      <label>Notizen</label>
      <textarea data-notes-id="${escapeHtml(w.id)}">${escapeHtml(w.notes || '')}</textarea>
    </div>
    <div class="status-selector">
      <label>Status:</label>
      <select data-status-id="${escapeHtml(w.id)}">
        <option value="new" ${w.status === 'new' ? 'selected' : ''}>Neu</option>
        <option value="learning" ${w.status === 'learning' ? 'selected' : ''}>Lernend</option>
        <option value="known" ${w.status === 'known' ? 'selected' : ''}>Gelernt</option>
      </select>
    </div>
  </div>
</div>`;
}

function conjugationTableHtml(conj) {
  return Object.entries(conj).map(([tense, data]) => {
    if (typeof data === 'string') {
      return `<div style="margin-top:10px;font-size:14px;"><b>${escapeHtml(tense)}:</b> ${escapeHtml(data)}</div>`;
    }
    const rows = Object.entries(data).map(([pronoun, form]) =>
      `<tr><td>${escapeHtml(pronoun)}</td><td><b>${escapeHtml(form)}</b></td></tr>`
    ).join('');
    return `<div style="margin-top:12px;"><b>${escapeHtml(tense)}</b><table class="conjugation-table">${rows}</table></div>`;
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

  // Show/hide English button
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

  // Auto-save notes on change
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

// Search filter
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  const filtered = allWords.filter(w => w.word.toLowerCase().includes(q));
  renderWordList(filtered);
});

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Flashcards ---
let flashQueue = [];
let flashIndex = 0;

export async function initFlashcards() {
  const words = await getAllWords();
  // Prioritise new and learning words; fall back to all words if none
  flashQueue = words.filter(w => w.status !== 'known');
  if (flashQueue.length === 0) flashQueue = [...words];
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

  // Reset English reveal state
  const enText = document.getElementById('flashcard-en-text');
  const showBtn = document.getElementById('btn-show-english');
  enText.hidden = true;
  enText.textContent = w.definitions?.en || '—';
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
    if (!w) return;
    const statusMap = { again: 'new', hard: 'learning', good: 'learning', easy: 'known' };
    try {
      await updateWord(w.id, { status: statusMap[rating] });
    } catch (err) {
      console.error('Vokabular: Fehler beim Aktualisieren', err);
    }
    flashIndex = (flashIndex + 1) % flashQueue.length;
    showFlashcard();
  });
});

// Initial load
await loadWords();

// Reload when a new word is saved from another tab
browser.storage.onChanged.addListener((changes) => {
  if (changes.vokabular_words) loadWords();
});

// --- Export ---
document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
  const words = await getAllWords();
  const csv = buildCsv(words);
  downloadFile(csv, 'vokabular-export.csv', 'text/csv;charset=utf-8;');
  const statusEl = document.getElementById('export-status');
  if (statusEl) statusEl.textContent = 'CSV heruntergeladen!';
});

document.getElementById('btn-export-json')?.addEventListener('click', async () => {
  const words = await getAllWords();
  try {
    await navigator.clipboard.writeText(JSON.stringify(words, null, 2));
    const statusEl = document.getElementById('export-status');
    if (statusEl) statusEl.textContent = 'JSON in Zwischenablage kopiert!';
  } catch (err) {
    console.error('Vokabular: Clipboard-Fehler', err);
  }
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
