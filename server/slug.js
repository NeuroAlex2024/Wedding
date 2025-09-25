const fs = require('fs/promises');
const path = require('path');

const TRANSLIT_MAP = new Map([
  ['а', 'a'],
  ['б', 'b'],
  ['в', 'v'],
  ['г', 'g'],
  ['д', 'd'],
  ['е', 'e'],
  ['ё', 'e'],
  ['ж', 'zh'],
  ['з', 'z'],
  ['и', 'i'],
  ['й', 'y'],
  ['к', 'k'],
  ['л', 'l'],
  ['м', 'm'],
  ['н', 'n'],
  ['о', 'o'],
  ['п', 'p'],
  ['р', 'r'],
  ['с', 's'],
  ['т', 't'],
  ['у', 'u'],
  ['ф', 'f'],
  ['х', 'h'],
  ['ц', 'ts'],
  ['ч', 'ch'],
  ['ш', 'sh'],
  ['щ', 'sch'],
  ['ъ', ''],
  ['ы', 'y'],
  ['ь', ''],
  ['э', 'e'],
  ['ю', 'yu'],
  ['я', 'ya']
]);

function transliterate(value) {
  return String(value ?? '')
    .toLowerCase()
    .split('')
    .map((char) => {
      if (/[a-z0-9]/.test(char)) {
        return char;
      }
      if (TRANSLIT_MAP.has(char)) {
        return TRANSLIT_MAP.get(char);
      }
      return '-';
    })
    .join('');
}

function sanitizeSlug(value) {
  return transliterate(value)
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function formatDateForSlug(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return sanitizeSlug(value).replace(/-/g, '');
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function buildBaseSlug(invitation) {
  const groom = invitation?.groom || '';
  const bride = invitation?.bride || '';
  const dateSlug = formatDateForSlug(invitation?.date);
  const names = sanitizeSlug(`${groom}${bride}`.replace(/\s+/g, ''));
  const parts = [names || 'invitation'];
  if (dateSlug) {
    parts.push(dateSlug);
  }
  return parts.filter(Boolean).join('-');
}

async function ensureUniqueSlug(baseSlug, invitesDir, preferredSlug) {
  const sanitizedPreferred = sanitizeSlug(preferredSlug || '');
  if (sanitizedPreferred) {
    return sanitizedPreferred;
  }
  const sanitizedBase = sanitizeSlug(baseSlug) || 'invitation';
  let candidate = sanitizedBase;
  let suffix = 2;
  while (true) {
    const candidatePath = path.join(invitesDir, candidate);
    try {
      await fs.access(candidatePath);
      candidate = `${sanitizedBase}-${suffix}`;
      suffix += 1;
    } catch (error) {
      return candidate;
    }
  }
}

module.exports = {
  buildBaseSlug,
  ensureUniqueSlug,
  sanitizeSlug
};
