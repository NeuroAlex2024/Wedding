const test = require('node:test');
const assert = require('node:assert/strict');

const { validatePayload } = require('../../src/server/utils/validation');

const basePayload = {
  invitation: {
    groom: 'Иван',
    bride: 'Мария',
    date: '2024-06-01',
    time: '16:00',
    venueName: 'Загородный клуб',
    venueAddress: 'Москва, ул. Пример'
  },
  theme: {
    id: 'default'
  }
};

test('validatePayload returns data when payload correct', () => {
  const validation = validatePayload(basePayload);
  assert.ok(!validation.error);
  assert.equal(validation.data.invitation.groom, 'Иван');
  assert.equal(validation.data.theme.id.length > 0, true);
});

test('validatePayload returns error when required fields missing', () => {
  const validation = validatePayload({ invitation: {} });
  assert.ok(validation.error);
});
