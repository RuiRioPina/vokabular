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

// Placeholder — filled in by Task 8
export async function initFlashcards() {}

// Initial load
await loadWords();

// Reload when a new word is saved from another tab
browser.storage.onChanged.addListener((changes) => {
  if (changes.vokabular_words) loadWords();
});
