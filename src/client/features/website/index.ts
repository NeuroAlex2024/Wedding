import type { AppContext } from '../../types';
import type { ProfileUpdate } from '../../state/profileStore';

interface Theme {
  id: string;
  name: string;
  description?: string;
  colors?: Record<string, string>;
  fontLink?: string;
}

interface ThemeResponse {
  themes: Theme[];
  defaultThemeId?: string;
}

let cachedThemes: Theme[] | null = null;
let themesPromise: Promise<Theme[]> | null = null;

async function loadThemes(): Promise<Theme[]> {
  if (cachedThemes) {
    return cachedThemes;
  }
  if (!themesPromise) {
    themesPromise = fetch('/shared/themes.json')
      .then((response) => response.json() as Promise<ThemeResponse>)
      .then((data) => {
        cachedThemes = data.themes ?? [];
        return cachedThemes;
      })
      .catch((error) => {
        console.warn('Не удалось загрузить темы сайта', error);
        cachedThemes = [];
        return cachedThemes;
      });
  }
  return themesPromise;
}

function renderThemeOptions(themes: Theme[], selectedId: string | null): string {
  if (!themes.length) {
    return '<option value="">Стандартная тема</option>';
  }
  return [
    '<option value="">Стандартная тема</option>',
    ...themes.map((theme) => `<option value="${theme.id}" ${selectedId === theme.id ? 'selected' : ''}>${theme.name}</option>`),
  ].join('');
}

export async function renderWebsite(context: AppContext) {
  const { root, store } = context;
  const profile = store.getState();

  root.innerHTML = `
    <section class="card website">
      <h1>Сайт-приглашение</h1>
      <p>Настройте сайт и поделитесь ссылкой с гостями. Здесь можно выбрать тему и отредактировать основные тексты.</p>
      <form id="website-form" class="website__form">
        <label>Заголовок
          <input type="text" name="websiteTitle" value="${profile.websiteTitle}" maxlength="120" />
        </label>
        <label>Приветственное сообщение
          <textarea name="websiteMessage" rows="4">${profile.websiteMessage}</textarea>
        </label>
        <label>Программа дня
          <textarea name="websiteSchedule" rows="4" placeholder="12:00 — Сбор гостей\n13:00 — Церемония\n16:00 — Банкет">${profile.websiteSchedule}</textarea>
        </label>
        <label>Тема оформления
          <select name="websiteThemeId" id="website-theme-select"></select>
        </label>
      </form>
      <section class="website__preview">
        <h2>Превью</h2>
        <article class="website-preview-card">
          <h3>${profile.websiteTitle}</h3>
          <p>${profile.websiteMessage}</p>
          <pre>${profile.websiteSchedule || 'Расписание ещё не заполнено'}</pre>
        </article>
      </section>
    </section>
  `;

  const form = root.querySelector<HTMLFormElement>('#website-form');
  const themeSelect = root.querySelector<HTMLSelectElement>('#website-theme-select');

  if (themeSelect) {
    const themes = await loadThemes();
    themeSelect.innerHTML = renderThemeOptions(themes, profile.websiteThemeId);
    themeSelect.addEventListener('change', (event) => {
      const target = event.target as HTMLSelectElement;
      const update: ProfileUpdate = { websiteThemeId: target.value || null };
      store.update(update);
    });
  }

  if (!form) {
    return;
  }

  form.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target.name) return;

    const update: ProfileUpdate = { [target.name]: target.value } as ProfileUpdate;
    store.update(update);

    if (target.name.startsWith('website')) {
      const preview = root.querySelector<HTMLElement>('.website-preview-card');
      if (preview) {
        const titleEl = preview.querySelector('h3');
        const messageEl = preview.querySelector('p');
        const scheduleEl = preview.querySelector('pre');
        if (titleEl && target.name === 'websiteTitle') {
          titleEl.textContent = target.value;
        }
        if (messageEl && target.name === 'websiteMessage') {
          messageEl.textContent = target.value;
        }
        if (scheduleEl && target.name === 'websiteSchedule') {
          scheduleEl.textContent = target.value || 'Расписание ещё не заполнено';
        }
      }
    }
  });
}
