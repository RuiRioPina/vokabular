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

// Fixture for "Hund" (noun)
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
