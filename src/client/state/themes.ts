export interface WebsiteThemeColors {
  background?: string;
  card?: string;
  accent?: string;
  accentSoft?: string;
  text?: string;
  muted?: string;
  pattern?: string;
}

export interface WebsiteTheme {
  id: string;
  name: string;
  description?: string;
  tagline?: string;
  colors?: WebsiteThemeColors;
  headingFont?: string;
  bodyFont?: string;
  fontLink?: string;
}

interface ThemesResponse {
  themes?: unknown;
  defaults?: unknown;
  defaultThemeId?: unknown;
}

const FALLBACK_DEFAULTS: WebsiteTheme = {
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
    pattern: 'none',
  },
  headingFont: "'Playfair Display', 'Times New Roman', serif",
  bodyFont: "'Montserrat', 'Segoe UI', sans-serif",
  fontLink: '',
};

function cloneTheme(theme: WebsiteTheme): WebsiteTheme {
  return {
    ...theme,
    colors: theme.colors ? { ...theme.colors } : undefined,
  };
}

let themesCache: WebsiteTheme[] = [];
const themesById = new Map<string, WebsiteTheme>();
let defaults: WebsiteTheme = cloneTheme(FALLBACK_DEFAULTS);
let defaultThemeId: string | null = FALLBACK_DEFAULTS.id;
let loadPromise: Promise<void> | null = null;

function normalizeColors(raw: unknown): WebsiteThemeColors | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const input = raw as Record<string, unknown>;
  const result: WebsiteThemeColors = {};
  const colorKeys: (keyof WebsiteThemeColors)[] = ['background', 'card', 'accent', 'accentSoft', 'text', 'muted', 'pattern'];

  colorKeys.forEach((key) => {
    const value = input[key as string];
    if (typeof value === 'string') {
      result[key] = value;
    }
  });

  return Object.keys(result).length > 0 ? result : undefined;
}

function toDefaultsPatch(raw: unknown): Partial<WebsiteTheme> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const input = raw as Record<string, unknown>;
  const patch: Partial<WebsiteTheme> = {};

  if (typeof input.id === 'string' && input.id.trim().length > 0) {
    patch.id = input.id.trim();
  }
  if (typeof input.name === 'string') {
    patch.name = input.name;
  }
  if (typeof input.description === 'string') {
    patch.description = input.description;
  }
  if (typeof input.tagline === 'string') {
    patch.tagline = input.tagline;
  }
  if (typeof input.headingFont === 'string') {
    patch.headingFont = input.headingFont;
  }
  if (typeof input.bodyFont === 'string') {
    patch.bodyFont = input.bodyFont;
  }
  if (typeof input.fontLink === 'string') {
    patch.fontLink = input.fontLink;
  }

  const colors = normalizeColors(input.colors);
  if (colors) {
    patch.colors = colors;
  }

  return patch;
}

function toThemePatch(raw: unknown): Partial<WebsiteTheme> | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const input = raw as Record<string, unknown>;
  const id = typeof input.id === 'string' && input.id.trim().length > 0 ? input.id.trim() : null;
  if (!id) {
    return null;
  }

  const patch: Partial<WebsiteTheme> = { id };

  if (typeof input.name === 'string') {
    patch.name = input.name;
  }
  if (typeof input.description === 'string') {
    patch.description = input.description;
  }
  if (typeof input.tagline === 'string') {
    patch.tagline = input.tagline;
  }
  if (typeof input.headingFont === 'string') {
    patch.headingFont = input.headingFont;
  }
  if (typeof input.bodyFont === 'string') {
    patch.bodyFont = input.bodyFont;
  }
  if (typeof input.fontLink === 'string') {
    patch.fontLink = input.fontLink;
  }

  const colors = normalizeColors(input.colors);
  if (colors) {
    patch.colors = colors;
  }

  return patch;
}

function mergeColors(base: WebsiteThemeColors | undefined, patch: WebsiteThemeColors | undefined): WebsiteThemeColors {
  const result: WebsiteThemeColors = { ...(base ?? {}) };
  if (!patch) {
    return result;
  }

  const colorKeys: (keyof WebsiteThemeColors)[] = ['background', 'card', 'accent', 'accentSoft', 'text', 'muted', 'pattern'];
  colorKeys.forEach((key) => {
    const value = patch[key];
    if (typeof value === 'string') {
      result[key] = value;
    }
  });

  return result;
}

function mergeTheme(base: WebsiteTheme, patch: Partial<WebsiteTheme> | undefined): WebsiteTheme {
  return {
    id: patch?.id ?? base.id,
    name: patch?.name ?? base.name,
    description: patch?.description ?? base.description,
    tagline: patch?.tagline ?? base.tagline,
    colors: mergeColors(base.colors, patch?.colors),
    headingFont: patch?.headingFont ?? base.headingFont,
    bodyFont: patch?.bodyFont ?? base.bodyFont,
    fontLink: patch?.fontLink ?? base.fontLink,
  };
}

function applyThemesResponse(data: ThemesResponse | null | undefined) {
  defaults = mergeTheme(FALLBACK_DEFAULTS, toDefaultsPatch(data?.defaults));

  const items: WebsiteTheme[] = [];
  if (Array.isArray(data?.themes)) {
    for (const rawTheme of data.themes as unknown[]) {
      const patch = toThemePatch(rawTheme);
      if (!patch?.id) {
        continue;
      }
      const merged = mergeTheme(defaults, patch);
      merged.id = patch.id;
      items.push(merged);
    }
  }

  themesCache = items;
  themesById.clear();
  items.forEach((theme) => {
    themesById.set(theme.id, theme);
  });

  const providedDefaultId = typeof data?.defaultThemeId === 'string' && data.defaultThemeId.trim().length > 0
    ? data.defaultThemeId.trim()
    : null;
  const fallbackId = items[0]?.id ?? defaults.id ?? FALLBACK_DEFAULTS.id;
  defaultThemeId = providedDefaultId ?? fallbackId ?? null;
}

export async function loadThemes(): Promise<WebsiteTheme[]> {
  if (themesCache.length > 0) {
    return themesCache.map(cloneTheme);
  }

  if (!loadPromise) {
    loadPromise = fetch('/shared/themes.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load themes: ${response.status} ${response.statusText}`);
        }
        return response.json() as Promise<ThemesResponse>;
      })
      .then((data) => {
        applyThemesResponse(data);
      })
      .catch((error) => {
        console.warn('Не удалось загрузить темы сайта', error);
        applyThemesResponse(null);
      });
  }

  await loadPromise;
  return themesCache.map(cloneTheme);
}

export function getThemeById(themeId: string | null | undefined): WebsiteTheme {
  const normalizedId = typeof themeId === 'string' && themeId.trim().length > 0 ? themeId.trim() : null;
  if (normalizedId && themesById.has(normalizedId)) {
    return cloneTheme(themesById.get(normalizedId)!);
  }

  if (defaultThemeId && themesById.has(defaultThemeId)) {
    return cloneTheme(themesById.get(defaultThemeId)!);
  }

  if (themesCache[0]) {
    return cloneTheme(themesCache[0]);
  }

  return cloneTheme(defaults);
}

export function getThemesSnapshot(): WebsiteTheme[] {
  return themesCache.map(cloneTheme);
}
