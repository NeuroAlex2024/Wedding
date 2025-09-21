(function () {
  const storageKey = "wedding_profile_v1";
  const dashboardStorageKey = "wedding_dashboard_v1";
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
  const budgetPalette = ["#e07a8b", "#7ec4cf", "#f6d365", "#cdb4db", "#9a8c98", "#84dcc6"]; 

  const App = {
    storageKey,
    allowedRoutes,
    state: {
      profile: null,
      currentRoute: "#/dashboard",
      currentStep: 0,
      modalOpen: false,
      lastFocused: null,
      dashboardData: null
    },
    init() {
      this.cacheDom();
      this.bindGlobalEvents();
      this.state.profile = this.loadProfile();
      this.state.dashboardData = this.loadDashboardData();
      this.ensureDashboardData();
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
      this.state.dashboardData = this.loadDashboardData();
      this.ensureDashboardData();
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
      this.ensureDashboardData();
      const profile = this.state.profile;
      const hasProfile = Boolean(profile);
      const dashboardData = this.state.dashboardData || { tasks: [], budgetItems: [] };
      const tasks = Array.isArray(dashboardData.tasks) ? dashboardData.tasks : [];
      const budgetItems = Array.isArray(dashboardData.budgetItems) ? dashboardData.budgetItems : [];
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
          <img src="https://images.unsplash.com/photo-1542379510-1026e928ed4f?q=80&w=3118&auto=format&fit=crop&ixlib=rb-4.1.0&ix
id=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Счастливая пара на свадьбе">
        </div>
      `;
      const daysBlock = hasProfile ? this.renderCountdown(profile) : "";
      const navBlock = `
        <nav class="dashboard-nav" aria-label="Основные разделы">
          ${DASHBOARD_NAV_ITEMS.map(
            (item) => `
              <button type="button" class="nav-chip" data-title="${item.label}" data-nav="${item.id}">
                <span>${item.label}</span>
              </button>
            `
          ).join("")}
        </nav>
      `;
      const toolsBlock = `
        <section class="module-card tools-module">
          <header class="module-header">
            <h2>Инструменты</h2>
            <p class="module-caption">Все ключевые сервисы в одном месте.</p>
          </header>
          <div class="tools-grid">
            ${TOOL_MODULE_ITEMS.map(
              (item) => `
                <button type="button" class="tool-card" data-title="${item.label}">
                  <span class="tool-icon" aria-hidden="true">${item.icon || ""}</span>
                  <span class="tool-label">${item.label}</span>
                </button>
              `
            ).join("")}
          </div>
        </section>
      `;
      const completedTasks = tasks.filter((task) => task.done).length;
      const checklistItems = tasks.length
        ? tasks
            .map(
              (task) => `
                <label class="checklist-item ${task.done ? "is-done" : ""}" data-task-id="${task.id}">
                  <input type="checkbox" data-task-id="${task.id}" ${task.done ? "checked" : ""}>
                  <span>${task.text}</span>
                </label>
              `
            )
            .join("")
        : `<p class="module-empty">Добавьте первую задачу, чтобы ничего не забыть.</p>`;
      const checklistBlock = `
        <section class="module-card checklist-module">
          <header class="module-header">
            <div>
              <h2>Контрольный список</h2>
              <p class="module-caption">${completedTasks} из ${tasks.length || 0} задач выполнено</p>
            </div>
          </header>
          <div class="checklist-items" id="checklist-items">
            ${checklistItems}
          </div>
          <form id="checklist-form" class="checklist-form" autocomplete="off">
            <input id="checklist-input" type="text" placeholder="Добавить задачу" aria-label="Добавить новую задачу" required>
            <button type="submit">Добавить</button>
          </form>
        </section>
      `;
      const totalBudget = budgetItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const budgetBars = budgetItems.length
        ? budgetItems
            .map((item, index) => {
              const amount = Number(item.amount) || 0;
              const percent = totalBudget ? Math.min(100, (amount / totalBudget) * 100) : 0;
              const color = budgetPalette[index % budgetPalette.length];
              return `
                <article class="budget-item" data-budget-id="${item.id}">
                  <header class="budget-item-header">
                    <span class="budget-item-title">${item.title}</span>
                    <span class="budget-item-amount">${this.formatCurrency(amount)}</span>
                  </header>
                  <div class="budget-bar">
                    <div class="budget-bar-fill" data-percent="${percent.toFixed(2)}" style="--bar-color: ${color};"></div>
                  </div>
                </article>
              `;
            })
            .join("")
        : `<p class="module-empty">Добавьте статьи расходов, чтобы увидеть распределение бюджета.</p>`;
      const budgetBlock = `
        <section class="module-card budget-module">
          <header class="module-header">
            <div>
              <h2>Бюджет</h2>
              <p class="module-caption">Всего запланировано: ${this.formatCurrency(totalBudget)}</p>
            </div>
          </header>
          <div class="budget-visual" id="budget-visual">
            ${budgetBars}
          </div>
          <form id="budget-form" class="budget-form" autocomplete="off">
            <div class="budget-form-fields">
              <input id="budget-name" type="text" placeholder="Название статьи" aria-label="Название статьи" required>
              <input id="budget-amount" type="number" placeholder="Сумма, ₽" aria-label="Сумма" min="0" step="1000" required>
            </div>
            <button type="submit">Добавить</button>
          </form>
        </section>
      `;
      const actionsBlock = hasProfile
        ? `<div class="actions" style="margin-top:2rem;">
            <button type="button" id="edit-quiz">Редактировать ответы теста</button>
          </div>`
        : "";
      const countdownBlock = daysBlock ? `<div class="dashboard-countdown">${daysBlock}</div>` : "";
      this.appEl.innerHTML = `
        <section class="card dashboard-shell">
          <header class="dashboard-header">
            <div class="dashboard-heading">
              <h1>${heading}</h1>
              ${introBlock}
            </div>
            ${countdownBlock}
          </header>
          ${navBlock}
          ${heroImage}
          <div class="dashboard-modules">
            ${checklistBlock}
            ${toolsBlock}
            ${budgetBlock}
          </div>
          ${actionsBlock}
        </section>
      `;
      this.bindDashboardEvents(hasProfile);
    },
    bindDashboardEvents(hasProfile) {
      const requireProfile = () => {
        this.state.currentStep = 0;
        this.ensureProfile();
        location.hash = "#/quiz";
      };
      const nav = this.appEl.querySelector(".dashboard-nav");
      if (nav) {
        nav.addEventListener("click", (event) => {
          const target = event.target.closest("[data-title]");
          if (!target) return;
          event.preventDefault();
          if (!hasProfile) {
            requireProfile();
            return;
          }
          this.openModal({ dataset: { title: target.dataset.title } });
        });
      }
      const toolButtons = this.appEl.querySelectorAll(".tool-card");
      toolButtons.forEach((button) => {
        button.addEventListener("click", () => {
          if (!hasProfile) {
            requireProfile();
            return;
          }
          this.openModal({ dataset: { title: button.dataset.title } });
        });
      });
      const checklistContainer = this.appEl.querySelector("#checklist-items");
      if (checklistContainer) {
        checklistContainer.addEventListener("change", (event) => {
          const checkbox = event.target.closest("input[type='checkbox']");
          if (!checkbox) return;
          const taskId = checkbox.dataset.taskId;
          if (!taskId) return;
          const currentTasks = Array.isArray(this.state.dashboardData?.tasks)
            ? this.state.dashboardData.tasks
            : [];
          const nextTasks = currentTasks.map((task) =>
            task.id === taskId ? { ...task, done: checkbox.checked } : task
          );
          this.updateDashboardData({ tasks: nextTasks });
          this.renderDashboard();
        });
      }
      const checklistForm = this.appEl.querySelector("#checklist-form");
      if (checklistForm) {
        checklistForm.addEventListener("submit", (event) => {
          event.preventDefault();
          const input = checklistForm.querySelector("#checklist-input");
          if (!input) return;
          const value = input.value.trim();
          if (!value) {
            input.focus();
            return;
          }
          const currentTasks = Array.isArray(this.state.dashboardData?.tasks)
            ? this.state.dashboardData.tasks
            : [];
          const nextTasks = [
            ...currentTasks,
            { id: this.createId("task"), text: value, done: false }
          ];
          this.updateDashboardData({ tasks: nextTasks });
          this.renderDashboard();
        });
      }
      const budgetForm = this.appEl.querySelector("#budget-form");
      if (budgetForm) {
        budgetForm.addEventListener("submit", (event) => {
          event.preventDefault();
          const nameInput = budgetForm.querySelector("#budget-name");
          const amountInput = budgetForm.querySelector("#budget-amount");
          if (!nameInput || !amountInput) return;
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
          const currentItems = Array.isArray(this.state.dashboardData?.budgetItems)
            ? this.state.dashboardData.budgetItems
            : [];
          const nextItems = [
            ...currentItems,
            { id: this.createId("budget"), title, amount }
          ];
          this.updateDashboardData({ budgetItems: nextItems });
          this.renderDashboard();
        });
      }
      const editQuiz = this.appEl.querySelector("#edit-quiz");
      if (hasProfile && editQuiz) {
        editQuiz.addEventListener("click", () => {
          this.state.currentStep = 0;
          location.hash = "#/quiz";
        });
      }
      this.animateBudgetBars();
    },
    animateBudgetBars() {
      const bars = this.appEl.querySelectorAll(".budget-bar-fill");
      requestAnimationFrame(() => {
        bars.forEach((bar) => {
          const target = Number(bar.dataset.percent) || 0;
          bar.style.width = `${target}%`;
        });
      });
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
    loadDashboardData() {
      try {
        const raw = localStorage.getItem(dashboardStorageKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
          return null;
        }
        return parsed;
      } catch (error) {
        console.error("Не удалось загрузить данные дашборда", error);
        return null;
      }
    },
    saveDashboardData(data) {
      try {
        localStorage.setItem(dashboardStorageKey, JSON.stringify(data));
        this.state.dashboardData = data;
      } catch (error) {
        console.error("Не удалось сохранить данные дашборда", error);
      }
    },
    updateDashboardData(patch) {
      const current = this.state.dashboardData || { tasks: [], budgetItems: [] };
      const next = {
        ...current,
        ...patch
      };
      this.saveDashboardData(next);
    },
    ensureDashboardData() {
      let data = this.state.dashboardData;
      let changed = false;
      if (!data || typeof data !== "object") {
        data = {
          tasks: DEFAULT_CHECKLIST_TASKS.map((task) => ({ ...task })),
          budgetItems: DEFAULT_BUDGET_ITEMS.map((item) => ({ ...item }))
        };
        changed = true;
      } else {
        const currentTasks = Array.isArray(data.tasks) ? data.tasks : [];
        const normalizedTasks = (currentTasks.length
          ? currentTasks
          : DEFAULT_CHECKLIST_TASKS
        ).map((task, index) => {
          const normalized = {
            id: task.id || this.createId(`task-${index}`),
            text: task.text || task.title || `Задача ${index + 1}`,
            done: Boolean(task.done)
          };
          if (
            normalized.id !== task.id ||
            normalized.text !== task.text ||
            normalized.done !== Boolean(task.done)
          ) {
            changed = true;
          }
          return normalized;
        });
        const currentBudget = Array.isArray(data.budgetItems) ? data.budgetItems : [];
        const normalizedBudget = (currentBudget.length
          ? currentBudget
          : DEFAULT_BUDGET_ITEMS
        ).map((item, index) => {
          const amount = Number(item.amount) || 0;
          const normalized = {
            id: item.id || this.createId(`budget-${index}`),
            title: item.title || item.name || `Статья ${index + 1}`,
            amount
          };
          if (
            normalized.id !== item.id ||
            normalized.title !== (item.title || item.name) ||
            amount !== Number(item.amount || 0)
          ) {
            changed = true;
          }
          return normalized;
        });
        data = {
          tasks: normalizedTasks,
          budgetItems: normalizedBudget
        };
      }
      if (changed) {
        this.saveDashboardData(data);
      } else {
        this.state.dashboardData = data;
      }
    },
    formatCurrency(value) {
      const amount = Number(value) || 0;
      return `${new Intl.NumberFormat("ru-RU").format(Math.max(0, Math.round(amount)))} ₽`;
    },
    createId(prefix = "id") {
      return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
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
