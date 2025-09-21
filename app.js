(function () {
  const storageKey = "wedding_profile_v1";
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

  const App = {
    storageKey,
    tasksStorageKey: `${storageKey}_tasks`,
    budgetStorageKey: `${storageKey}_budget`,
    allowedRoutes,
    currencyFormatter: new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0
    }),
    state: {
      profile: null,
      currentRoute: "#/dashboard",
      currentStep: 0,
      modalOpen: false,
      lastFocused: null,
      tasks: [],
      budgetItems: [],
      lastBudgetTotal: 0,
      editingTaskId: null,
      focusNewTask: false,
      editingFocusRequested: false
    },
    init() {
      this.cacheDom();
      this.bindGlobalEvents();
      this.state.profile = this.loadProfile();
      this.state.tasks = this.loadTasks();
      this.state.budgetItems = this.loadBudgetItems();
      this.state.lastBudgetTotal = this.state.budgetItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
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
      const summaryLine = summaryItems.length
        ? `<div class="summary-line">${summaryItems.map((item) => `<span>${item}</span>`).join("")}</div>`
        : "";
      const summaryFallback = `<p class="dashboard-intro">Ваши ответы появятся здесь сразу после прохождения теста.</p>`;
      const introBlock = hasProfile ? summaryLine || summaryFallback : "";
      const heading = hasProfile
        ? `${profile.groomName || "Жених"} + ${profile.brideName || "Невеста"}, добро пожаловать!`
        : "Планирование свадьбы без стресса";
      const heroImage = `
        <div class="dashboard-hero-image">
          <img src="https://images.unsplash.com/photo-1542379510-1026e928ed4f?q=80&w=3118&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Счастливая пара на свадьбе">
        </div>
      `;
      const daysBlock = hasProfile ? this.renderCountdown(profile) : "";
      const quickLinks = DASHBOARD_LINKS.map((link) => `
        <button type="button" class="module-pill" data-open-modal="true" data-title="${link.label}">
          <span>${link.label}</span>
        </button>
      `).join("");
      const toolsCards = DASHBOARD_TOOLS.map((tool) => `
        <article class="tool-card" tabindex="0" data-open-modal="true" data-title="${tool.title}">
          <div class="tool-card__icon" aria-hidden="true">${tool.icon}</div>
          <div class="tool-card__content">
            <h3>${tool.title}</h3>
            <p>${tool.description}</p>
          </div>
        </article>
      `).join("");
      const totalTasks = this.state.tasks.length;
      const completedTasks = this.state.tasks.filter((task) => task.completed).length;
      const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const allCompleted = totalTasks > 0 && completedTasks === totalTasks;
      const completeAllLabel = allCompleted ? "Снять все отметки" : "Отметить все";
      const clearButtonAttributes = completedTasks ? "" : "disabled aria-disabled=\"true\"";
      const tasksMarkup = totalTasks
        ? this.state.tasks
            .map((task) => {
              const safeTitle = this.escapeHtml(task.title);
              if (this.state.editingTaskId === task.id) {
                return `
                  <li class="checklist-row is-editing" data-task-id="${task.id}">
                    <form class="checklist-edit-form">
                      <label class="visually-hidden" for="edit-${task.id}">Изменить задачу</label>
                      <input type="text" id="edit-${task.id}" name="edit-task" value="${safeTitle}" required autocomplete="off">
                      <div class="checklist-edit-form__actions">
                        <button type="submit">Сохранить</button>
                        <button type="button" class="secondary checklist-cancel-edit">Отмена</button>
                      </div>
                    </form>
                  </li>
                `;
              }
              return `
                <li class="checklist-row ${task.completed ? "is-complete" : ""}" data-task-id="${task.id}">
                  <label class="checklist-item ${task.completed ? "completed" : ""}">
                    <input type="checkbox" data-task-id="${task.id}" ${task.completed ? "checked" : ""}>
                    <span>${safeTitle}</span>
                  </label>
                  <div class="checklist-item__actions">
                    <button type="button" class="icon-button checklist-edit" aria-label="Редактировать задачу «${safeTitle}»">✏️</button>
                    <button type="button" class="icon-button checklist-remove" aria-label="Удалить задачу «${safeTitle}»">✖️</button>
                  </div>
                </li>
              `;
            })
            .join("")
        : `<li class="checklist-empty">Добавьте первую задачу, чтобы не забыть важное.</li>`;
      const budgetTotal = this.state.budgetItems.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
      );
      const budgetSegments = this.state.budgetItems.length
        ? `
            <div class="budget-visual" aria-hidden="true">
              <div class="budget-visual__track" id="budget-bar">
                ${this.state.budgetItems
                  .map((item, index) => `
                    <span class="budget-visual__segment" data-amount="${Number(item.amount) || 0}" style="--segment-color: ${BUDGET_COLORS[index % BUDGET_COLORS.length]}"></span>
                  `)
                  .join("")}
              </div>
            </div>
          `
        : "";
      const budgetList = this.state.budgetItems.length
        ? this.state.budgetItems
            .map((item, index) => `
              <li class="budget-item">
                <span class="budget-item__dot" style="--dot-color: ${BUDGET_COLORS[index % BUDGET_COLORS.length]}"></span>
                <div class="budget-item__info">
                  <span class="budget-item__name">${item.title}</span>
                  <span class="budget-item__amount">${this.formatCurrency(item.amount)}</span>
                </div>
              </li>
            `)
            .join("")
        : `<li class="budget-empty">Пока нет расходов — добавьте первую статью бюджета.</li>`;
      const actionsBlock = hasProfile
        ? `<div class="actions dashboard-actions">
            <button type="button" id="edit-quiz">Редактировать ответы теста</button>
          </div>`
        : "";
      const totalDisplay = this.formatCurrency(this.state.lastBudgetTotal || budgetTotal);
      const checklistToolbar = `
        <div class="checklist-toolbar">
          <div class="checklist-progress" role="status" aria-live="polite">
            <span class="checklist-progress__label">Готово ${completedTasks} из ${totalTasks}</span>
            <div class="checklist-progress__bar">
              <span class="checklist-progress__fill" style="width: ${completionRate}%"></span>
            </div>
          </div>
          <div class="checklist-toolbar__actions">
            <button
              type="button"
              class="chip-button"
              id="checklist-complete-all"
              data-mode="${allCompleted ? "reset" : "complete"}"
              aria-pressed="${allCompleted ? "true" : "false"}"
            >
              ${completeAllLabel}
            </button>
            <button type="button" class="chip-button destructive" id="checklist-clear-completed" ${clearButtonAttributes}>
              Очистить выполненные
            </button>
          </div>
        </div>
      `;
      this.appEl.innerHTML = `
        <section class="card dashboard-card-shell">
          <div class="dashboard-top">
            <nav class="dashboard-links" aria-label="Основные разделы">
              <div class="dashboard-links__inner">
                ${quickLinks}
              </div>
            </nav>
            ${heroImage}
          </div>
          <div class="dashboard-header">
            <h1>${heading}</h1>
            ${introBlock}
            ${daysBlock}
            ${actionsBlock}
          </div>
          <div class="dashboard-main">
            <section class="module checklist-module" aria-labelledby="checklist-title">
              <div class="module-heading">
                <h2 id="checklist-title">Контрольный список</h2>
                <p>Отмечайте готовые задачи и добавляйте новые.</p>
              </div>
              ${checklistToolbar}
              <ul class="checklist" id="checklist-list">
                ${tasksMarkup}
              </ul>
              <form id="checklist-form" class="checklist-form">
                <label for="new-task" class="visually-hidden">Новая задача</label>
                <div class="checklist-form__row">
                  <input type="text" id="new-task" name="new-task" placeholder="Добавить задачу" autocomplete="off" required>
                  <button type="submit">Добавить</button>
                </div>
              </form>
            </section>
            <section class="module tools-module" aria-labelledby="tools-title">
              <div class="module-heading">
                <h2 id="tools-title">Инструменты</h2>
                <p>Ваш набор для уверенного планирования.</p>
              </div>
              <div class="tools-grid">
                ${toolsCards}
              </div>
            </section>
            <section class="module budget-module" aria-labelledby="budget-title">
              <div class="module-heading">
                <h2 id="budget-title">Бюджет</h2>
                <p>Визуализация расходов в реальном времени.</p>
              </div>
              <div class="budget-summary">
                <span class="budget-summary__label">Уже запланировано</span>
                <span class="budget-summary__value" id="budget-total-value" aria-live="polite">${totalDisplay}</span>
              </div>
              ${budgetSegments}
              <ul class="budget-list">
                ${budgetList}
              </ul>
              <form id="budget-form" class="budget-form">
                <div class="budget-form__row">
                  <label class="visually-hidden" for="budget-name">Название расхода</label>
                  <input type="text" id="budget-name" name="budget-name" placeholder="Новая статья" autocomplete="off" required>
                </div>
                <div class="budget-form__row">
                  <label class="visually-hidden" for="budget-amount">Сумма расхода</label>
                  <input type="number" id="budget-amount" name="budget-amount" placeholder="Сумма, ₽" min="0" step="1000" required>
                </div>
                <button type="submit" class="budget-submit">Добавить расход</button>
              </form>
            </section>
          </div>
        </section>
      `;
      const modalTriggers = this.appEl.querySelectorAll('[data-open-modal="true"]');
      modalTriggers.forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
          event.preventDefault();
          this.openModal(trigger);
        });
        trigger.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            this.openModal(trigger);
          }
        });
      });
      if (hasProfile) {
        const editQuizButton = document.getElementById("edit-quiz");
        if (editQuizButton) {
          editQuizButton.addEventListener("click", () => {
            this.state.currentStep = 0;
            location.hash = "#/quiz";
          });
        }
      }
      const checklistForm = document.getElementById("checklist-form");
      const newTaskInput = document.getElementById("new-task");
      if (checklistForm && newTaskInput) {
        checklistForm.addEventListener("submit", (event) => {
          event.preventDefault();
          const value = newTaskInput.value.trim();
          if (!value) {
            newTaskInput.focus();
            return;
          }
          this.addTask(value);
        });
      }
      const checklistList = document.getElementById("checklist-list");
      if (checklistList) {
        checklistList.addEventListener("change", (event) => {
          const target = event.target;
          if (target && target.matches('input[type="checkbox"][data-task-id]')) {
            const { taskId } = target.dataset;
            this.toggleTask(taskId, target.checked);
          }
        });
        checklistList.addEventListener("click", (event) => {
          const editBtn = event.target.closest(".checklist-edit");
          if (editBtn) {
            const item = editBtn.closest("[data-task-id]");
            if (item) {
              this.startTaskEdit(item.dataset.taskId);
            }
            return;
          }
          const removeBtn = event.target.closest(".checklist-remove");
          if (removeBtn) {
            const item = removeBtn.closest("[data-task-id]");
            if (item) {
              this.deleteTask(item.dataset.taskId);
            }
            return;
          }
          const cancelBtn = event.target.closest(".checklist-cancel-edit");
          if (cancelBtn) {
            this.cancelTaskEdit();
          }
        });
        checklistList.addEventListener("submit", (event) => {
          if (event.target.matches(".checklist-edit-form")) {
            event.preventDefault();
            const form = event.target;
            const item = form.closest("[data-task-id]");
            if (!item) return;
            const input = form.querySelector('input[name="edit-task"]');
            if (!input) return;
            const value = input.value.trim();
            if (!value) {
              input.focus();
              return;
            }
            this.saveTaskEdit(item.dataset.taskId, value);
          }
        });
        checklistList.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && event.target.closest(".checklist-edit-form")) {
            event.preventDefault();
            this.cancelTaskEdit();
          }
        });
      }
      const completeAllButton = document.getElementById("checklist-complete-all");
      if (completeAllButton) {
        completeAllButton.addEventListener("click", () => {
          const mode = completeAllButton.dataset.mode;
          this.setAllTasks(mode !== "reset");
        });
      }
      const clearCompletedButton = document.getElementById("checklist-clear-completed");
      if (clearCompletedButton) {
        clearCompletedButton.addEventListener("click", () => {
          if (!clearCompletedButton.disabled) {
            this.clearCompletedTasks();
          }
        });
      }
      if (this.state.focusNewTask) {
        requestAnimationFrame(() => {
          const input = document.getElementById("new-task");
          if (input) {
            input.focus();
          }
        });
        this.state.focusNewTask = false;
      }
      if (this.state.editingFocusRequested) {
        requestAnimationFrame(() => {
          const editInput = document.getElementById(`edit-${this.state.editingTaskId}`);
          if (editInput) {
            editInput.focus();
            editInput.select();
          }
        });
        this.state.editingFocusRequested = false;
      }
      const budgetForm = document.getElementById("budget-form");
      if (budgetForm) {
        const nameInput = document.getElementById("budget-name");
        const amountInput = document.getElementById("budget-amount");
        budgetForm.addEventListener("submit", (event) => {
          event.preventDefault();
          const title = nameInput.value.trim();
          const amount = Number(amountInput.value);
          if (!title) {
            nameInput.focus();
            return;
          }
          if (!Number.isFinite(amount) || amount <= 0) {
            amountInput.focus();
            return;
          }
          this.addBudgetItem(title, amount);
        });
      }
      const budgetTotalEl = document.getElementById("budget-total-value");
      if (budgetTotalEl) {
        this.animateNumber(budgetTotalEl, this.state.lastBudgetTotal || 0, budgetTotal);
      }
      this.updateBudgetSegments(budgetTotal);
      this.state.lastBudgetTotal = budgetTotal;
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
    generateId(prefix) {
      return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
    },
    escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },
    formatCurrency(value) {
      return this.currencyFormatter.format(Math.max(0, Math.round(Number(value) || 0)));
    },
    animateNumber(element, from, to, duration = 700) {
      if (!element) return;
      const start = performance.now();
      const diff = to - from;
      const step = (time) => {
        const elapsed = Math.min((time - start) / duration, 1);
        const current = from + diff * elapsed;
        element.textContent = this.formatCurrency(current);
        if (elapsed < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    },
    updateBudgetSegments(total) {
      const track = this.appEl.querySelector("#budget-bar");
      if (!track) return;
      const segments = track.querySelectorAll(".budget-visual__segment");
      segments.forEach((segment) => {
        const amount = Number(segment.dataset.amount) || 0;
        const target = total > 0 ? (amount / total) * 100 : 0;
        requestAnimationFrame(() => {
          segment.style.width = `${target}%`;
        });
      });
    },
    loadTasks() {
      try {
        const raw = localStorage.getItem(this.tasksStorageKey);
        if (!raw) {
          return DEFAULT_CHECKLIST.map((task) => ({ ...task }));
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || !parsed.length) {
          return DEFAULT_CHECKLIST.map((task) => ({ ...task }));
        }
        return parsed
          .filter((task) => task && typeof task.title === "string" && task.title.trim().length)
          .map((task) => ({
            id: task.id || this.generateId("task"),
            title: task.title.trim(),
            completed: Boolean(task.completed)
          }));
      } catch (error) {
        console.error("Не удалось загрузить задачи", error);
        return DEFAULT_CHECKLIST.map((task) => ({ ...task }));
      }
    },
    saveTasks(tasks) {
      try {
        localStorage.setItem(this.tasksStorageKey, JSON.stringify(tasks));
        this.state.tasks = tasks;
      } catch (error) {
        console.error("Не удалось сохранить задачи", error);
      }
    },
    addTask(title) {
      const trimmed = title.trim();
      if (!trimmed) return;
      const newTask = { id: this.generateId("task"), title: trimmed, completed: false };
      const next = [newTask, ...this.state.tasks];
      this.saveTasks(next);
      this.state.editingTaskId = null;
      this.state.editingFocusRequested = false;
      this.state.focusNewTask = true;
      this.renderDashboard();
    },
    toggleTask(taskId, completed) {
      const next = this.state.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: Boolean(completed) } : task
      );
      this.saveTasks(next);
      this.state.focusNewTask = false;
      this.renderDashboard();
    },
    startTaskEdit(taskId) {
      this.state.editingTaskId = taskId;
      this.state.editingFocusRequested = true;
      this.state.focusNewTask = false;
      this.renderDashboard();
    },
    cancelTaskEdit() {
      this.state.editingTaskId = null;
      this.state.editingFocusRequested = false;
      this.state.focusNewTask = true;
      this.renderDashboard();
    },
    saveTaskEdit(taskId, title) {
      const trimmed = title.trim();
      if (!trimmed) {
        this.cancelTaskEdit();
        return;
      }
      const next = this.state.tasks.map((task) =>
        task.id === taskId ? { ...task, title: trimmed } : task
      );
      this.saveTasks(next);
      this.state.editingTaskId = null;
      this.state.editingFocusRequested = false;
      this.state.focusNewTask = true;
      this.renderDashboard();
    },
    deleteTask(taskId) {
      const next = this.state.tasks.filter((task) => task.id !== taskId);
      this.saveTasks(next);
      if (this.state.editingTaskId === taskId) {
        this.state.editingTaskId = null;
        this.state.editingFocusRequested = false;
      }
      this.state.focusNewTask = true;
      this.renderDashboard();
    },
    setAllTasks(completed) {
      const next = this.state.tasks.map((task) => ({ ...task, completed }));
      this.saveTasks(next);
      this.state.focusNewTask = false;
      this.renderDashboard();
    },
    clearCompletedTasks() {
      const next = this.state.tasks.filter((task) => !task.completed);
      this.saveTasks(next);
      if (this.state.editingTaskId && !next.some((task) => task.id === this.state.editingTaskId)) {
        this.state.editingTaskId = null;
        this.state.editingFocusRequested = false;
      }
      this.state.focusNewTask = true;
      this.renderDashboard();
    },
    loadBudgetItems() {
      try {
        const raw = localStorage.getItem(this.budgetStorageKey);
        if (!raw) {
          return DEFAULT_BUDGET_ITEMS.map((item) => ({ ...item }));
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || !parsed.length) {
          return DEFAULT_BUDGET_ITEMS.map((item) => ({ ...item }));
        }
        return parsed
          .filter((item) => item && typeof item.title === "string" && item.title.trim().length)
          .map((item) => ({
            id: item.id || this.generateId("budget"),
            title: item.title.trim(),
            amount: Math.max(0, Math.round(Number(item.amount) || 0))
          }));
      } catch (error) {
        console.error("Не удалось загрузить бюджет", error);
        return DEFAULT_BUDGET_ITEMS.map((item) => ({ ...item }));
      }
    },
    saveBudgetItems(items) {
      try {
        localStorage.setItem(this.budgetStorageKey, JSON.stringify(items));
        this.state.budgetItems = items;
      } catch (error) {
        console.error("Не удалось сохранить бюджет", error);
      }
    },
    addBudgetItem(title, amount) {
      const entry = {
        id: this.generateId("budget"),
        title: title.trim(),
        amount: Math.max(0, Math.round(Number(amount) || 0))
      };
      const next = [...this.state.budgetItems, entry];
      this.saveBudgetItems(next);
      this.renderDashboard();
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
