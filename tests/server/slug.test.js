const test = require('node:test');
const assert = require('node:assert/strict');

const {
  transliterate,
  slugify,
  sanitizeSlug,
  toPascalFrom,
  formatDateForSlug,
  buildBaseSlug
} = require('../../src/server/utils/slug');

test('transliterate converts Cyrillic characters to Latin equivalents', () => {
  assert.equal(transliterate('Свадьба'), 'svadba');
});

test('slugify trims and normalises a string', () => {
  assert.equal(slugify(' Иван & Мария '), 'ivan-mariya');
});

test('sanitizeSlug keeps allowed characters only', () => {
  assert.equal(sanitizeSlug(' Hello World! '), 'Hello-World');
});

test('toPascalFrom builds PascalCase tokens', () => {
  assert.equal(toPascalFrom('иван и мария'), 'IvanIMariya');
});

test('formatDateForSlug returns formatted date tokens', () => {
  assert.equal(formatDateForSlug('2024-06-01'), '01-06-24');
});

test('buildBaseSlug combines invitation data into slug', () => {
  const invitation = {
    groom: 'Иван',
    bride: 'Мария',
    date: '2024-06-01'
  };
  assert.equal(buildBaseSlug(invitation), 'IvanMariya-01-06-24');
});
