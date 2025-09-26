const test = require('node:test');
const assert = require('node:assert/strict');

const { buildTheme, DEFAULT_THEME_ID } = require('../../src/shared/themeUtils');

test('buildTheme merges provided colors with base theme palette', () => {
  const theme = buildTheme({
    id: 'emerald',
    colors: {
      background: '#123456'
    }
  });

  assert.equal(theme.id, 'emerald');
  assert.equal(theme.colors.background, '#123456');
  assert.equal(theme.colors.card, 'rgba(255, 255, 255, 0.9)');
  assert.equal(theme.colors.accent, '#3b8763');
});

test('buildTheme falls back to configured default theme', () => {
  const theme = buildTheme();
  const defaultTheme = buildTheme({ id: DEFAULT_THEME_ID });

  assert.equal(theme.id, DEFAULT_THEME_ID);
  assert.equal(theme.tagline, defaultTheme.tagline);
  assert.equal(theme.colors.background, defaultTheme.colors.background);
});
