const DEFAULT_THEME = {
  tagline: "Приглашение",
  colors: {
    background: "#fff7f5",
    card: "rgba(255, 255, 255, 0.95)",
    accent: "#d87a8d",
    accentSoft: "rgba(216, 122, 141, 0.12)",
    text: "#35233b",
    muted: "#7a5c6b",
    pattern: "none"
  },
  headingFont: "'Playfair Display', 'Times New Roman', serif",
  bodyFont: "'Montserrat', 'Segoe UI', sans-serif",
  fontLink: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&family=Playfair+Display:wght@500;600&display=swap"
};

const monthFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  try {
    return monthFormatter.format(date);
  } catch (error) {
    return "";
  }
}

function formatTime(value) {
  if (!value) {
    return "";
  }
  const [hours, minutes] = String(value).split(":");
  if (hours && minutes) {
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  }
  return String(value);
}

function buildThemeVariables(theme) {
  const colors = theme.colors || {};
  return `:root {
  --bg: ${colors.background || DEFAULT_THEME.colors.background};
  --card: ${colors.card || DEFAULT_THEME.colors.card};
  --accent: ${colors.accent || DEFAULT_THEME.colors.accent};
  --accent-soft: ${colors.accentSoft || DEFAULT_THEME.colors.accentSoft};
  --text: ${colors.text || DEFAULT_THEME.colors.text};
  --muted: ${colors.muted || DEFAULT_THEME.colors.muted};
  --pattern: ${colors.pattern || DEFAULT_THEME.colors.pattern};
  --heading-font: ${theme.headingFont || DEFAULT_THEME.headingFont};
  --body-font: ${theme.bodyFont || DEFAULT_THEME.bodyFont};
}`;
}

function buildGiftBlock(giftCard) {
  if (!giftCard) {
    return "";
  }
  return `
      <div class="invitation__gift">
        <span>Для подарков</span>
        <strong>${escapeHtml(giftCard)}</strong>
      </div>`;
}

function renderInvitationHtml({ invitation, theme }) {
  const safeInvitation = invitation || {};
  const safeTheme = { ...DEFAULT_THEME, ...(theme || {}), colors: { ...DEFAULT_THEME.colors, ...(theme?.colors || {}) } };

  const groom = safeInvitation.groom?.trim() || "Жених";
  const bride = safeInvitation.bride?.trim() || "Невеста";
  const dateText = formatDate(safeInvitation.date);
  const timeText = formatTime(safeInvitation.time);
  const venueName = safeInvitation.venueName?.trim() || "Место проведения";
  const venueAddress = safeInvitation.venueAddress?.trim() || "Адрес уточняется";
  const giftCard = safeInvitation.giftCard?.trim() || "";

  const dateParts = [dateText, timeText].filter(Boolean);
  const dateLine = dateParts.join(" · ") || "Дата уточняется";
  const themeVariables = buildThemeVariables(safeTheme);
  const fontLink = safeTheme.fontLink ? `<link rel="stylesheet" href="${escapeHtml(safeTheme.fontLink)}">` : "";
  const title = `${escapeHtml(groom)} и ${escapeHtml(bride)} — приглашение`;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="Персональное свадебное приглашение">
  ${fontLink}
  <style>
${themeVariables}

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
  </style>
</head>
<body>
  <main class="invitation" role="main">
    <div class="invitation__content">
      <p class="invitation__eyebrow">${escapeHtml(safeTheme.tagline || DEFAULT_THEME.tagline)}</p>
      <p>Мы будем счастливы разделить этот день с вами.</p>
      <h1>${escapeHtml(groom)} и ${escapeHtml(bride)}</h1>
      <p class="invitation__date">${escapeHtml(dateLine)}</p>
      <div class="invitation__venue">
        <strong>${escapeHtml(venueName)}</strong>
        <span>${escapeHtml(venueAddress).replace(/\n/g, "<br>")}</span>
      </div>
      ${buildGiftBlock(giftCard)}
      <p>До встречи на празднике!</p>
    </div>
    <footer>Создано с помощью Bridebook Россия</footer>
  </main>
</body>
</html>`;
}

module.exports = { renderInvitationHtml };
