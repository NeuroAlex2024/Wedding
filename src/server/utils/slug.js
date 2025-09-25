const transliterationMap = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya'
};

function transliterate(value) {
  return String(value ?? '')
    .toLowerCase()
    .split('')
    .map((char) => transliterationMap[char] ?? char)
    .join('');
}

function slugify(value) {
  if (!value) {
    return '';
  }
  const transliterated = transliterate(value);
  return transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function sanitizeSlug(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }
  return String(value)
    .replace(/[^A-Za-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function toPascalFrom(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }
  const base = transliterate(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join('');
  return base;
}

function formatDateForSlug(dateString) {
  if (!dateString) {
    return '';
  }
  const date = new Date(dateString);
  if (!Number.isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  }
  const fallback = String(dateString).trim().toLowerCase().replace(/\s+/g, '-');
  return slugify(fallback);
}

function buildBaseSlug(invitation) {
  const source = invitation && typeof invitation === 'object' ? invitation : {};
  const groomPart = toPascalFrom(source.groom || '');
  const bridePart = toPascalFrom(source.bride || '');
  const namesPart = `${groomPart}${bridePart}`.trim();
  const datePart = formatDateForSlug(source.date);
  const baseNames = namesPart || 'Invite';
  const base = datePart ? `${baseNames}-${datePart}` : baseNames;
  return base.replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
}

function isSafeSlug(value) {
  return /^[A-Za-z0-9-]+$/.test(value);
}

module.exports = {
  transliterate,
  slugify,
  sanitizeSlug,
  toPascalFrom,
  formatDateForSlug,
  buildBaseSlug,
  isSafeSlug
};
