export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function normalizeWord(word) {
  return word.trim().toLowerCase();
}
