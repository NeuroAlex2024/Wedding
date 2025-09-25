const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

const app = express();

const ROOT_DIR = __dirname;
const INVITES_DIR = path.join(ROOT_DIR, 'invites');

app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

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
  return value
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
  return slugify(value);
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
  const fallback = dateString.trim().toLowerCase().replace(/\s+/g, '-');
  return slugify(fallback);
}

function buildBaseSlug(invitation) {
  const parts = [];
  if (invitation.groom) {
    parts.push(slugify(invitation.groom));
  }
  if (invitation.bride) {
    parts.push(slugify(invitation.bride));
  }
  const datePart = formatDateForSlug(invitation.date);
  if (datePart) {
    parts.push(datePart);
  }
  const base = parts.filter(Boolean).join('-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
  return base || 'invite';
}

async function ensureInvitesDirectory() {
  await fsp.mkdir(INVITES_DIR, { recursive: true });
}

async function ensureUniqueSlug(preferredSlug, allowCurrent) {
  const base = preferredSlug && preferredSlug.trim().length ? preferredSlug : 'invite';
  let candidate = base;
  let suffix = 2;
  while (true) {
    const directory = path.join(INVITES_DIR, candidate);
    try {
      await fsp.access(directory, fs.constants.F_OK);
      if (allowCurrent && candidate === allowCurrent) {
        return candidate;
      }
    } catch (error) {
      return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateHuman(dateString) {
  if (!dateString) {
    return '';
  }
  const date = new Date(dateString);
  if (!Number.isNaN(date.getTime())) {
    try {
      const formatter = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      return formatter
        .format(date)
        .replace(/ г\.?$/, '')
        .toLowerCase();
    } catch (error) {
      return dateString;
    }
  }
  return dateString;
}

function formatTimeHuman(value) {
  if (!value) {
    return '';
  }
  const match = /^(\d{2}):(\d{2})/.exec(value.trim());
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  return value;
}

function buildTheme(theme) {
  const colors = theme && typeof theme === 'object' ? theme.colors || {} : {};
  return {
    id: theme?.id ?? 'default',
    name: theme?.name ?? '',
    description: theme?.description ?? '',
    tagline: theme?.tagline ?? 'Приглашение',
    colors: {
      background: colors.background ?? '#fff7f5',
      card: colors.card ?? 'rgba(255, 255, 255, 0.95)',
      accent: colors.accent ?? '#d87a8d',
      accentSoft: colors.accentSoft ?? 'rgba(216, 122, 141, 0.12)',
      text: colors.text ?? '#35233b',
      muted: colors.muted ?? '#7a5c6b',
      pattern: colors.pattern ?? 'none'
    },
    headingFont: theme?.headingFont ?? "'Playfair Display', 'Times New Roman', serif",
    bodyFont: theme?.bodyFont ?? "'Montserrat', 'Segoe UI', sans-serif",
    fontLink: theme?.fontLink ?? ''
  };
}

function renderInvitationHtml(data) {
  const theme = buildTheme(data.theme);
  const invitation = data.invitation;
  const groom = invitation.groom || 'Жених';
  const bride = invitation.bride || 'Невеста';
  const title = `${groom} и ${bride} — приглашение`;
  const tagline = theme.tagline && theme.tagline.trim().length ? theme.tagline.trim() : 'Приглашение';
  const dateFormatted = formatDateHuman(invitation.date);
  const timeFormatted = formatTimeHuman(invitation.time);
  const dateParts = [dateFormatted, timeFormatted].filter(Boolean);
  const dateLine = dateParts.join(' · ') || 'Дата уточняется';
  const venueName = invitation.venueName || 'Место проведения';
  const venueAddress = invitation.venueAddress || 'Адрес уточняется';
  const giftCard = invitation.giftCard || '';
  const giftSection = giftCard
    ? `<section class="invitation__gift">
        <h3>Для подарков</h3>
        <p>${escapeHtml(giftCard).replace(/\n/g, '<br>')}</p>
      </section>`
    : '';
  const fontLinkTag = theme.fontLink
    ? `<link rel="stylesheet" href="${escapeHtml(theme.fontLink)}">`
    : '';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="Персональное свадебное приглашение">
  ${fontLinkTag}
  <style>
    :root {
      --bg: ${escapeHtml(theme.colors.background)};
      --card: ${escapeHtml(theme.colors.card)};
      --accent: ${escapeHtml(theme.colors.accent)};
      --accent-soft: ${escapeHtml(theme.colors.accentSoft)};
      --text: ${escapeHtml(theme.colors.text)};
      --muted: ${escapeHtml(theme.colors.muted)};
      --pattern: ${escapeHtml(theme.colors.pattern)};
      --heading-font: ${escapeHtml(theme.headingFont)};
      --body-font: ${escapeHtml(theme.bodyFont)};
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      background: var(--bg);
      color: var(--text);
      font-family: var(--body-font);
    }

    main.invitation {
      position: relative;
      width: min(720px, 100%);
      padding: clamp(2rem, 5vw, 3.5rem);
      background: var(--card);
      border-radius: 32px;
      box-shadow: 0 30px 60px rgba(32, 27, 51, 0.16);
      overflow: hidden;
    }

    main.invitation::before {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--pattern);
      opacity: 1;
      pointer-events: none;
    }

    .invitation__content {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 1.5rem;
      text-align: center;
    }

    h1 {
      margin: 0;
      font-family: var(--heading-font);
      font-weight: 600;
      font-size: clamp(2.2rem, 6vw, 3.4rem);
    }

    .invitation__eyebrow {
      font-size: 0.95rem;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--accent);
    }

    .invitation__date {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text);
    }

    .invitation__venue {
      background: var(--accent-soft);
      border-radius: 20px;
      padding: 1.5rem;
      display: grid;
      gap: 0.5rem;
    }

    .invitation__venue strong {
      font-size: 1.1rem;
      color: var(--text);
    }

    .invitation__gift {
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      padding-top: 1.5rem;
      margin-top: 0.5rem;
    }

    footer {
      margin-top: 1.5rem;
      font-size: 0.95rem;
      color: var(--muted);
    }

    @media (max-width: 640px) {
      body {
        padding: 2.5rem 1rem;
      }

      main.invitation {
        border-radius: 24px;
        padding: clamp(2rem, 7vw, 2.75rem);
      }
    }

    @media print {
      body {
        padding: 0;
        background: var(--bg);
      }

      main.invitation {
        box-shadow: none;
        border-radius: 0;
        width: 100%;
        min-height: 100vh;
      }
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }
  </style>
</head>
<body>
  <main class="invitation">
    <div class="invitation__content">
      <p class="invitation__eyebrow">${escapeHtml(tagline)}</p>
      <h1>${escapeHtml(`${groom} и ${bride}`)}</h1>
      <p class="invitation__date">${escapeHtml(dateLine)}</p>
      <div class="invitation__venue">
        <strong>${escapeHtml(venueName)}</strong>
        <p>${escapeHtml(venueAddress).replace(/\n/g, '<br>')}</p>
      </div>
      ${giftSection}
      <footer>
        <p>Мы будем рады видеть вас в этот особенный день.</p>
      </footer>
    </div>
  </main>
</body>
</html>`;
}

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

async function saveInvitation(slug, html) {
  const directory = path.join(INVITES_DIR, slug);
  await fsp.mkdir(directory, { recursive: true });
  const filePath = path.join(directory, 'index.html');
  await fsp.writeFile(filePath, html, 'utf8');
}

app.post('/api/invitations', async (req, res) => {
  const validation = validatePayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }
  const { invitation, theme, requestedSlug } = validation.data;
  const baseSlug = buildBaseSlug(invitation);
  const preferredSlug = requestedSlug || baseSlug;
  const allowCurrent = requestedSlug || null;
  try {
    await ensureInvitesDirectory();
    const slug = await ensureUniqueSlug(preferredSlug, allowCurrent);
    const html = renderInvitationHtml({ invitation, theme });
    await saveInvitation(slug, html);
    const url = new URL(`/invite/${slug}`, `${req.protocol}://${req.get('host')}`).toString();
    return res.status(201).json({ slug, url });
  } catch (error) {
    console.error('Не удалось сохранить приглашение', error);
    return res.status(500).json({ error: 'Не удалось сохранить приглашение. Попробуйте позже.' });
  }
});

function isSafeSlug(value) {
  return /^[a-z0-9-]+$/.test(value);
}

app.get('/invite/:slug', async (req, res) => {
  const rawSlug = req.params.slug || '';
  const slug = sanitizeSlug(rawSlug);
  if (!slug || !isSafeSlug(slug)) {
    return res.status(404).send('Приглашение не найдено.');
  }
  const filePath = path.join(INVITES_DIR, slug, 'index.html');
  try {
    await fsp.access(filePath, fs.constants.F_OK);
    return res.sendFile(filePath);
  } catch (error) {
    return res.status(404).send('Приглашение не найдено.');
  }
});

app.use(express.static(ROOT_DIR, { extensions: ['html'] }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Не удалось разобрать данные запроса.' });
  }
  return next(err);
});

app.use((err, req, res, next) => {
  console.error('Непредвиденная ошибка сервера', err);
  res.status(500).json({ error: 'Произошла непредвиденная ошибка.' });
});

async function start() {
  try {
    await ensureInvitesDirectory();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Wedding server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Не удалось инициализировать сервер', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
