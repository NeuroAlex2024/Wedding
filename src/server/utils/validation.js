const { sanitizeSlug } = require('./slug');
const { buildTheme } = require('../templates/invitationTemplate');

function sanitizeInvitation(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const fields = ['groom', 'bride', 'date', 'time', 'venueName', 'venueAddress', 'giftCard'];
  const invitation = {};
  fields.forEach((field) => {
    const value = source[field];
    invitation[field] = typeof value === 'string' ? value.trim() : '';
  });
  return invitation;
}

function validatePayload(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'Пустой запрос. Обновите страницу и попробуйте снова.' };
  }

  const invitation = sanitizeInvitation(body.invitation);
  const requiredFields = ['groom', 'bride', 'date', 'time', 'venueName', 'venueAddress'];
  const missing = requiredFields.filter((field) => !invitation[field]);
  if (missing.length) {
    return {
      error: `Заполните обязательные поля: ${missing.join(', ')}.`
    };
  }

  const theme = buildTheme(body.theme || {});
  const requestedSlug = sanitizeSlug(
    body.slug || body.publicSlug || body.publicId || body?.invitation?.publicSlug || body?.invitation?.publicId
  );

  return { data: { invitation, theme, requestedSlug } };
}

module.exports = {
  sanitizeInvitation,
  validatePayload
};
