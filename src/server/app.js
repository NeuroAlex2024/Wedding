const express = require('express');
const morgan = require('morgan');
const path = require('path');

const invitationsRouter = require('./routes/invitations');
const { sanitizeSlug, isSafeSlug } = require('./utils/slug');

const app = express();

const ROOT_DIR = path.join(__dirname, '..', '..');
const CLIENT_DIR = path.join(__dirname, '..', 'client');
const SHARED_DIR = path.join(__dirname, '..', 'shared');
const ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets');

app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use('/shared', express.static(SHARED_DIR));

app.use('/api/invitations', invitationsRouter.apiRouter);
app.use('/invite', invitationsRouter.publicRouter);

app.use('/assets', express.static(ASSETS_DIR));

app.get('/invitation.html', (req, res) => {
  const slugParam = req.query.slug || req.query.id || '';
  const slug = sanitizeSlug(slugParam);

  if (slug && isSafeSlug(slug)) {
    const target = `/invite/${encodeURIComponent(slug)}`;
    return res.redirect(301, target);
  }

  return res.status(400).send('Ссылка приглашения изменилась. Используйте /invite/<slug>.');
});

app.use(express.static(CLIENT_DIR, { extensions: ['html'] }));

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

module.exports = app;
