const app = require('./app');
const { ensureInvitesDirectory } = require('./services/invitationService');

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
