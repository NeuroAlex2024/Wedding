import { CONTRACTOR_MARKETPLACE, DASHBOARD_NAV_ITEMS, DASHBOARD_TOOL_ITEMS } from '../../state/constants';
import type { AppContext } from '../../types';

function renderProfileSummary(root: HTMLElement, profileName: string) {
  const element = document.createElement('section');
  element.className = 'card dashboard__summary';
  element.innerHTML = `
    <header>
      <h1>Панель планирования</h1>
      <p>${profileName ? `С возвращением, ${profileName}!` : 'Пройдите анкету, чтобы персонализировать рекомендации.'}</p>
    </header>
  `;
  root.appendChild(element);
}

function renderNavigation(root: HTMLElement) {
  const nav = document.createElement('nav');
  nav.className = 'card dashboard__navigation';
  nav.innerHTML = `
    <h2>Разделы</h2>
    <ul>
      ${DASHBOARD_NAV_ITEMS.map((item) => `<li><a href="#${item.id}">${item.title}</a></li>`).join('')}
    </ul>
  `;
  root.appendChild(nav);
}

function renderTools(root: HTMLElement) {
  const section = document.createElement('section');
  section.className = 'card dashboard__tools';
  section.innerHTML = `
    <h2>Инструменты</h2>
    <div class="tool-grid">
      ${DASHBOARD_TOOL_ITEMS.map((tool) => `
        <article class="tool">
          <h3>${tool.title}</h3>
          <p>${tool.description}</p>
          <button type="button" data-tool="${tool.id}">Открыть</button>
        </article>
      `).join('')}
    </div>
  `;
  root.appendChild(section);
}

function renderMarketplace(root: HTMLElement) {
  const section = document.createElement('section');
  section.className = 'card dashboard__marketplace';
  section.innerHTML = `
    <h2>Подрядчики</h2>
    ${CONTRACTOR_MARKETPLACE.map((category) => `
      <div class="marketplace__category">
        <h3>${category.title}</h3>
        <div class="marketplace__grid">
          ${category.contractors.map((contractor) => `
            <article class="contractor">
              <img src="${contractor.image}" alt="${contractor.name}" loading="lazy" />
              <h4>${contractor.name}</h4>
              <p>${contractor.tagline}</p>
              <dl>
                <div><dt>Цена</dt><dd>${contractor.price.toLocaleString('ru-RU')} ₽</dd></div>
                <div><dt>Рейтинг</dt><dd>${contractor.rating.toFixed(1)} (${contractor.reviews})</dd></div>
                <div><dt>Город</dt><dd>${contractor.location}</dd></div>
              </dl>
              <a class="call-to-action" href="tel:${contractor.phone.replace(/[^+\d]/g, '')}">Связаться</a>
            </article>
          `).join('')}
        </div>
      </div>
    `).join('')}
  `;
  root.appendChild(section);
}

export function renderDashboard(context: AppContext) {
  const { root, store } = context;
  const profile = store.getState();
  const profileName = [profile.brideName, profile.groomName].filter(Boolean).join(' & ');

  root.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'dashboard-layout';
  root.appendChild(container);

  renderProfileSummary(container, profileName);
  renderNavigation(container);
  renderTools(container);
  renderMarketplace(container);
}
