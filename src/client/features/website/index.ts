import type { AppContext } from '../../types';
import type { ProfileUpdate } from '../../state/profileStore';
import { getThemeById, loadThemes } from '../../state/themes';
import type { WebsiteTheme } from '../../state/themes';

const THEME_FONT_LINK_ID = 'website-theme-font';

function ensureThemeFontLink(fontLink?: string) {
  if (typeof document === 'undefined') {
    return;
  }
  const existing = document.getElementById(THEME_FONT_LINK_ID) as HTMLLinkElement | null;
  if (fontLink && fontLink.trim().length > 0) {
    if (existing) {
      if (existing.href !== fontLink) {
        existing.href = fontLink;
      }
    } else {
      const link = document.createElement('link');
      link.id = THEME_FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.href = fontLink;
      document.head.appendChild(link);
    }
  } else if (existing) {
    existing.remove();
  }
}

function renderThemeOptions(themes: WebsiteTheme[], selectedId: string | null): string {
  if (!themes.length) {
    return '<option value="">Стандартная тема</option>';
  }
  return [
    '<option value="">Стандартная тема</option>',
    ...themes.map((theme) => `<option value="${theme.id}" ${selectedId === theme.id ? 'selected' : ''}>${theme.name}</option>`),
  ].join('');
}

function setStyle(element: HTMLElement | null, property: string, value: string | undefined) {
  if (!element) return;
  if (value && value.length) {
    element.style.setProperty(property, value);
  } else {
    element.style.removeProperty(property);
  }
}

function applyThemeToPreview(root: HTMLElement, themeId: string | null) {
  const theme = getThemeById(themeId);
  const previewSection = root.querySelector<HTMLElement>('.website__preview');
  const previewCard = root.querySelector<HTMLElement>('[data-preview-card]');

  if (!previewCard) {
    return;
  }

  const colors = theme.colors ?? {};

  setStyle(previewSection, 'background', colors.background);
  setStyle(previewSection, 'color', colors.text);

  setStyle(previewCard, 'background', colors.card);
  setStyle(previewCard, 'color', colors.text);
  setStyle(previewCard, 'borderColor', colors.accentSoft);

  const titleEl = previewCard.querySelector<HTMLElement>('[data-preview-title]');
  if (titleEl) {
    if (theme.headingFont) {
      titleEl.style.fontFamily = theme.headingFont;
    } else {
      titleEl.style.removeProperty('font-family');
    }
    setStyle(titleEl, 'color', colors.text);
  }

  if (theme.bodyFont) {
    previewCard.style.fontFamily = theme.bodyFont;
  } else {
    previewCard.style.removeProperty('font-family');
  }

  const messageEl = previewCard.querySelector<HTMLElement>('[data-preview-message]');
  setStyle(messageEl, 'color', colors.muted ?? colors.text);

  const scheduleEl = previewCard.querySelector<HTMLElement>('[data-preview-schedule]');
  if (scheduleEl) {
    setStyle(scheduleEl, 'background', colors.accentSoft);
    setStyle(scheduleEl, 'color', colors.text);
    scheduleEl.style.borderRadius = '12px';
    scheduleEl.style.padding = '0.75rem 1rem';
  }

  const taglineEl = previewCard.querySelector<HTMLElement>('[data-theme-tagline]');
  if (taglineEl) {
    taglineEl.textContent = theme.tagline && theme.tagline.trim().length ? theme.tagline : 'Приглашение';
    setStyle(taglineEl, 'color', colors.accent ?? colors.text);
  }

  ensureThemeFontLink(theme.fontLink);
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
        <article class="website-preview-card" data-preview-card>
          <p class="website-preview-card__tagline" data-theme-tagline></p>
          <h3 data-preview-title>${profile.websiteTitle}</h3>
          <p data-preview-message>${profile.websiteMessage}</p>
          <pre data-preview-schedule>${profile.websiteSchedule || 'Расписание ещё не заполнено'}</pre>
        </article>
      </section>
    </section>
  `;

  const form = root.querySelector<HTMLFormElement>('#website-form');
  const themeSelect = root.querySelector<HTMLSelectElement>('#website-theme-select');
  const previewCard = root.querySelector<HTMLElement>('[data-preview-card]');
  const previewTitle = root.querySelector<HTMLElement>('[data-preview-title]');
  const previewMessage = root.querySelector<HTMLElement>('[data-preview-message]');
  const previewSchedule = root.querySelector<HTMLElement>('[data-preview-schedule]');

  if (themeSelect) {
    const themes = await loadThemes();
    themeSelect.innerHTML = renderThemeOptions(themes, profile.websiteThemeId);
    themeSelect.addEventListener('change', (event) => {
      const target = event.target as HTMLSelectElement;
      const update: ProfileUpdate = { websiteThemeId: target.value || null };
      store.update(update);
      applyThemeToPreview(root, update.websiteThemeId);
    });
  }

  applyThemeToPreview(root, profile.websiteThemeId);

  if (!form) {
    return;
  }

  form.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target.name) return;

    const update: ProfileUpdate = { [target.name]: target.value } as ProfileUpdate;
    store.update(update);

    if (target.name.startsWith('website')) {
      if (previewCard && target.name === 'websiteTitle' && previewTitle) {
        previewTitle.textContent = target.value;
      }
      if (previewCard && target.name === 'websiteMessage' && previewMessage) {
        previewMessage.textContent = target.value;
      }
      if (previewCard && target.name === 'websiteSchedule' && previewSchedule) {
        previewSchedule.textContent = target.value || 'Расписание ещё не заполнено';
      }
    }
  });
}
