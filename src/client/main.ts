import './styles/main.css';

import { renderDashboard } from './features/dashboard';
import { renderQuiz } from './features/quiz';
import { renderWebsite } from './features/website';
import { createRouter } from './router';
import { createProfileStore } from './state/profileStore';
import type { AppContext } from './types';

const root = document.getElementById('app');

if (!root) {
  throw new Error('Не удалось найти контейнер приложения #app');
}

const store = createProfileStore();
const context: AppContext = { root, store };

const router = createRouter({
  defaultRoute: '#/dashboard',
  routes: {
    '#/quiz': () => renderQuiz(context),
    '#/dashboard': () => renderDashboard(context),
    '#/website': () => {
      void renderWebsite(context);
    },
  },
});

router.start();

store.subscribe(() => {
  const hash = window.location.hash || '#/dashboard';
  if (hash === '#/dashboard') {
    renderDashboard(context);
  }
});
