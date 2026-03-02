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
