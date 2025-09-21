(function () {
  const storageKey = "wedding_profile_v1";
  const dashboardStorageKey = "wedding_dashboard_state_v1";
  const allowedRoutes = ["#/quiz", "#/dashboard"];
  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь"
  ];

  const currencyFormatter = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  });

  const defaultChecklistItems = [
    {
      id: "task-venue",
      text: "Забронировать площадку для церемонии",
      completed: false
    },
    {
      id: "task-guests",
      text: "Согласовать предварительный список гостей",
      completed: false
    },
    {
      id: "task-style",
      text: "Утвердить стиль оформления и цветовую палитру",
      completed: false
    }
  ];

  const defaultBudgetItems = [
    { id: "budget-venue", title: "Аренда площадки", amount: 180000 },
    { id: "budget-catering", title: "Кейтеринг", amount: 95000 },
    { id: "budget-decor", title: "Декор и флористика", amount: 55000 }
  ];

  const App = {
    storageKey,
    dashboardStorageKey,
    allowedRoutes,
    state: {
      profile: null,
      dashboard: null,
      currentRoute: "#/dashboard",
      currentStep: 0,
      modalOpen: false,
      lastFocused: null
    },
    init() {
      this.cacheDom();
      this.bindGlobalEvents();
      this.state.profile = this.loadProfile();
      this.state.dashboard = this.loadDashboardState();
      const defaultRoute = "#/dashboard";
      if (location.hash === "#/welcome") {
        location.replace(defaultRoute);
      } else if (!location.hash || !this.allowedRoutes.includes(location.hash)) {
        location.replace(defaultRoute);
      } else {
        this.handleRouteChange();
      }
    },
    cacheDom() {
      this.appEl = document.getElementById("app");
      this.modalOverlay = document.getElementById("modal-overlay");
      this.modalDialog = document.getElementById("modal-dialog");
      this.modalBody = document.getElementById("modal-body");
      this.modalCloseBtn = document.getElementById("modal-close");
      this.confettiCanvas = document.getElementById("confetti-canvas");
      this.confettiCtx = this.confettiCanvas.getContext("2d");
    },
    bindGlobalEvents() {
      window.addEventListener("hashchange", () => this.handleRouteChange());
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && this.state.modalOpen) {
          this.closeModal();
        }
      });
      this.modalOverlay.addEventListener("click", (event) => {
        if (event.target === this.modalOverlay) {
          this.closeModal();
        }
      });
      this.modalCloseBtn.addEventListener("click", () => this.closeModal());
    },
    handleRouteChange() {
      const hash = location.hash || "#/dashboard";
      this.state.profile = this.loadProfile();
      if (hash === "#/welcome") {
        location.replace("#/dashboard");
        return;
      }
      if (!this.allowedRoutes.includes(hash)) {
        location.replace("#/dashboard");
        return;
      }
      this.state.currentRoute = hash;
      if (hash !== "#/quiz") {
        this.state.currentStep = 0;
      }
      this.render();
    },
    render() {
      switch (this.state.currentRoute) {
        case "#/quiz":
          this.renderQuiz();
          break;
        case "#/dashboard":
          this.renderDashboard();
          break;
        default:
          this.renderDashboard();
      }
    },
    renderQuiz() {
      this.ensureProfile();
      this.appEl.innerHTML = `
        <section class="card">
          <h1>Подбор профиля свадьбы</h1>
          <p>Ответьте на вопросы — мы настроим рекомендации под ваш стиль, город и бюджет.</p>
          <div class="progress" aria-hidden="true">
            <div class="progress__bar" id="quiz-progress"></div>
          </div>
          <p class="step-message" id="quiz-message" role="alert"></p>
          <div class="quiz-step" id="quiz-step"></div>
          <div class="actions">
            <button type="button" class="secondary" id="quiz-back">Назад</button>
            <button type="button" id="quiz-next">Далее</button>
          </div>
        </section>
      `;
      this.quizStepEl = document.getElementById("quiz-step");
      this.quizMessageEl = document.getElementById("quiz-message");
      this.progressBarEl = document.getElementById("quiz-progress");
      document.getElementById("quiz-back").addEventListener("click", () => {
        if (this.state.currentStep > 0) {
          this.state.currentStep -= 1;
          this.updateQuizView();
        }
      });
      document.getElementById("quiz-next").addEventListener("click", () => {
        this.handleQuizNext();
      });
      this.updateQuizView();
    },
    quizSteps: [],
    ensureQuizSteps() {
      if (this.quizSteps.length) return;
      this.quizSteps = [
        (container, profile) => {
          container.innerHTML = `
            <div>
              <label for="quiz-groom">Имя жениха</label>
              <input id="quiz-groom" type="text" required value="${profile.groomName || ""}" placeholder="Иван">
            </div>
          `;
          const input = container.querySelector("input");
          input.addEventListener("input", (event) => {
            this.updateProfile({ groomName: event.target.value });
          });
        },
        (container, profile) => {
          container.innerHTML = `
            <div>
              <label for="quiz-bride">Имя невесты</label>
              <input id="quiz-bride" type="text" required value="${profile.brideName || ""}" placeholder="Анна">
            </div>
          `;
          const input = container.querySelector("input");
          input.addEventListener("input", (event) => {
            this.updateProfile({ brideName: event.target.value });
          });
        },
        (container, profile) => {
          const selected = new Set(profile.vibe || []);
          container.innerHTML = `
            <fieldset>
              <legend>Какую атмосферу хотите создать?</legend>
              <div class="checkbox-group" id="vibe-options"></div>
            </fieldset>
          `;
          const list = container.querySelector("#vibe-options");
          ATMOSPHERE_OPTIONS.forEach((option) => {
            const id = `vibe-${option}`;
            const wrapper = document.createElement("label");
            wrapper.className = "checkbox-pill";
            wrapper.setAttribute("for", id);
            wrapper.innerHTML = `<input type="checkbox" id="${id}" value="${option}"> <span>${option}</span>`;
            const input = wrapper.querySelector("input");
            if (selected.has(option)) {
              input.checked = true;
            }
            input.addEventListener("change", () => {
              const current = new Set(this.state.profile.vibe || []);
              if (input.checked) {
                current.add(option);
              } else {
                current.delete(option);
              }
              this.updateProfile({ vibe: Array.from(current) });
            });
            list.appendChild(wrapper);
          });
        },
        (container, profile) => {
          container.innerHTML = `
            <div>
              <label for="quiz-style">Стиль идеальной свадьбы</label>
              <select id="quiz-style" required>
                <option value="" disabled ${profile.style ? "" : "selected"}>Выберите стиль</option>
                ${STYLE_OPTIONS.map((option) => `
                  <option value="${option}" ${profile.style === option ? "selected" : ""}>${option}</option>
                `).join("")}
              </select>
            </div>
          `;
          const select = container.querySelector("select");
          select.addEventListener("change", (event) => {
            this.updateProfile({ style: event.target.value });
          });
        },
        (container, profile) => {
          container.innerHTML = `
            <fieldset>
              <legend>Место уже забронировано?</legend>
              <div class="radio-group">
                <label><input type="radio" name="venue" value="yes" ${profile.venueBooked ? "checked" : ""}> Да</label>
                <label><input type="radio" name="venue" value="no" ${!profile.venueBooked ? "checked" : ""}> Нет</label>
              </div>
            </fieldset>
          `;
          container.querySelectorAll("input[name='venue']").forEach((input) => {
            input.addEventListener("change", () => {
              this.updateProfile({ venueBooked: input.value === "yes" });
            });
          });
        },
        (container, profile) => {
          container.innerHTML = `
            <div>
              <label for="quiz-city">Где хотите праздновать?</label>
              <select id="quiz-city" required>
                <option value="" disabled ${profile.city ? "" : "selected"}>Выберите город</option>
                ${CITIES_TOP10.map((city) => `
                  <option value="${city}" ${profile.city === city ? "selected" : ""}>${city}</option>
                `).join("")}
              </select>
            </div>
          `;
          const select = container.querySelector("select");
          select.addEventListener("change", (event) => {
            this.updateProfile({ city: event.target.value });
          });
        },
        (container, profile) => {
          const currentYear = new Date().getFullYear();
          const years = [0, 1, 2, 3].map((offset) => currentYear + offset);
          container.innerHTML = `
            <div>
              <label for="quiz-year">Когда планируете?</label>
              <select id="quiz-year" required>
                ${years.map((year) => `
                  <option value="${year}" ${profile.year === year ? "selected" : ""}>${year}</option>
                `).join("")}
              </select>
            </div>
          `;
          const select = container.querySelector("select");
          select.addEventListener("change", (event) => {
            this.updateProfile({ year: Number(event.target.value) });
          });
          if (!profile.year) {
            this.updateProfile({ year: Number(select.value) });
          }
        },
        (container, profile) => {
          container.innerHTML = `
            <div>
              <label for="quiz-month">Выберите месяц</label>
              <select id="quiz-month" required>
                ${monthNames.map((name, index) => `
                  <option value="${index + 1}" ${profile.month === index + 1 ? "selected" : ""}>${name}</option>
                `).join("")}
              </select>
            </div>
          `;
          const select = container.querySelector("select");
          select.addEventListener("change", (event) => {
            this.updateProfile({ month: Number(event.target.value) });
          });
          if (!profile.month) {
            this.updateProfile({ month: Number(select.value) });
          }
        },
        (container, profile) => {
          container.innerHTML = `
            <fieldset>
              <legend>Какой бюджет рассматриваете?</legend>
              <div class="radio-group">
                ${BUDGET_RANGES.map((range, index) => `
                  <label><input type="radio" name="budget" value="${range}" ${profile.budgetRange === range || (!profile.budgetRange && index === 0) ? "checked" : ""}> ${range}</label>
                `).join("")}
              </div>
            </fieldset>
          `;
          container.querySelectorAll("input[name='budget']").forEach((input) => {
            input.addEventListener("change", () => {
              this.updateProfile({ budgetRange: input.value });
            });
          });
          if (!profile.budgetRange) {
            this.updateProfile({ budgetRange: BUDGET_RANGES[0] });
          }
        },
        (container, profile) => {
          container.innerHTML = `
            <div>
              <label for="quiz-guests">Сколько гостей ожидаете?</label>
              <input id="quiz-guests" type="range" min="10" max="100" step="1" value="${profile.guests || 50}">
              <div class="range-display">${profile.guests || 50} гостей</div>
            </div>
          `;
          const range = container.querySelector("input");
          const display = container.querySelector(".range-display");
          const update = (value) => {
            display.textContent = `${value} гостей`;
            this.updateProfile({ guests: Number(value) });
          };
          range.addEventListener("input", (event) => {
            update(event.target.value);
          });
          update(range.value);
        },
        (container, profile) => {
          const summary = this.buildSummary(profile);
          container.innerHTML = `
            <div>
              <h2>Проверьте ответы</h2>
              <p>Если что-то не так — вернитесь назад и поправьте.</p>
              <ul>
                ${summary.map((item) => `<li>${item}</li>`).join("")}
              </ul>
            </div>
          `;
        }
      ];
    },
    buildSummary(profile) {
      return [
        `Жених: <strong>${profile.groomName || "—"}</strong>`,
        `Невеста: <strong>${profile.brideName || "—"}</strong>`,
        `Атмосфера: <strong>${(profile.vibe || []).join(", ") || "—"}</strong>`,
        `Стиль: <strong>${profile.style || "—"}</strong>`,
        `Место забронировано: <strong>${profile.venueBooked ? "Да" : "Нет"}</strong>`,
        `Город: <strong>${profile.city || "—"}</strong>`,
        `Дата: <strong>${profile.month ? monthNames[profile.month - 1] : "—"} ${profile.year || ""}</strong>`,
        `Бюджет: <strong>${profile.budgetRange || "—"}</strong>`,
        `Гостей: <strong>${profile.guests || "—"}</strong>`
      ];
    },
    updateQuizView() {
      this.ensureQuizSteps();
      const totalSteps = this.quizSteps.length;
      const currentIndex = this.state.currentStep;
      const profile = this.state.profile;
      this.quizSteps[currentIndex](this.quizStepEl, profile);
      const progressPercent = Math.round(((currentIndex + 1) / totalSteps) * 100);
      this.progressBarEl.style.width = `${progressPercent}%`;
      const backBtn = document.getElementById("quiz-back");
      const nextBtn = document.getElementById("quiz-next");
      backBtn.disabled = currentIndex === 0;
      nextBtn.textContent = currentIndex === totalSteps - 1 ? "Завершить" : "Далее";
      this.quizMessageEl.textContent = "";
    },
    handleQuizNext() {
      const totalSteps = this.quizSteps.length;
      if (!this.validateStep(this.state.currentStep)) {
        return;
      }
      if (this.state.currentStep === totalSteps - 1) {
        this.finishQuiz();
        return;
      }
      this.state.currentStep += 1;
      this.updateQuizView();
    },
    validateStep(stepIndex) {
      const profile = this.state.profile || {};
      switch (stepIndex) {
        case 0: {
          const value = (profile.groomName || "").trim();
          if (!value) {
            this.quizMessageEl.textContent = "Пожалуйста, укажите имя жениха.";
            const input = document.getElementById("quiz-groom");
            if (input) input.focus();
            return false;
          }
          this.updateProfile({ groomName: value });
          break;
        }
        case 1: {
          const value = (profile.brideName || "").trim();
          if (!value) {
            this.quizMessageEl.textContent = "Пожалуйста, укажите имя невесты.";
            const input = document.getElementById("quiz-bride");
            if (input) input.focus();
            return false;
          }
          this.updateProfile({ brideName: value });
          break;
        }
        case 2: {
          if (!profile.vibe || profile.vibe.length === 0) {
            this.quizMessageEl.textContent = "Выберите хотя бы один вариант атмосферы.";
            return false;
          }
          break;
        }
        case 3: {
          if (!profile.style) {
            this.quizMessageEl.textContent = "Выберите предпочитаемый стиль.";
            const select = document.getElementById("quiz-style");
            if (select) select.focus();
            return false;
          }
          break;
        }
        case 5: {
          if (!profile.city) {
            this.quizMessageEl.textContent = "Укажите город празднования.";
            const select = document.getElementById("quiz-city");
            if (select) select.focus();
            return false;
          }
          break;
        }
        case 6: {
          if (!profile.year) {
            this.quizMessageEl.textContent = "Выберите год свадьбы.";
            const select = document.getElementById("quiz-year");
            if (select) select.focus();
            return false;
          }
          break;
        }
        case 7: {
          if (!profile.month) {
            this.quizMessageEl.textContent = "Выберите месяц.";
            const select = document.getElementById("quiz-month");
            if (select) select.focus();
            return false;
          }
          break;
        }
        case 8: {
          if (!profile.budgetRange) {
            this.quizMessageEl.textContent = "Укажите предполагаемый бюджет.";
            return false;
          }
          break;
        }
        case 9: {
          if (!profile.guests) {
            this.quizMessageEl.textContent = "Укажите количество гостей.";
            const range = document.getElementById("quiz-guests");
            if (range) range.focus();
            return false;
          }
          break;
        }
        default:
          break;
      }
      this.quizMessageEl.textContent = "";
      return true;
    },
    finishQuiz() {
      const now = Date.now();
      this.updateProfile({ updatedAt: now });
      this.triggerConfetti();
      setTimeout(() => {
        location.hash = "#/dashboard";
      }, 1200);
    },
    ensureProfile() {
      if (this.state.profile) return;
      const now = Date.now();
      const currentYear = new Date().getFullYear();
      const profile = {
        schemaVersion: 1,
        weddingId: now.toString(),
        vibe: [],
        style: "",
        venueBooked: false,
        city: "",
        year: currentYear,
        month: new Date().getMonth() + 1,
        budgetRange: "",
        guests: 50,
        createdAt: now,
        updatedAt: now
      };
      this.saveProfile(profile);
    },
    renderDashboard() {
      const profile = this.state.profile;
      const dashboardState = this.ensureDashboardState();
      const hasProfile = Boolean(profile);
      const summaryItems = [];
      if (hasProfile && profile.vibe && profile.vibe.length) {
        summaryItems.push(`Атмосфера: ${profile.vibe.join(", ")}`);
      }
      if (hasProfile && profile.style) {
        summaryItems.push(`Стиль: ${profile.style}`);
      }
      if (hasProfile && profile.city) {
        summaryItems.push(`Город: ${profile.city}`);
      }
      if (hasProfile && profile.guests) {
        summaryItems.push(`Гостей: ${profile.guests}`);
      }
      if (hasProfile && profile.budgetRange) {
        summaryItems.push(`Бюджет: ${profile.budgetRange}`);
      }
      const summaryFallback = hasProfile
        ? `<p class="dashboard-intro">Ваши ответы появятся здесь сразу после прохождения теста.</p>`
        : `<p class="dashboard-intro">Пройдите короткую настройку — и мы подготовим персональный план праздника.</p>`;
      const summaryBlock = summaryItems.length
        ? `<ul class="summary-pills">${summaryItems.map((item) => `<li>${item}</li>`).join("")}</ul>`
        : summaryFallback;
      const heading = hasProfile
        ? `${profile.groomName || "Жених"} + ${profile.brideName || "Невеста"}, добро пожаловать!`
        : "Планирование свадьбы без стресса";
      const heroImage = `
        <div class="dashboard-hero-image">
          <img src="https://images.unsplash.com/photo-1542379510-1026e928ed4f?q=80&w=3118&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Счастливая пара на свадьбе">
        </div>
      `;
      const daysBlock = hasProfile ? this.renderCountdown(profile) : "";
      this.appEl.innerHTML = `
        <section class="dashboard">
          ${this.renderDashboardNavigation()}
          <section class="card dashboard-hero">
            <div class="dashboard-hero__media">${heroImage}</div>
            <div class="dashboard-hero__content">
              <h1>${heading}</h1>
              ${summaryBlock}
              ${daysBlock}
              <div class="dashboard-hero__actions">
                ${
                  hasProfile
                    ? '<button type="button" class="secondary" id="edit-quiz">Обновить ответы</button>'
                    : '<button type="button" id="start-quiz">Пройти настройку профиля</button>'
                }
              </div>
            </div>
          </section>
          <div class="dashboard-modules">
            ${this.renderChecklistModule(dashboardState)}
            ${this.renderToolsModule()}
            ${this.renderBudgetModule(dashboardState)}
          </div>
        </section>
      `;
      this.bindDashboardInteractions(hasProfile, dashboardState);
    },
    renderDashboardNavigation() {
      return `
        <section class="card module module--nav">
          <div class="module-header">
            <h2>Основные разделы</h2>
            <p>Быстрый доступ ко всем ключевым блокам свадьбы</p>
          </div>
          <ul class="nav-pill-list">
            ${DASHBOARD_NAV_ITEMS.map(
              (item) => `
                <li>
                  <button type="button" class="nav-pill" data-title="${item.label}" data-nav="${item.id}">
                    ${item.label}
                  </button>
                </li>
              `
            ).join("")}
          </ul>
        </section>
      `;
    },
    renderChecklistModule(dashboardState) {
      const items = dashboardState.checklist || [];
      const listMarkup = items.length
        ? `<ul class="checklist" id="checklist-items">
            ${items
              .map(
                (item) => `
                  <li class="checklist-item ${item.completed ? "is-completed" : ""}">
                    <label>
                      <input type="checkbox" data-checklist-toggle="${item.id}" ${
                        item.completed ? "checked" : ""
                      }>
                      <span>${item.text}</span>
                    </label>
                  </li>
                `
              )
              .join("")}
          </ul>`
        : `<p class="empty-state">Добавьте первую задачу, чтобы ничего не забыть.</p>`;
      return `
        <section class="card module module--checklist" id="module-checklist">
          <div class="module-header">
            <h2>Чек-лист</h2>
            <p>Отмечайте выполненное и добавляйте новые дела в один клик</p>
          </div>
          ${listMarkup}
          <form id="checklist-form" class="checklist-form" autocomplete="off">
            <label for="checklist-input" class="visually-hidden">Новая задача</label>
            <div class="checklist-form__row">
              <input id="checklist-input" type="text" name="checklist" placeholder="Например, выбрать торт" required>
              <button type="submit">Добавить</button>
            </div>
          </form>
        </section>
      `;
    },
    renderToolsModule() {
      return `
        <section class="card module module--tools" id="module-tools">
          <div class="module-header">
            <h2>Инструменты</h2>
            <p>Все сервисы для подготовки свадьбы на одной панели</p>
          </div>
          <div class="tool-grid">
            ${DASHBOARD_TOOL_ITEMS.map(
              (tool) => `
                <article class="tool-card" tabindex="0" data-title="${tool.title}" data-tool="${tool.id}">
                  <header>
                    <h3>${tool.title}</h3>
                    <p>${tool.subtitle}</p>
                  </header>
                  <footer>
                    <span class="tool-card__hint">Скоро доступно</span>
                  </footer>
                </article>
              `
            ).join("")}
          </div>
        </section>
      `;
    },
    renderBudgetModule(dashboardState) {
      const items = dashboardState.budget || [];
      const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const summary = `
        <div class="budget-summary">
          <span>Всего запланировано</span>
          <strong>${this.formatCurrency(total)}</strong>
        </div>
      `;
      const chart = items.length
        ? `<div class="budget-chart" id="budget-chart">
            ${items
              .map((item, index) => this.renderBudgetBar(item, index, total))
              .join("")}
          </div>`
        : `<p class="empty-state">Добавьте первую статью расходов, чтобы видеть распределение бюджета.</p>`;
      const listMarkup = items.length
        ? `<ul class="budget-list" id="budget-list">
            ${items
              .map(
                (item) => `
                  <li class="budget-list-item" data-id="${item.id}">
                    <span class="budget-list-item__title">${item.title}</span>
                    <span class="budget-list-item__amount">${this.formatCurrency(item.amount)}</span>
                  </li>
                `
              )
              .join("")}
          </ul>`
        : "";
      return `
        <section class="card module module--budget" id="module-budget">
          <div class="module-header">
            <h2>Бюджет</h2>
            <p>Визуализируйте расходы и добавляйте новые статьи мгновенно</p>
          </div>
          ${summary}
          ${chart}
          ${listMarkup}
          <form id="budget-form" class="budget-form" autocomplete="off">
            <div class="budget-form__row">
              <div class="form-field">
                <label for="budget-name">Название статьи</label>
                <input id="budget-name" type="text" name="budgetName" placeholder="Например, флористика" required>
              </div>
              <div class="form-field">
                <label for="budget-amount">Сумма, ₽</label>
                <input id="budget-amount" type="number" name="budgetAmount" min="0" step="1000" inputmode="numeric" required>
              </div>
            </div>
            <button type="submit">Добавить статью</button>
          </form>
        </section>
      `;
    },
    renderBudgetBar(item, index, total) {
      const safeTotal = total > 0 ? total : 1;
      const amount = Number(item.amount) || 0;
      const percent = Math.round((amount / safeTotal) * 100);
      const color = BUDGET_COLORS[index % BUDGET_COLORS.length];
      return `
        <div class="budget-bar" data-id="${item.id}" data-amount="${amount}" data-percent="${percent}">
          <div class="budget-bar__header">
            <span>${item.title}</span>
            <span>${percent}%</span>
          </div>
          <div class="budget-bar__track">
            <div class="budget-bar__fill" style="background:${color};"></div>
          </div>
        </div>
      `;
    },
    bindDashboardInteractions(hasProfile, dashboardState) {
      if (hasProfile) {
        const editButton = document.getElementById("edit-quiz");
        if (editButton) {
          editButton.addEventListener("click", () => {
            this.state.currentStep = 0;
            location.hash = "#/quiz";
          });
        }
      } else {
        const startButton = document.getElementById("start-quiz");
        if (startButton) {
          startButton.addEventListener("click", () => {
            this.state.currentStep = 0;
            this.ensureProfile();
            location.hash = "#/quiz";
          });
        }
      }

      this.appEl.querySelectorAll(".nav-pill").forEach((pill) => {
        pill.addEventListener("click", () => this.openModal(pill));
      });

      this.appEl.querySelectorAll(".tool-card").forEach((card) => {
        const handleActivate = (event) => {
          if (event && event.type === "keydown" && event.key !== "Enter" && event.key !== " ") {
            return;
          }
          if (event && event.type === "keydown") {
            event.preventDefault();
          }
          this.openModal(card);
        };
        card.addEventListener("click", handleActivate);
        card.addEventListener("keydown", handleActivate);
      });

      const checklistForm = document.getElementById("checklist-form");
      const checklistInput = document.getElementById("checklist-input");
      if (checklistForm && checklistInput) {
        checklistForm.addEventListener("submit", (event) => {
          event.preventDefault();
          const value = checklistInput.value.trim();
          if (!value) {
            checklistInput.focus();
            return;
          }
          checklistForm.reset();
          this.updateDashboardState((draft) => {
            draft.checklist.push({ id: this.generateId(), text: value, completed: false });
            return draft;
          });
        });
      }

      this.appEl.querySelectorAll("[data-checklist-toggle]").forEach((input) => {
        input.addEventListener("change", (event) => {
          const id = event.target.getAttribute("data-checklist-toggle");
          const checked = event.target.checked;
          this.updateDashboardState((draft) => {
            const item = draft.checklist.find((task) => task.id === id);
            if (!item) {
              return null;
            }
            item.completed = checked;
            return draft;
          });
        });
      });

      const budgetForm = document.getElementById("budget-form");
      const budgetName = document.getElementById("budget-name");
      const budgetAmount = document.getElementById("budget-amount");
      if (budgetForm && budgetName && budgetAmount) {
        budgetForm.addEventListener("submit", (event) => {
          event.preventDefault();
          const name = budgetName.value.trim();
          const amountValue = Number(budgetAmount.value);
          if (!name) {
            budgetName.focus();
            return;
          }
          if (!Number.isFinite(amountValue) || amountValue <= 0) {
            budgetAmount.setCustomValidity("Введите сумму больше нуля");
            budgetAmount.reportValidity();
            budgetAmount.setCustomValidity("");
            return;
          }
          budgetForm.reset();
          this.updateDashboardState((draft) => {
            draft.budget.push({ id: this.generateId(), title: name, amount: Math.round(amountValue) });
            return draft;
          });
        });
      }

      this.animateBudgetChart(dashboardState.budget || []);
    },
    animateBudgetChart(items) {
      const chart = this.appEl.querySelector("#budget-chart");
      if (!chart || !items.length) {
        return;
      }
      const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 1;
      requestAnimationFrame(() => {
        chart.querySelectorAll(".budget-bar").forEach((bar) => {
          const amount = Number(bar.getAttribute("data-amount")) || 0;
          const percent = Math.min(100, Math.round((amount / total) * 100));
          const fill = bar.querySelector(".budget-bar__fill");
          if (!fill) return;
          fill.style.width = "0%";
          // Force layout so that transition restarts each time
          void fill.offsetWidth;
          fill.style.width = `${percent}%`;
        });
      });
    },
    ensureDashboardState() {
      if (this.state.dashboard) {
        return this.state.dashboard;
      }
      const stored = this.loadDashboardState();
      if (stored) {
        this.state.dashboard = stored;
        return stored;
      }
      const defaults = this.getDefaultDashboardState();
      this.saveDashboardState(defaults);
      return defaults;
    },
    getDefaultDashboardState() {
      return {
        schemaVersion: 1,
        checklist: defaultChecklistItems.map((item) => ({ ...item })),
        budget: defaultBudgetItems.map((item) => ({ ...item }))
      };
    },
    loadDashboardState() {
      try {
        const raw = localStorage.getItem(this.dashboardStorageKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.schemaVersion !== 1) {
          return null;
        }
        if (!Array.isArray(parsed.checklist) || !Array.isArray(parsed.budget)) {
          return null;
        }
        return {
          schemaVersion: 1,
          checklist: parsed.checklist.map((item) => ({
            id: item.id || this.generateId(),
            text: item.text || "",
            completed: Boolean(item.completed)
          })),
          budget: parsed.budget.map((item) => ({
            id: item.id || this.generateId(),
            title: item.title || "",
            amount: Number(item.amount) || 0
          }))
        };
      } catch (error) {
        console.error("Не удалось загрузить данные дашборда", error);
        return null;
      }
    },
    saveDashboardState(state) {
      try {
        localStorage.setItem(this.dashboardStorageKey, JSON.stringify(state));
        this.state.dashboard = state;
      } catch (error) {
        console.error("Не удалось сохранить данные дашборда", error);
      }
    },
    updateDashboardState(updater) {
      const base = this.ensureDashboardState();
      const draft = {
        schemaVersion: 1,
        checklist: base.checklist.map((item) => ({ ...item })),
        budget: base.budget.map((item) => ({ ...item }))
      };
      const result = updater(draft);
      if (!result) {
        return;
      }
      this.saveDashboardState(result);
      this.renderDashboard();
    },
    generateId() {
      return `id-${Math.random().toString(36).slice(2, 10)}`;
    },
    formatCurrency(value) {
      const amount = Number(value) || 0;
      return currencyFormatter.format(amount);
    },
    renderCountdown(profile) {
      if (!profile.year || !profile.month) {
        return "";
      }
      const targetDate = new Date(profile.year, profile.month - 1, 1);
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (Number.isNaN(days) || days < 0) {
        return "";
      }
      return `<p class="banner"><strong>До свадьбы осталось ${days} ${this.pluralizeDays(days)}.</strong></p>`;
    },
    pluralizeDays(days) {
      const abs = Math.abs(days);
      const mod10 = abs % 10;
      const mod100 = abs % 100;
      if (mod10 === 1 && mod100 !== 11) return "день";
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "дня";
      return "дней";
    },
    openModal(card) {
      this.state.modalOpen = true;
      this.state.lastFocused = card || document.activeElement;
      let sectionTitle = "этот раздел";
      if (card) {
        if (card.dataset && card.dataset.title) {
          sectionTitle = card.dataset.title;
        } else {
          const heading = card.querySelector("h3");
          if (heading) {
            sectionTitle = heading.textContent;
          }
        }
      }
      this.modalBody.textContent = `Раздел «${sectionTitle}» скоро появится. Подрядчики и фильтры будут настроены под ваш профиль 👰🤵`;
      this.modalOverlay.classList.add("active");
      this.modalOverlay.setAttribute("aria-hidden", "false");
      this.modalCloseBtn.focus();
    },
    closeModal() {
      if (!this.state.modalOpen) return;
      this.state.modalOpen = false;
      this.modalOverlay.classList.remove("active");
      this.modalOverlay.setAttribute("aria-hidden", "true");
      if (this.state.lastFocused && typeof this.state.lastFocused.focus === "function") {
        this.state.lastFocused.focus();
      }
    },
    triggerConfetti() {
      const canvas = this.confettiCanvas;
      const ctx = this.confettiCtx;
      const width = (canvas.width = window.innerWidth);
      const height = (canvas.height = window.innerHeight);
      canvas.style.display = "block";
      const colors = ["#e07a8b", "#f2b5c4", "#f6d365", "#7ec4cf", "#9a8c98", "#cddafd", "#ffb4a2", "#84dcc6"];
      const particles = Array.from({ length: 150 }, () => ({
        x: Math.random() * width,
        y: Math.random() * -height,
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        speedX: -2 + Math.random() * 4,
        speedY: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 0.6 + 0.4
      }));
      const duration = 1400;
      const start = performance.now();

      const animate = (time) => {
        const elapsed = time - start;
        ctx.clearRect(0, 0, width, height);
        particles.forEach((particle) => {
          particle.x += particle.speedX;
          particle.y += particle.speedY;
          particle.rotation += particle.tilt * 10;
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate((particle.rotation * Math.PI) / 180);
          ctx.fillStyle = particle.color;
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.6);
          ctx.restore();
        });
        if (elapsed < duration) {
          requestAnimationFrame(animate);
        } else {
          ctx.clearRect(0, 0, width, height);
          canvas.style.display = "none";
        }
      };
      requestAnimationFrame(animate);
    },
    loadProfile() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return null;
        const profile = JSON.parse(raw);
        if (!profile || profile.schemaVersion !== 1) {
          return null;
        }
        return profile;
      } catch (error) {
        console.error("Не удалось загрузить профиль", error);
        return null;
      }
    },
    saveProfile(profile) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(profile));
        this.state.profile = profile;
      } catch (error) {
        console.error("Не удалось сохранить профиль", error);
      }
    },
    updateProfile(patch) {
      const current = this.state.profile || {};
      const next = {
        ...current,
        ...patch,
        updatedAt: Date.now()
      };
      this.saveProfile(next);
    },
    clearProfile() {
      localStorage.removeItem(this.storageKey);
      this.state.profile = null;
    }
  };

  window.App = App;
  document.addEventListener("DOMContentLoaded", () => App.init());
})();
