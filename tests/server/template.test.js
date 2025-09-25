const test = require('node:test');
const assert = require('node:assert/strict');

const { renderInvitationHtml, buildTheme } = require('../../src/server/templates/invitationTemplate');

test('buildTheme falls back to defaults when values missing', () => {
  const theme = buildTheme({});
  assert.ok(theme.colors.background);
  assert.ok(theme.headingFont);
});

test('renderInvitationHtml injects invitation data', () => {
  const html = renderInvitationHtml({
    invitation: {
      groom: 'Иван',
      bride: 'Мария',
      date: '2024-06-01',
      time: '16:00',
      venueName: 'Загородный клуб',
      venueAddress: 'Москва, ул. Пример',
      giftCard: 'Подарки на ваше усмотрение'
    },
    theme: buildTheme({ tagline: 'День свадьбы' })
  });

  assert.ok(html.includes('Иван и Мария'));
  assert.ok(html.includes('День свадьбы'));
  assert.ok(html.includes('Загородный клуб'));
});
