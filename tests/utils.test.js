import { normalizeWord, generateId } from '../src/utils.js';

test('normalizeWord trims and lowercases', () => {
  expect(normalizeWord('  Hund  ')).toBe('hund');
  expect(normalizeWord('LERNEN')).toBe('lernen');
  expect(normalizeWord('fahren')).toBe('fahren');
});

test('normalizeWord handles empty string', () => {
  expect(normalizeWord('')).toBe('');
});

test('generateId returns a non-empty string', () => {
  const id = generateId();
  expect(typeof id).toBe('string');
  expect(id.length).toBeGreaterThan(0);
});

test('generateId returns unique ids', () => {
  const ids = new Set(Array.from({ length: 100 }, () => generateId()));
  expect(ids.size).toBe(100);
});
