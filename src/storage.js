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
