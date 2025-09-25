const { sanitizeSlug } = require('./slug');

function normalizeString(value, { max = 200, fallback = '' } = {}) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.slice(0, max);
}

function validateInvitation(invitation) {
  const errors = [];
  const normalized = {};

  normalized.groom = normalizeString(invitation?.groom, { fallback: '' });
  normalized.bride = normalizeString(invitation?.bride, { fallback: '' });
  normalized.date = normalizeString(invitation?.date, { fallback: '' });
  normalized.time = normalizeString(invitation?.time, { fallback: '' });
  normalized.venueName = normalizeString(invitation?.venueName, { fallback: '' });
  normalized.venueAddress = normalizeString(invitation?.venueAddress, { fallback: '' , max: 400});
  normalized.giftCard = normalizeString(invitation?.giftCard, { fallback: '' , max: 120});
  normalized.theme = normalizeString(invitation?.theme, { fallback: '' , max: 60});
  normalized.publicId = normalizeString(invitation?.publicId, { fallback: '' , max: 200});

  if (!normalized.groom) {
    errors.push('Поле "Жених" обязательно.');
  }
  if (!normalized.bride) {
    errors.push('Поле "Невеста" обязательно.');
  }
  if (!normalized.date) {
    errors.push('Укажите дату свадьбы.');
  }
  if (!normalized.time) {
    errors.push('Укажите время церемонии.');
  }
  if (!normalized.venueName) {
    errors.push('Добавьте название площадки.');
  }
  if (!normalized.venueAddress) {
    errors.push('Добавьте адрес площадки.');
  }

  return { normalized, errors };
}

function validateTheme(theme) {
  const normalized = {
    id: normalizeString(theme?.id, { fallback: '' , max: 60}),
    name: normalizeString(theme?.name, { fallback: '', max: 120 }),
    description: normalizeString(theme?.description, { fallback: '', max: 240 }),
    tagline: normalizeString(theme?.tagline, { fallback: '' , max: 160}),
    colors: {},
    headingFont: normalizeString(theme?.headingFont, { fallback: '' , max: 160}),
    bodyFont: normalizeString(theme?.bodyFont, { fallback: '' , max: 160}),
    fontLink: normalizeString(theme?.fontLink, { fallback: '' , max: 500})
  };

  const colors = theme?.colors || {};
  ['background', 'card', 'accent', 'accentSoft', 'text', 'muted', 'pattern'].forEach((key) => {
    const value = normalizeString(colors[key], { fallback: '', max: 120 });
    if (value) {
      normalized.colors[key] = value;
    }
  });

  return normalized;
}

function validatePayload(body) {
  if (!body || typeof body !== 'object') {
    return { errors: ['Неверный формат данных.'] };
  }

  const { normalized: invitation, errors } = validateInvitation(body.invitation);
  const theme = validateTheme(body.theme || {});
  const providedSlug = body.slug || body.invitation?.publicId || '';
  const slug = sanitizeSlug(providedSlug);

  const invalidFields = [...errors];
  if (body.version && Number(body.version) !== 1) {
    invalidFields.push('Неподдерживаемая версия данных.');
  }

  if (invalidFields.length) {
    return { errors: invalidFields };
  }

  return {
    data: {
      invitation,
      theme,
      slug
    },
    errors: []
  };
}

module.exports = { validatePayload };
