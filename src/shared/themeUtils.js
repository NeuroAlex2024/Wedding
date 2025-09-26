const path = require('path');

const themesDataPath = path.join(__dirname, 'themes.json');
const themesData = require(themesDataPath);

const WEBSITE_THEMES = Array.isArray(themesData?.themes) ? themesData.themes : [];
const THEME_DEFAULTS = themesData?.defaults && typeof themesData.defaults === 'object'
  ? themesData.defaults
  : {
      id: 'default',
      name: '',
      description: '',
      tagline: 'Приглашение',
      colors: {
        background: '#fff7f5',
        card: 'rgba(255, 255, 255, 0.95)',
        accent: '#d87a8d',
        accentSoft: 'rgba(216, 122, 141, 0.12)',
        text: '#35233b',
        muted: '#7a5c6b',
        pattern: 'none'
      },
      headingFont: "'Playfair Display', 'Times New Roman', serif",
      bodyFont: "'Montserrat', 'Segoe UI', sans-serif",
      fontLink: ''
    };

const DEFAULT_THEME_ID = typeof themesData?.defaultThemeId === 'string' && themesData.defaultThemeId.trim()
  ? themesData.defaultThemeId.trim()
  : (Array.isArray(WEBSITE_THEMES) && WEBSITE_THEMES.length
      ? WEBSITE_THEMES[0].id
      : THEME_DEFAULTS.id || 'default');

function buildTheme(theme) {
  const isObject = theme && typeof theme === 'object';
  const colors = isObject ? theme.colors || {} : {};
  const requestedId = isObject && typeof theme.id === 'string' && theme.id.trim().length
    ? theme.id.trim()
    : undefined;
  const lookupId = requestedId && Array.isArray(WEBSITE_THEMES)
    ? WEBSITE_THEMES.find((item) => item && item.id === requestedId)?.id
    : undefined;
  const baseThemeId = lookupId || DEFAULT_THEME_ID;
  const baseTheme = Array.isArray(WEBSITE_THEMES)
    ? WEBSITE_THEMES.find((item) => item && item.id === baseThemeId)
    : null;
  const defaultColors = THEME_DEFAULTS?.colors && typeof THEME_DEFAULTS.colors === 'object'
    ? THEME_DEFAULTS.colors
    : {};
  const baseColors = baseTheme?.colors && typeof baseTheme.colors === 'object' ? baseTheme.colors : {};

  return {
    id: requestedId ?? baseTheme?.id ?? DEFAULT_THEME_ID,
    name: theme?.name ?? baseTheme?.name ?? THEME_DEFAULTS?.name ?? '',
    description: theme?.description ?? baseTheme?.description ?? THEME_DEFAULTS?.description ?? '',
    tagline: theme?.tagline ?? baseTheme?.tagline ?? THEME_DEFAULTS?.tagline ?? 'Приглашение',
    colors: {
      background: colors.background ?? baseColors.background ?? defaultColors.background ?? '#fff7f5',
      card: colors.card ?? baseColors.card ?? defaultColors.card ?? 'rgba(255, 255, 255, 0.95)',
      accent: colors.accent ?? baseColors.accent ?? defaultColors.accent ?? '#d87a8d',
      accentSoft: colors.accentSoft ?? baseColors.accentSoft ?? defaultColors.accentSoft ?? 'rgba(216, 122, 141, 0.12)',
      text: colors.text ?? baseColors.text ?? defaultColors.text ?? '#35233b',
      muted: colors.muted ?? baseColors.muted ?? defaultColors.muted ?? '#7a5c6b',
      pattern: colors.pattern ?? baseColors.pattern ?? defaultColors.pattern ?? 'none'
    },
    headingFont: theme?.headingFont ?? baseTheme?.headingFont ?? THEME_DEFAULTS?.headingFont ?? "'Playfair Display', 'Times New Roman', serif",
    bodyFont: theme?.bodyFont ?? baseTheme?.bodyFont ?? THEME_DEFAULTS?.bodyFont ?? "'Montserrat', 'Segoe UI', sans-serif",
    fontLink: theme?.fontLink ?? baseTheme?.fontLink ?? THEME_DEFAULTS?.fontLink ?? ''
  };
}

module.exports = {
  buildTheme,
  WEBSITE_THEMES,
  THEME_DEFAULTS,
  DEFAULT_THEME_ID
};
