const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const { renderInvitationHtml } = require('./renderInvitation');
const { buildBaseSlug, ensureUniqueSlug } = require('./slug');
const { validatePayload } = require('./validation');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const INVITES_DIR = path.join(ROOT_DIR, 'invites');

async function ensureInvitesDir() {
  try {
    await fs.mkdir(INVITES_DIR, { recursive: true });
  } catch (error) {
    console.error('Не удалось подготовить директорию приглашений', error);
    throw error;
  }
}

async function saveInvitation(data) {
  const baseSlug = buildBaseSlug(data.invitation);
  const slug = await ensureUniqueSlug(baseSlug, INVITES_DIR, data.slug);
  const invitationHtml = renderInvitationHtml({ invitation: data.invitation, theme: data.theme });
  const targetDir = path.join(INVITES_DIR, slug);
  const filePath = path.join(targetDir, 'index.html');
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(filePath, invitationHtml, 'utf8');
  return { slug, filePath };
}

async function createServer() {
  await ensureInvitesDir();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/invitations', async (req, res) => {
    const { data, errors } = validatePayload(req.body);
    if (errors.length) {
      console.warn('Валидация приглашения завершилась ошибкой', errors);
      return res.status(400).json({
        message: errors[0] || 'Не удалось опубликовать приглашение.',
        errors
      });
    }

    try {
      const { slug } = await saveInvitation(data);
      const origin = `${req.protocol}://${req.get('host')}`;
      const url = `${origin}/invite/${slug}`;
      console.info(`Приглашение опубликовано: ${slug}`);
      return res.status(201).json({ slug, url });
    } catch (error) {
      console.error('Ошибка при сохранении приглашения', error);
      return res.status(500).json({
        message: 'Не удалось сохранить приглашение. Попробуйте позже.'
      });
    }
  });

  app.use('/invite', express.static(INVITES_DIR, { index: 'index.html' }));
  app.use('/invite', (req, res) => {
    res.status(404).send('Приглашение не найдено.');
  });

  app.use(express.static(PUBLIC_DIR));

  app.use((req, res) => {
    res.status(404).send('Страница не найдена.');
  });

  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  app.listen(port, host, () => {
    console.log(`Сервер запущен и слушает на http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
  });
}

if (require.main === module) {
  createServer().catch((error) => {
    console.error('Не удалось запустить сервер', error);
    process.exit(1);
  });
}

module.exports = { createServer };
