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
  const defText = section.definitions?.[0]?.definition || '';
  if (/\bder\b/i.test(defText) || /masculine/i.test(defText)) return 'der';
  if (/\bdie\b/i.test(defText) || /feminine/i.test(defText)) return 'die';
  if (/\bdas\b/i.test(defText) || /neuter/i.test(defText)) return 'das';
  return null;
}

export function extractPlural(section) {
  // Wiktionary REST /definition endpoint doesn't reliably expose plural
  return null;
}

export function extractConjugation(section) {
  // Wiktionary REST /definition endpoint doesn't reliably expose conjugation tables
  return null;
}

export function parseMyMemoryResponse(data) {
  if (!data || data.responseStatus !== 200) return '';
  return data.responseData?.translatedText || '';
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').trim();
}

// --- Network calls (used in extension, not in unit tests) ---

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
