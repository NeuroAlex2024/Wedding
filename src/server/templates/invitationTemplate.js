const { buildTheme } = require('../../shared/themeUtils');

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

function renderInvitationHtml(data) {
  const theme = buildTheme(data.theme);
  const invitation = data.invitation || {};
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

module.exports = {
  buildTheme,
  escapeHtml,
  formatDateHuman,
  formatTimeHuman,
  renderInvitationHtml
};
