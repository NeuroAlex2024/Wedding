import { ATMOSPHERE_OPTIONS, BUDGET_RANGES, CITIES_TOP10, STYLE_OPTIONS } from '../../state/constants';
import type { ProfileUpdate } from '../../state/profileStore';
import type { AppContext } from '../../types';

function createCheckboxOption(value: string, checked: boolean): string {
  return `
    <label class="checkbox-pill">
      <input type="checkbox" name="vibe" value="${value}" ${checked ? 'checked' : ''} />
      <span>${value}</span>
    </label>
  `;
}

export function renderQuiz(context: AppContext) {
  const { root, store } = context;
  const profile = store.getState();

  root.innerHTML = `
    <section class="card quiz">
      <h1>Подбор профиля свадьбы</h1>
      <p>Заполните анкету, чтобы персонализировать рекомендации и инструменты планирования.</p>
      <form id="quiz-form" class="quiz__form">
        <div class="grid">
          <label>Имя жениха
            <input name="groomName" type="text" value="${profile.groomName ?? ''}" placeholder="Иван" autocomplete="off" />
          </label>
          <label>Имя невесты
            <input name="brideName" type="text" value="${profile.brideName ?? ''}" placeholder="Анна" autocomplete="off" />
          </label>
        </div>
        <fieldset>
          <legend>Желаемая атмосфера</legend>
          <div class="checkbox-group">
            ${ATMOSPHERE_OPTIONS.map((option) => createCheckboxOption(option, profile.vibe.includes(option))).join('')}
          </div>
        </fieldset>
        <label>Стиль свадьбы
          <select name="style">
            <option value="">Выберите стиль</option>
            ${STYLE_OPTIONS.map((option) => `<option value="${option}" ${profile.style === option ? 'selected' : ''}>${option}</option>`).join('')}
          </select>
        </label>
        <fieldset>
          <legend>Площадка уже забронирована?</legend>
          <label class="radio-inline">
            <input type="radio" name="venueBooked" value="yes" ${profile.venueBooked ? 'checked' : ''} /> Да
          </label>
          <label class="radio-inline">
            <input type="radio" name="venueBooked" value="no" ${!profile.venueBooked ? 'checked' : ''} /> Нет
          </label>
        </fieldset>
        <label>Город празднования
          <select name="city">
            <option value="">Выберите город</option>
            ${CITIES_TOP10.map((city) => `<option value="${city}" ${profile.city === city ? 'selected' : ''}>${city}</option>`).join('')}
          </select>
        </label>
        <div class="grid">
          <label>Год мероприятия
            <input name="year" type="number" min="${new Date().getFullYear()}" value="${profile.year ?? ''}" />
          </label>
          <label>Месяц
            <input name="month" type="number" min="1" max="12" value="${profile.month ?? ''}" />
          </label>
        </div>
        <label>Гостей
          <input name="guestCount" type="number" min="0" step="10" value="${profile.guestCount ?? ''}" />
        </label>
        <label>Бюджет
          <select name="budgetRange">
            <option value="">Выберите диапазон</option>
            ${BUDGET_RANGES.map((range) => `<option value="${range}" ${profile.budgetRange === range ? 'selected' : ''}>${range}</option>`).join('')}
          </select>
        </label>
      </form>
    </section>
  `;

  const form = root.querySelector<HTMLFormElement>('#quiz-form');
  if (!form) return;

  form.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (!target.name) return;

    if (target.name === 'vibe' && target instanceof HTMLInputElement) {
      const next = new Set(store.getState().vibe);
      if (target.checked) {
        next.add(target.value);
      } else {
        next.delete(target.value);
      }
      store.update({ vibe: Array.from(next) });
      return;
    }

    if (target.name === 'venueBooked' && target instanceof HTMLInputElement) {
      store.update({ venueBooked: target.value === 'yes' });
      return;
    }

    if (target.name === 'guestCount' && target instanceof HTMLInputElement) {
      const value = target.value === '' ? null : Number(target.value);
      store.update({ guestCount: Number.isNaN(value) ? null : value });
      return;
    }

    if (target.name === 'year' && target instanceof HTMLInputElement) {
      const value = target.value === '' ? null : Number(target.value);
      store.update({ year: Number.isNaN(value) ? null : value });
      return;
    }

    if (target.name === 'month' && target instanceof HTMLInputElement) {
      const value = target.value === '' ? null : Number(target.value);
      store.update({ month: Number.isNaN(value) ? null : value });
      return;
    }

    const update: ProfileUpdate = { [target.name]: target.value } as ProfileUpdate;
    store.update(update);
  });
}
