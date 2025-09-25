const express = require('express');

const invitationService = require('../services/invitationService');
const { validatePayload } = require('../utils/validation');
const { sanitizeSlug, isSafeSlug } = require('../utils/slug');

function extractRequestMeta(req) {
  return {
    protocol: req.protocol,
    host: req.get('host')
  };
}

const apiRouter = express.Router();

apiRouter.post('/', async (req, res) => {
  const validation = validatePayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const result = await invitationService.createInvitation(validation.data, extractRequestMeta(req));
    return res.status(201).json(result);
  } catch (error) {
    console.error('Не удалось сохранить приглашение', error);
    return res.status(500).json({ error: 'Не удалось сохранить приглашение. Попробуйте позже.' });
  }
});

apiRouter.get('/:slug', async (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  if (!slug || !isSafeSlug(slug)) {
    return res.status(404).json({ error: 'Приглашение не найдено.' });
  }

  try {
    const html = await invitationService.readInvitationHtml(slug);
    return res.json({ slug, html });
  } catch (error) {
    if (error.name === 'InvitationNotFoundError') {
      return res.status(404).json({ error: 'Приглашение не найдено.' });
    }
    console.error('Не удалось получить приглашение', error);
    return res.status(500).json({ error: 'Не удалось получить приглашение. Попробуйте позже.' });
  }
});

apiRouter.put('/:slug', async (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  if (!slug || !isSafeSlug(slug)) {
    return res.status(404).json({ error: 'Приглашение не найдено.' });
  }

  const validation = validatePayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const result = await invitationService.updateInvitation(slug, validation.data, extractRequestMeta(req));
    return res.json(result);
  } catch (error) {
    if (error.name === 'InvitationNotFoundError') {
      return res.status(404).json({ error: 'Приглашение не найдено.' });
    }
    console.error('Не удалось обновить приглашение', error);
    return res.status(500).json({ error: 'Не удалось обновить приглашение. Попробуйте позже.' });
  }
});

apiRouter.delete('/:slug', async (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  if (!slug || !isSafeSlug(slug)) {
    return res.status(404).json({ error: 'Приглашение не найдено.' });
  }

  try {
    await invitationService.deleteInvitation(slug);
    return res.status(204).end();
  } catch (error) {
    console.error('Не удалось удалить приглашение', error);
    return res.status(500).json({ error: 'Не удалось удалить приглашение. Попробуйте позже.' });
  }
});

const publicRouter = express.Router();

publicRouter.get('/:slug', async (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  if (!slug || !isSafeSlug(slug)) {
    return res.status(404).send('Приглашение не найдено.');
  }

  try {
    const html = await invitationService.readInvitationHtml(slug);
    return res.type('html').send(html);
  } catch (error) {
    return res.status(404).send('Приглашение не найдено.');
  }
});

module.exports = {
  apiRouter,
  publicRouter
};
