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

  const currencyFormatter = new Intl.NumberFormat("ru-RU");
  const BUDGET_COLORS = ["#E07A8B", "#F4A259", "#5B8E7D", "#7A77B9", "#F1BF98", "#74D3AE"];
  const PROFILE_SCHEMA_VERSION = 2;

  const App = {
    storageKey,
    allowedRoutes,
    state: {
      profile: null,
      currentRoute: "#/dashboard",
      currentStep: 0,
      modalOpen: false,
      lastFocused: null,
      lastBudgetTotal: 0,
      budgetEditingId: null,
      budgetEditingDraft: null,
      isChecklistExpanded: false,
      checklistEditingId: null,
      checklistEditingDraft: null,
      checklistFocusTrapElement: null,
      checklistFocusTrapHandler: null,
      checklistLastFocused: null,
      checklistLastFocusedSelector: null,
      checklistFoldersCollapse: {},
      checklistFolderEditingId: null,
      checklistFolderEditingDraft: null,
      checklistDragTaskId: null,
      marketplaceCategoryId: Array.isArray(CONTRACTOR_MARKETPLACE) && CONTRACTOR_MARKETPLACE.length
        ? CONTRACTOR_MARKETPLACE[0].id
        : null,
      marketplaceFavorites: [],
      pendingMarketplaceFocus: null
    },
    init() {
      this.cacheDom();
      this.bindGlobalEvents();
      this.state.profile = this.loadProfile();
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
        if (event.key === "Escape") {
          if (this.state.modalOpen) {
            this.closeModal();
            return;
          }
          if (this.state.isChecklistExpanded) {
            this.collapseChecklist();
          }
        }
      });
      this.modalOverlay.addEventListener("click", (event) => {
        if (event.target === this.modalOverlay) {
          this.closeModal();
        }
      });
      this.modalCloseBtn.addEventListener("click", () => this.closeModal());
      this.handleBudgetResize = () => {
        const totalEl = document.getElementById("budget-total");
        if (totalEl) {
          this.fitBudgetTotalText(totalEl);
        }
      };
      window.addEventListener("resize", this.handleBudgetResize);
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
      this.teardownChecklistFocusTrap();
      document.body.classList.remove("checklist-expanded");
      if (this.state.isChecklistExpanded) {
        this.state.isChecklistExpanded = false;
        this.resetChecklistEditing();
      }
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
      this.updateProfile({ updatedAt: now, quizCompleted: true });
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
        schemaVersion: PROFILE_SCHEMA_VERSION,
        weddingId: now.toString(),
        vibe: [],
        style: "",
        venueBooked: false,
        city: "",
        year: currentYear,
        month: new Date().getMonth() + 1,
        budgetRange: "",
        guests: null,
        quizCompleted: false,
        createdAt: now,
        updatedAt: now,
        checklist: DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item })),
        checklistFolders: DEFAULT_CHECKLIST_FOLDERS.map((item) => ({ ...item })),
        budgetEntries: DEFAULT_BUDGET_ENTRIES.map((item) => ({ ...item }))
      };
      this.saveProfile(profile);
    },
    ensureDashboardData() {
      const profile = this.state.profile;
      if (!profile) return;
      let updated = false;
      const timestamp = Date.now();
      if (!Array.isArray(profile.checklist) || profile.checklist.length === 0) {
        profile.checklist = DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item }));
        updated = true;
      }
      if (!Array.isArray(profile.checklistFolders)) {
        profile.checklistFolders = DEFAULT_CHECKLIST_FOLDERS.map((item) => ({ ...item }));
        updated = true;
      }
      const normalized = this.normalizeChecklistData(profile);
      if (normalized.updated) {
        profile.checklist = normalized.checklist;
        profile.checklistFolders = normalized.checklistFolders;
        updated = true;
      }
      if (!Array.isArray(profile.budgetEntries) || profile.budgetEntries.length === 0) {
        profile.budgetEntries = DEFAULT_BUDGET_ENTRIES.map((item) => ({ ...item }));
        updated = true;
      } else if (Array.isArray(profile.budgetEntries)) {
        const sanitizedBudget = profile.budgetEntries
          .filter((entry) => entry && typeof entry === "object")
          .map((entry, index) => {
            const amountValue = Number(entry.amount);
            const amount = Number.isFinite(amountValue) ? Math.max(0, Math.round(amountValue)) : 0;
            const id = typeof entry.id === "string" && entry.id.trim().length
              ? entry.id
              : `budget-${timestamp}-${index}`;
            const title = typeof entry.title === "string" ? entry.title : String(entry.title || "");
            if (entry.amount !== amount || entry.id !== id || entry.title !== title) {
              updated = true;
            }
            return {
              ...entry,
              id,
              amount,
              title
            };
          });
        if (sanitizedBudget.length !== profile.budgetEntries.length) {
          updated = true;
        }
        profile.budgetEntries = sanitizedBudget;
      }
      if (typeof profile.quizCompleted !== "boolean") {
        profile.quizCompleted = Boolean(
          (profile.groomName && profile.brideName && profile.guests) || profile.quizCompleted
        );
        updated = true;
      }
      if (updated) {
        this.saveProfile({ ...profile });
      }
    },
    renderDashboard() {
      this.ensureProfile();
      this.ensureDashboardData();
      this.teardownChecklistFocusTrap();
      const profile = this.state.profile;
      const hasProfile = Boolean(profile);
      const quizCompleted = Boolean(profile && profile.quizCompleted);
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
      if (hasProfile && quizCompleted && profile.guests) {
        summaryItems.push(`Гостей: ${profile.guests}`);
      }
      if (hasProfile && profile.budgetRange) {
        summaryItems.push(`Бюджет: ${profile.budgetRange}`);
      }
      const summaryLine = summaryItems.length
        ? `<div class="summary-line">${summaryItems.map((item) => `<span>${item}</span>`).join("")}</div>`
        : "";
      const summaryFallback = "";
      const introBlock = hasProfile ? summaryLine || summaryFallback : "";
      const heading = hasProfile
        ? `${profile.groomName || "Жених"} + ${profile.brideName || "Невеста"}, добро пожаловать!`
        : "Планирование свадьбы без стресса";
      const headingSubtext = hasProfile
        ? `<p class="dashboard-subtitle">Здесь вы можете собрать все необходимое для свадьбы мечты.</p>`
        : "";
      const heroImage = `
        <div class="dashboard-hero-image">
          <img src="https://images.unsplash.com/photo-1542379510-1026e928ed4f?q=80&w=3118&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Счастливая пара на свадьбе">
        </div>
      `;
      const daysBlock = hasProfile ? this.renderCountdown(profile) : "";
      const navItems = DASHBOARD_NAV_ITEMS.map((item) => `
        <button type="button" class="dashboard-nav__item" data-modal-target="${item.id}" data-title="${item.title}">
          ${item.title}
        </button>
      `).join("");
      const toolsCards = DASHBOARD_TOOL_ITEMS.map((item) => {
        const extraAttributes = item.id === "tools-test" ? ' data-tool-type="quiz"' : "";
        return `
        <button type="button" class="tool-card" data-modal-target="${item.id}" data-title="${item.title}"${extraAttributes}>
          <span class="tool-card__title">${item.title}</span>
          <span class="tool-card__description">${item.description}</span>
        </button>
      `;
      }).join("");
      const isChecklistExpanded = Boolean(this.state.isChecklistExpanded);
      const checklistOverlay = isChecklistExpanded
        ? '<button type="button" class="checklist-overlay" data-action="collapse-checklist" aria-label="Свернуть чек лист"></button>'
        : "";
      const checklistContainerClasses = [
        "dashboard-module",
        "checklist",
        isChecklistExpanded ? "checklist--expanded" : ""
      ]
        .filter(Boolean)
        .join(" ");
      const modulesClasses = [
        "dashboard-modules",
        isChecklistExpanded ? "dashboard-modules--checklist-expanded" : ""
      ]
        .filter(Boolean)
        .join(" ");
      const expandLabel = isChecklistExpanded ? "Свернуть чек лист" : "Развернуть чек лист";
      const expandIcon = isChecklistExpanded ? "✕" : "⤢";
      const backgroundInertAttributes = isChecklistExpanded ? ' aria-hidden="true" tabindex="-1"' : "";
      const checklistEditingId = this.state.checklistEditingId;
      const checklistDraft = this.state.checklistEditingDraft || {};
      const { tasks: checklistTasks, folders: checklistFolders } = this.getChecklistCollections(profile);
      this.syncChecklistFolderCollapse(checklistFolders);
      const checklistItems = this.renderChecklistItems(checklistTasks, checklistFolders);
      const budgetEntries = Array.isArray(profile?.budgetEntries) ? profile.budgetEntries : [];
      const decoratedBudgetEntries = budgetEntries.map((entry, index) => {
        const amountValue = Number(entry.amount);
        const amount = Number.isFinite(amountValue) ? Math.max(0, Math.round(amountValue)) : 0;
        const color = BUDGET_COLORS[index % BUDGET_COLORS.length];
        return {
          ...entry,
          color,
          amount
        };
      });
      const totalBudget = decoratedBudgetEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const previousTotal = this.state.lastBudgetTotal || 0;
      this.state.lastBudgetTotal = totalBudget;
      const positiveEntries = decoratedBudgetEntries.filter((entry) => Number(entry.amount) > 0);
      let startAngle = 0;
      const segments = positiveEntries.map((entry, index) => {
        const fraction = totalBudget > 0 ? Number(entry.amount) / totalBudget : 0;
        const endAngle = index === positiveEntries.length - 1 ? 360 : startAngle + fraction * 360;
        const segment = `${entry.color} ${startAngle.toFixed(2)}deg ${endAngle.toFixed(2)}deg`;
        startAngle = endAngle;
        return segment;
      });
      const chartBackground = segments.length
        ? `conic-gradient(from -90deg, ${segments.join(", ")})`
        : "conic-gradient(from -90deg, rgba(224, 122, 139, 0.25) 0deg 360deg)";
      const budgetVisual = decoratedBudgetEntries.length
        ? decoratedBudgetEntries
            .map((entry, index) => {
              const amount = Number(entry.amount || 0);
              const displayId = `budget-amount-${entry.id || index}`;
              const isEditing = this.state.budgetEditingId === entry.id;
              if (isEditing) {
                const draft = this.state.budgetEditingDraft || {
                  title: entry.title || "",
                  amount: String(amount ?? "")
                };
                return `
                  <div class="budget-visual__item budget-visual__item--editing" data-entry-id="${this.escapeHtml(entry.id)}">
                    <form class="budget-visual__edit" data-entry-id="${this.escapeHtml(entry.id)}">
                      <div class="budget-visual__edit-fields">
                        <span class="budget-visual__dot" style="--dot-color: ${entry.color}" aria-hidden="true"></span>
                        <div class="budget-visual__field">
                          <label for="budget-edit-title-${this.escapeHtml(entry.id)}" class="sr-only">Название статьи</label>
                          <input id="budget-edit-title-${this.escapeHtml(entry.id)}" type="text" name="title" value="${this.escapeHtml(draft.title || "")}" required>
                        </div>
                        <div class="budget-visual__field">
                          <label for="budget-edit-amount-${this.escapeHtml(entry.id)}" class="sr-only">Сумма</label>
                          <input id="budget-edit-amount-${this.escapeHtml(entry.id)}" type="number" name="amount" value="${this.escapeHtml(String(draft.amount ?? ""))}" min="0" step="1000" required>
                        </div>
                      </div>
                      <div class="budget-visual__edit-actions">
                        <button type="submit">Сохранить</button>
                        <button type="button" class="secondary" data-action="cancel-edit">Отменить</button>
                      </div>
                    </form>
                  </div>
                `;
              }
              return `
                <div class="budget-visual__item" data-entry-id="${this.escapeHtml(entry.id)}">
                  <div class="budget-visual__info">
                    <span class="budget-visual__dot" style="--dot-color: ${entry.color}" aria-hidden="true"></span>
                    <span class="budget-visual__title">${this.escapeHtml(entry.title || "")}</span>
                    <span class="budget-visual__amount" id="${this.escapeHtml(displayId)}" data-amount="${amount}">${this.formatCurrency(amount)}</span>
                    <div class="budget-visual__actions">
                      <button type="button" class="budget-visual__action" data-action="edit" data-entry-id="${this.escapeHtml(entry.id)}" aria-label="Редактировать статью">
                        <span aria-hidden="true">✏️</span>
                        <span class="sr-only">Изменить</span>
                      </button>
                      <button type="button" class="budget-visual__action budget-visual__action--danger" data-action="delete" data-entry-id="${this.escapeHtml(entry.id)}" aria-label="Удалить статью">
                        <span aria-hidden="true">🗑️</span>
                        <span class="sr-only">Удалить</span>
                      </button>
                    </div>
                  </div>
                  <div class="budget-visual__track">
                    <div class="budget-visual__bar" data-value="${amount}" data-total="${totalBudget}" style="--bar-color: ${entry.color}"></div>
                  </div>
                </div>
              `;
            })
            .join("")
        : '<p class="budget-empty">Добавьте статьи, чтобы увидеть распределение бюджета.</p>';
      const marketplaceModule = this.renderMarketplaceModule(backgroundInertAttributes);
      this.appEl.innerHTML = `
        <section class="card dashboard">
          <nav class="dashboard-nav" aria-label="Основные разделы">
            ${navItems}
          </nav>
          ${heroImage}
          <header class="dashboard-header">
            <h1>${heading}</h1>
            ${headingSubtext}
            ${introBlock}
            ${daysBlock}
          </header>
          <div class="${modulesClasses}">
            ${checklistOverlay}
            <section class="${checklistContainerClasses}" data-area="checklist" aria-labelledby="checklist-title" data-expanded="${isChecklistExpanded}">
              <div class="module-header">
                <h2 id="checklist-title">Чек лист</h2>
                <div class="module-header__actions">
                  <button type="button" class="module-header__icon-button" data-action="create-checklist-folder" aria-label="Создать папку" title="Создать папку">
                    <span aria-hidden="true">📁</span>
                  </button>
                  <button type="button" class="module-header__icon-button" data-action="toggle-checklist-expand" aria-label="${expandLabel}" aria-expanded="${isChecklistExpanded}">
                    <span aria-hidden="true">${expandIcon}</span>
                  </button>
                </div>
              </div>
              <ul class="checklist-items">
                ${checklistItems}
              </ul>
              <form id="checklist-form" class="checklist-form" data-prevent-expand>
                <label for="checklist-input" class="sr-only">Новая задача</label>
                <input id="checklist-input" type="text" name="task" placeholder="Добавить задачу" autocomplete="off" required>
                <button type="submit">Добавить</button>
              </form>
            </section>
            <section class="dashboard-module tools" data-area="tools" aria-labelledby="tools-title"${backgroundInertAttributes}>
              <div class="module-header">
                <h2 id="tools-title">Инструменты</h2>
              </div>
              <div class="tools-grid">
                ${toolsCards}
              </div>
            </section>
            <section class="dashboard-module budget" data-area="budget" aria-labelledby="budget-title"${backgroundInertAttributes}>
              <div class="module-header">
                <h2 id="budget-title">Бюджет</h2>
              </div>
              <div class="budget-summary">
                <div class="budget-summary__chart" role="img" aria-label="Итоговый бюджет: ${this.formatCurrency(totalBudget)}" style="--budget-chart-bg: ${chartBackground};">
                  <div class="budget-summary__total">
                    <span class="budget-summary__value" id="budget-total" data-previous="${previousTotal}">${this.formatCurrency(totalBudget)}</span>
                  </div>
                </div>
              </div>
              <div class="budget-visual">
                ${budgetVisual}
              </div>
              <form id="budget-form" class="budget-form">
                <div class="budget-form__fields">
                  <label for="budget-title" class="sr-only">Название статьи расходов</label>
                  <input id="budget-title" type="text" name="title" placeholder="Название" required>
                  <label for="budget-amount" class="sr-only">Сумма</label>
                  <input id="budget-amount" type="number" name="amount" placeholder="Сумма" min="0" step="1000" required>
                </div>
                <button type="submit">Добавить расход</button>
              </form>
            </section>
            ${marketplaceModule}
          </div>
        </section>
      `;
      document.body.classList.toggle("checklist-expanded", this.state.isChecklistExpanded);
      this.bindDashboardEvents(previousTotal, totalBudget);
    },
    renderMarketplaceModule(backgroundInertAttributes = "") {
      const categories = Array.isArray(CONTRACTOR_MARKETPLACE) ? CONTRACTOR_MARKETPLACE : [];
      if (!categories.length) {
        return "";
      }
      let selectedId = this.state.marketplaceCategoryId;
      const favoritesEntries = this.getMarketplaceFavoriteContractors();
      const hasSelectedCategory = categories.some((category) => category && category.id === selectedId);
      if (selectedId !== "favorites" && (!selectedId || !hasSelectedCategory)) {
        selectedId = categories[0]?.id || null;
        this.state.marketplaceCategoryId = selectedId;
      }
      const isFavoritesSelected = selectedId === "favorites";
      const favoritesMarkup = (() => {
        const favoritesCountFormatted = currencyFormatter.format(favoritesEntries.length);
        const isActive = isFavoritesSelected;
        return `
          <button type="button" class="marketplace-category marketplace-category--favorites${isActive ? " marketplace-category--active" : ""}" data-category-id="favorites" aria-pressed="${isActive}" aria-controls="marketplace-panel-favorites">
            <span class="marketplace-category__label">
              <span class="marketplace-category__icon" aria-hidden="true">❤</span>
              <span class="marketplace-category__name">Избранное</span>
            </span>
            <span class="marketplace-category__count">${this.escapeHtml(favoritesCountFormatted)}</span>
          </button>
        `;
      })();
      const categoriesMarkup = [
        favoritesMarkup,
        ...categories.map((category) => {
          if (!category || typeof category !== "object") {
            return "";
          }
          const rawId = typeof category.id === "string" ? category.id : String(category.id || "");
          if (!rawId) {
            return "";
          }
          const safeId = this.escapeHtml(rawId);
          const title = this.escapeHtml(category.title || "");
          const contractorCount = Array.isArray(category.contractors) ? category.contractors.length : 0;
          const formattedCount = currencyFormatter.format(contractorCount);
          const isActive = category.id === selectedId;
          return `
            <button type="button" class="marketplace-category${isActive ? " marketplace-category--active" : ""}" data-category-id="${safeId}" aria-pressed="${isActive}" aria-controls="marketplace-panel-${safeId}">
              <span class="marketplace-category__label">
                <span class="marketplace-category__name">${title}</span>
              </span>
              <span class="marketplace-category__count">${this.escapeHtml(formattedCount)}</span>
            </button>
          `;
        })
      ]
        .filter(Boolean)
        .join("");
      let selectedCategory = null;
      if (!isFavoritesSelected) {
        selectedCategory = categories.find((category) => category && category.id === selectedId) || categories[0];
        if (selectedCategory && selectedCategory.id !== selectedId) {
          selectedId = selectedCategory.id;
          this.state.marketplaceCategoryId = selectedId;
        }
      }
      const selectedSafeId = this.escapeHtml(isFavoritesSelected ? "favorites" : selectedCategory?.id || "all");
      let cardsMarkup = "";
      if (isFavoritesSelected) {
        cardsMarkup = favoritesEntries.length
          ? favoritesEntries
              .map(({ contractor, category }, index) => this.renderMarketplaceCard(contractor, category, index))
              .join("")
          : '<p class="marketplace-empty marketplace-empty--favorites">Добавляйте подрядчиков в избранное, нажав на сердечко в карточке.</p>';
      } else if (selectedCategory && Array.isArray(selectedCategory.contractors)) {
        const subset = this.getMarketplaceRandomSubset(selectedCategory.contractors);
        cardsMarkup = subset.length
          ? subset.map((contractor, index) => this.renderMarketplaceCard(contractor, selectedCategory, index)).join("")
          : '<p class="marketplace-empty">Скоро добавим подрядчиков в эту категорию.</p>';
      } else {
        cardsMarkup = '<p class="marketplace-empty">Скоро добавим подрядчиков в эту категорию.</p>';
      }
      return `
        <section class="dashboard-module marketplace" data-area="marketplace" aria-labelledby="marketplace-title"${backgroundInertAttributes}>
          <div class="module-header">
            <h2 id="marketplace-title">Маркетплейс подрядчиков</h2>
            <p>Выбирайте проверенных специалистов для свадьбы мечты.</p>
          </div>
          <div class="marketplace-content">
            <nav class="marketplace-categories" aria-label="Категории подрядчиков">
              ${categoriesMarkup}
            </nav>
            <div class="marketplace-cards" role="list" id="marketplace-panel-${selectedSafeId}">
              ${cardsMarkup}
            </div>
          </div>
        </section>
      `;
    },
    renderMarketplaceCard(contractor, category, index) {
      if (!contractor || typeof contractor !== "object") {
        return "";
      }
      const fallbackName = `Подрядчик ${index + 1}`;
      const rawName = typeof contractor.name === "string" && contractor.name.trim().length
        ? contractor.name.trim()
        : fallbackName;
      const safeName = this.escapeHtml(rawName);
      const vendorId = typeof contractor.id === "string" && contractor.id.trim().length
        ? contractor.id.trim()
        : rawName;
      const safeVendorId = this.escapeHtml(vendorId);
      const isFavorite = this.isMarketplaceFavorite(vendorId);
      const favoriteLabel = isFavorite ? "Убрать из избранного" : "Добавить в избранное";
      const priceValue = Number(contractor.price);
      const price = Number.isFinite(priceValue) ? Math.max(0, Math.round(priceValue)) : 0;
      const ratingValue = Number.parseFloat(contractor.rating);
      const rating = Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : "5.0";
      const ratingLabel = `Средняя оценка ${rating} из 5`;
      const reviewsValue = Number(contractor.reviews);
      const reviews = Number.isFinite(reviewsValue) ? Math.max(0, Math.round(reviewsValue)) : 0;
      const reviewsText = `${currencyFormatter.format(reviews)} оценок`;
      const location = typeof contractor.location === "string" && contractor.location.trim().length
        ? `<p class="marketplace-card__location">${this.escapeHtml(contractor.location)}</p>`
        : "";
      const description = typeof contractor.tagline === "string" && contractor.tagline.trim().length
        ? `<p class="marketplace-card__description">${this.escapeHtml(contractor.tagline)}</p>`
        : "";
      const imageUrl = typeof contractor.image === "string" && contractor.image
        ? contractor.image
        : (Array.isArray(MARKETPLACE_IMAGES) && MARKETPLACE_IMAGES.length ? MARKETPLACE_IMAGES[0] : "");
      const altBase = typeof contractor.imageAlt === "string" && contractor.imageAlt.trim().length
        ? contractor.imageAlt
        : `${rawName}${category?.title ? ` — ${category.title}` : ""}`;
      const altText = this.escapeHtml(altBase);
      return `
        <article class="marketplace-card" role="listitem">
          <div class="marketplace-card__image">
            <img src="${this.escapeHtml(imageUrl)}" alt="${altText}">
            <button type="button" class="marketplace-card__favorite${isFavorite ? " is-active" : ""}" data-action="marketplace-favorite" data-vendor-id="${safeVendorId}" aria-pressed="${isFavorite}" title="${this.escapeHtml(favoriteLabel)}">
              <span aria-hidden="true">${isFavorite ? "❤️" : "♡"}</span>
              <span class="sr-only">${this.escapeHtml(favoriteLabel)}</span>
            </button>
          </div>
          <div class="marketplace-card__info">
            <p class="marketplace-card__price"><strong>${this.formatCurrency(price)}</strong></p>
            <h3 class="marketplace-card__title">${safeName}</h3>
            <p class="marketplace-card__meta">
              <span class="marketplace-card__rating" aria-label="${this.escapeHtml(ratingLabel)}">⭐${rating}</span>
              <span class="marketplace-card__reviews">${this.escapeHtml(reviewsText)}</span>
            </p>
            ${location}
            ${description}
            <div class="marketplace-card__actions">
              <button type="button" class="marketplace-card__action" data-action="marketplace-phone" data-vendor-name="${this.escapeHtml(rawName)}" data-vendor-id="${safeVendorId}">Показать телефон</button>
            </div>
          </div>
        </article>
      `;
    },
    getMarketplaceFavoriteContractors() {
      const favorites = Array.isArray(this.state.marketplaceFavorites) ? this.state.marketplaceFavorites : [];
      if (!favorites.length) {
        return [];
      }
      return favorites
        .map((vendorId) => this.getMarketplaceVendorById(vendorId))
        .filter((entry) => entry && entry.contractor && entry.category);
    },
    getMarketplaceVendorById(vendorId) {
      const id = typeof vendorId === "string" ? vendorId.trim() : "";
      if (!id || !Array.isArray(CONTRACTOR_MARKETPLACE)) {
        return null;
      }
      for (const category of CONTRACTOR_MARKETPLACE) {
        if (!category || !Array.isArray(category.contractors)) {
          continue;
        }
        for (const contractor of category.contractors) {
          if (!contractor || typeof contractor !== "object") {
            continue;
          }
          const contractorId = typeof contractor.id === "string" ? contractor.id.trim() : "";
          if (contractorId && contractorId === id) {
            return { contractor, category };
          }
        }
      }
      return null;
    },
    getMarketplaceRandomSubset(contractors) {
      if (!Array.isArray(contractors)) {
        return [];
      }
      const normalized = contractors.filter((item) => item && typeof item === "object");
      if (!normalized.length) {
        return [];
      }
      if (normalized.length <= 3) {
        return normalized.slice();
      }
      const minCount = Math.min(3, normalized.length);
      const maxCount = Math.min(6, normalized.length);
      const count = this.getRandomInt(minCount, maxCount);
      return this.getRandomSample(normalized, count);
    },
    getRandomInt(min, max) {
      const minValue = Math.ceil(Number(min));
      const maxValue = Math.floor(Number(max));
      if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
        return 0;
      }
      if (maxValue < minValue) {
        return minValue;
      }
      return Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
    },
    getRandomSample(items, count) {
      if (!Array.isArray(items)) {
        return [];
      }
      const maxCount = Math.max(0, Math.min(Number(count), items.length));
      if (!maxCount) {
        return [];
      }
      const copy = items.slice();
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy.slice(0, maxCount);
    },
    isMarketplaceFavorite(vendorId) {
      const id = typeof vendorId === "string" ? vendorId.trim() : "";
      if (!id) {
        return false;
      }
      const favorites = Array.isArray(this.state.marketplaceFavorites) ? this.state.marketplaceFavorites : [];
      return favorites.includes(id);
    },
    toggleMarketplaceFavorite(vendorId) {
      const id = typeof vendorId === "string" ? vendorId.trim() : "";
      if (!id) {
        return;
      }
      const favorites = Array.isArray(this.state.marketplaceFavorites) ? this.state.marketplaceFavorites.slice() : [];
      const index = favorites.indexOf(id);
      if (index >= 0) {
        favorites.splice(index, 1);
      } else {
        favorites.push(id);
      }
      this.state.marketplaceFavorites = favorites;
      this.state.pendingMarketplaceFocus = { type: "favorite", id };
      this.renderDashboard();
    },
    restoreMarketplaceFocus() {
      const pending = this.state.pendingMarketplaceFocus;
      if (!pending) {
        return;
      }
      this.state.pendingMarketplaceFocus = null;
      if (pending.type === "favorite" && pending.id) {
        const selectorId = this.escapeSelector(pending.id);
        if (!selectorId) {
          return;
        }
        const button = this.appEl.querySelector(`[data-action="marketplace-favorite"][data-vendor-id="${selectorId}"]`);
        if (button && typeof button.focus === "function") {
          button.focus();
        }
      }
    },
    escapeSelector(value) {
      if (typeof value !== "string") {
        return "";
      }
      if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
        return CSS.escape(value);
      }
      return value.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
    },
    formatPhoneHref(phone) {
      if (typeof phone !== "string") {
        return "";
      }
      const trimmed = phone.trim();
      if (!trimmed) {
        return "";
      }
      const digits = trimmed.replace(/\D+/g, "");
      if (!digits) {
        return "";
      }
      return trimmed.startsWith("+") ? `+${digits}` : digits;
    },
    getChecklistCollections(profile) {
      const sourceProfile = profile || this.state.profile || {};
      const rawTasks = Array.isArray(sourceProfile.checklist) && sourceProfile.checklist.length
        ? sourceProfile.checklist.slice()
        : DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item }));
      const rawFolders = Array.isArray(sourceProfile.checklistFolders)
        ? sourceProfile.checklistFolders.slice()
        : [];
      const tasks = rawTasks
        .filter((item) => item && typeof item === "object")
        .map((item, index) => {
          const key = this.getChecklistItemKey(item, index);
          const orderValue = Number(item.order);
          const order = Number.isFinite(orderValue) && orderValue > 0 ? orderValue : index + 1;
          const folderId =
            typeof item.folderId === "string" && item.folderId.trim().length
              ? item.folderId.trim()
              : null;
          const title = typeof item.title === "string" ? item.title : String(item.title || "");
          return {
            ...item,
            id: key,
            title,
            order,
            folderId,
            done: Boolean(item.done),
            type: "task"
          };
        });
      const folders = rawFolders
        .filter((folder) => folder && typeof folder === "object")
        .map((folder, index) => {
          const id =
            typeof folder.id === "string" && folder.id.trim().length
              ? folder.id.trim()
              : `folder-${index + 1}`;
          const title =
            typeof folder.title === "string" && folder.title.trim().length
              ? folder.title.trim()
              : "Новая папка";
          const createdAtValue = Number(folder.createdAt);
          const createdAt = Number.isFinite(createdAtValue) ? createdAtValue : Date.now() + index;
          const orderValue = Number(folder.order);
          const order = Number.isFinite(orderValue) ? orderValue : createdAt;
          const palette = Array.isArray(CHECKLIST_FOLDER_COLORS) ? CHECKLIST_FOLDER_COLORS : [];
          const paletteColor = palette[index % (palette.length || 1)] || "#F5D0D4";
          const color =
            typeof folder.color === "string" && folder.color.trim().length ? folder.color : paletteColor;
          return {
            ...folder,
            id,
            title,
            createdAt,
            order,
            color
          };
        });
      const folderIds = new Set(folders.map((folder) => folder.id));
      const sanitizedTasks = tasks.map((task) => ({
        ...task,
        folderId: task.folderId && folderIds.has(task.folderId) ? task.folderId : null
      }));
      sanitizedTasks.sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return (a.title || "").localeCompare(b.title || "", "ru", { sensitivity: "base" });
      });
      folders.sort((a, b) => {
        const orderDiff = (a.order ?? a.createdAt ?? 0) - (b.order ?? b.createdAt ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return (a.title || "").localeCompare(b.title || "", "ru", { sensitivity: "base" });
      });
      return { tasks: sanitizedTasks, folders };
    },
    syncChecklistFolderCollapse(folders) {
      const collapse = { ...this.state.checklistFoldersCollapse };
      const folderIds = new Set(folders.map((folder) => folder.id));
      let changed = false;
      Object.keys(collapse).forEach((id) => {
        if (!folderIds.has(id)) {
          delete collapse[id];
          changed = true;
        }
      });
      folders.forEach((folder) => {
        if (!(folder.id in collapse)) {
          collapse[folder.id] = true;
          changed = true;
        }
      });
      if (changed) {
        this.state.checklistFoldersCollapse = collapse;
      }
      return collapse;
    },
    renderChecklistItems(tasks, folders) {
      const folderMarkup = folders
        .map((folder) => {
          const folderTasks = tasks.filter((task) => task.folderId === folder.id);
          return this.renderChecklistFolder(folder, folderTasks);
        })
        .join("");
      const ungroupedTasks = tasks.filter((task) => !task.folderId);
      const ungroupedMarkup = ungroupedTasks.map((task) => this.renderChecklistTask(task)).join("");
      const hasFolders = folders.length > 0;
      const dropZone = hasFolders
        ? '<li class="checklist-drop-zone" data-folder-drop-target="root" role="presentation"><span>Перетащите сюда, чтобы убрать из папки</span></li>'
        : "";
      let content = `${folderMarkup}${hasFolders ? dropZone : ""}${ungroupedMarkup}`;
      if (!content.trim()) {
        content = '<li class="checklist-empty">Добавьте задачи, чтобы начать планирование</li>';
      }
      return content;
    },
    renderChecklistTask(task, options = {}) {
      const nested = Boolean(options.nested);
      const itemKey = typeof task.id === "string" && task.id ? task.id : this.getChecklistItemKey(task, 0);
      const itemId = `check-${itemKey}`;
      const checkedAttr = task.done ? "checked" : "";
      const isEditingItem = this.state.checklistEditingId === itemKey;
      const classes = ["checklist-item"];
      if (isEditingItem) {
        classes.push("checklist-item--editing");
      }
      if (nested) {
        classes.push("checklist-item--nested");
      }
      const folderAttr = task.folderId ? ` data-folder-id="${this.escapeHtml(task.folderId)}"` : "";
      if (isEditingItem) {
        const draftTitle =
          typeof this.state.checklistEditingDraft?.title === "string" && this.state.checklistEditingId === itemKey
            ? this.state.checklistEditingDraft.title
            : task.title || "";
        return `
          <li class="${classes.join(" ")}" data-task-id="${this.escapeHtml(itemKey)}"${folderAttr}>
            <form class="checklist-item__edit" data-task-id="${this.escapeHtml(itemKey)}" data-prevent-expand>
              <label for="checklist-edit-${this.escapeHtml(itemKey)}" class="sr-only">Название задачи</label>
              <input id="checklist-edit-${this.escapeHtml(itemKey)}" type="text" name="title" value="${this.escapeHtml(draftTitle)}" required>
              <div class="checklist-item__edit-actions">
                <button type="submit">Сохранить</button>
                <button type="button" class="secondary" data-action="cancel-checklist-edit">Отменить</button>
              </div>
            </form>
          </li>
        `;
      }
      return `
        <li class="${classes.join(" ")}" data-task-id="${this.escapeHtml(itemKey)}"${folderAttr} draggable="true" data-draggable-task="true">
          <div class="checklist-item__main">
            <input type="checkbox" id="${this.escapeHtml(itemId)}" data-task-id="${this.escapeHtml(itemKey)}" ${checkedAttr} data-prevent-expand>
            <label for="${this.escapeHtml(itemId)}" data-prevent-expand>${this.escapeHtml(task.title || "")}</label>
          </div>
          <div class="checklist-item__actions" role="group" aria-label="Действия с задачей">
            <button type="button" class="checklist-item__action" data-action="edit-checklist" data-task-id="${this.escapeHtml(itemKey)}" aria-label="Редактировать задачу">
              <span aria-hidden="true">✏️</span>
              <span class="sr-only">Редактировать</span>
            </button>
            <button type="button" class="checklist-item__action checklist-item__action--danger" data-action="delete-checklist" data-task-id="${this.escapeHtml(itemKey)}" aria-label="Удалить задачу">
              <span aria-hidden="true">🗑️</span>
              <span class="sr-only">Удалить</span>
            </button>
          </div>
        </li>
      `;
    },
    renderChecklistFolder(folder, folderTasks) {
      const folderId = typeof folder.id === "string" ? folder.id : `folder-${Date.now()}`;
      const isEditing = this.state.checklistFolderEditingId === folderId;
      const draftTitle =
        isEditing && typeof this.state.checklistFolderEditingDraft?.title === "string"
          ? this.state.checklistFolderEditingDraft.title
          : folder.title || "";
      const collapseState = this.state.checklistFoldersCollapse[folderId];
      const isCollapsed = collapseState !== false;
      const baseClasses = ["checklist-folder"];
      if (isCollapsed) {
        baseClasses.push("checklist-folder--collapsed");
      }
      const safeFolderId = this.escapeHtml(folderId);
      const color = folder.color || (Array.isArray(CHECKLIST_FOLDER_COLORS) ? CHECKLIST_FOLDER_COLORS[0] : "#F5D0D4");
      const completedCount = folderTasks.filter((task) => task.done).length;
      if (isEditing) {
        return `
          <li class="${baseClasses.join(" ")}" data-folder-id="${safeFolderId}" style="--folder-color: ${this.escapeHtml(color)};">
            <form class="checklist-folder__edit" data-folder-id="${safeFolderId}" data-prevent-expand>
              <label for="checklist-folder-edit-${safeFolderId}" class="sr-only">Название папки</label>
              <input id="checklist-folder-edit-${safeFolderId}" type="text" name="title" value="${this.escapeHtml(draftTitle)}" required>
              <div class="checklist-folder__edit-actions">
                <button type="submit">Сохранить</button>
                <button type="button" class="secondary" data-action="cancel-folder-edit">Отменить</button>
              </div>
            </form>
          </li>
        `;
      }
      const folderTasksMarkup = folderTasks.length
        ? folderTasks.map((task) => this.renderChecklistTask(task, { nested: true })).join("")
        : '<li class="checklist-folder__empty" data-folder-empty>Перетащите задачи сюда</li>';
      return `
        <li class="${baseClasses.join(" ")}" data-folder-id="${safeFolderId}" style="--folder-color: ${this.escapeHtml(color)};">
          <div class="checklist-folder__header" data-folder-drop-target="${safeFolderId}">
            <button type="button" class="checklist-folder__toggle" data-action="toggle-folder" data-folder-id="${safeFolderId}" aria-expanded="${!isCollapsed}">
              <span class="checklist-folder__arrow" aria-hidden="true">▸</span>
              <span class="sr-only">${isCollapsed ? "Развернуть папку" : "Свернуть папку"}</span>
            </button>
            <div class="checklist-folder__meta">
              <span class="checklist-folder__icon" aria-hidden="true">📁</span>
              <span class="checklist-folder__title">${this.escapeHtml(folder.title || "")}</span>
              <span class="checklist-folder__counter" aria-label="В папке ${folderTasks.length} задач">${completedCount}/${folderTasks.length}</span>
            </div>
            <div class="checklist-folder__actions" role="group" aria-label="Действия с папкой">
              <button type="button" class="checklist-folder__action" data-action="edit-folder" data-folder-id="${safeFolderId}" aria-label="Переименовать папку">
                <span aria-hidden="true">✏️</span>
                <span class="sr-only">Редактировать</span>
              </button>
              <button type="button" class="checklist-folder__action checklist-folder__action--danger" data-action="delete-folder" data-folder-id="${safeFolderId}" aria-label="Удалить папку">
                <span aria-hidden="true">🗑️</span>
                <span class="sr-only">Удалить</span>
              </button>
            </div>
          </div>
          <div class="checklist-folder__body"${isCollapsed ? " hidden" : ""}>
            <ul class="checklist-folder__tasks" data-folder-drop-target="${safeFolderId}">
              ${folderTasksMarkup}
            </ul>
          </div>
        </li>
      `;
    },
    bindDashboardEvents(previousTotal, totalBudget) {
      this.appEl.querySelectorAll("[data-modal-target]").forEach((element) => {
        element.addEventListener("click", (event) => this.handleModuleActivation(event, element));
        element.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            this.handleModuleActivation(event, element);
          }
        });
      });
      this.appEl.querySelectorAll('.checklist-item input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener("change", (event) => {
          const target = event.currentTarget;
          const taskId = target.dataset.taskId;
          if (!taskId) return;
          this.toggleChecklistItem(taskId, target.checked);
        });
      });
      const checklistForm = document.getElementById("checklist-form");
      if (checklistForm) {
        checklistForm.addEventListener("submit", (event) => {
          event.preventDefault();
          const input = checklistForm.querySelector("input[name='task']");
          if (!input) return;
          const value = input.value.trim();
          if (!value) {
            input.focus();
            return;
          }
          this.addChecklistItem(value);
        });
      }
      const checklistModule = this.appEl.querySelector(".dashboard-module.checklist");
      if (checklistModule) {
        checklistModule.addEventListener("click", (event) => {
          if (event.target.closest("[data-prevent-expand], .checklist-item, .checklist-form")) {
            return;
          }
          if (!this.state.isChecklistExpanded) {
            this.expandChecklist();
          }
        });
      }
      const expandButton = this.appEl.querySelector('[data-action="toggle-checklist-expand"]');
      if (expandButton) {
        expandButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.toggleChecklistExpansion();
        });
      }
      const createFolderButton = this.appEl.querySelector('[data-action="create-checklist-folder"]');
      if (createFolderButton) {
        createFolderButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.createChecklistFolder();
        });
      }
      const checklistOverlayEl = this.appEl.querySelector(".checklist-overlay");
      if (checklistOverlayEl) {
        checklistOverlayEl.addEventListener("click", (event) => {
          event.preventDefault();
          this.collapseChecklist();
        });
      }
      if (this.state.isChecklistExpanded && checklistModule) {
        this.setupChecklistFocusTrap(checklistModule);
      } else if (!this.state.isChecklistExpanded) {
        this.restoreChecklistFocusOrigin();
      }
      this.appEl.querySelectorAll('[data-action="toggle-folder"]').forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const folderId = button.dataset.folderId;
          if (!folderId) return;
          this.toggleChecklistFolder(folderId);
        });
      });
      this.appEl.querySelectorAll('[data-action="edit-folder"]').forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const folderId = button.dataset.folderId;
          if (!folderId) return;
          this.startChecklistFolderEdit(folderId);
        });
      });
      this.appEl.querySelectorAll('[data-action="delete-folder"]').forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const folderId = button.dataset.folderId;
          if (!folderId) return;
          this.deleteChecklistFolder(folderId);
        });
      });
      this.appEl.querySelectorAll(".checklist-item__action").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const action = button.dataset.action;
          const taskId = button.dataset.taskId;
          if (!taskId) return;
          if (action === "edit-checklist") {
            this.startChecklistEdit(taskId);
          } else if (action === "delete-checklist") {
            this.deleteChecklistItem(taskId);
          }
        });
      });
      this.appEl.querySelectorAll(".checklist-item__edit").forEach((form) => {
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          const taskId = form.dataset.taskId;
          if (!taskId) return;
          const input = form.querySelector("input[name='title']");
          if (!input) return;
          const value = input.value.trim();
          if (!value) {
            input.focus();
            return;
          }
          this.updateChecklistItem(taskId, value);
        });
        const input = form.querySelector("input[name='title']");
        if (input) {
          input.addEventListener("input", () => {
            this.state.checklistEditingDraft = {
              title: input.value
            };
          });
          requestAnimationFrame(() => {
            input.focus();
            input.select();
          });
        }
      });
      this.appEl
        .querySelectorAll('[data-action="cancel-checklist-edit"]')
        .forEach((button) => {
          button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.cancelChecklistEdit();
          });
        });
      this.appEl
        .querySelectorAll('[data-action="cancel-folder-edit"]')
        .forEach((button) => {
          button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.cancelChecklistFolderEdit();
          });
        });
      this.appEl.querySelectorAll(".checklist-folder__edit").forEach((form) => {
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          const folderId = form.dataset.folderId;
          if (!folderId) return;
          const input = form.querySelector("input[name='title']");
          if (!input) return;
          const value = input.value.trim();
          if (!value) {
            input.focus();
            return;
          }
          this.saveChecklistFolder(folderId, value);
        });
        const input = form.querySelector("input[name='title']");
        if (input) {
          input.addEventListener("input", () => {
            this.state.checklistFolderEditingDraft = {
              title: input.value
            };
          });
          requestAnimationFrame(() => {
            input.focus();
            input.select();
          });
        }
      });
      this.setupChecklistDragAndDrop();
      const budgetForm = document.getElementById("budget-form");
      if (budgetForm) {
        budgetForm.addEventListener("submit", (event) => {
          event.preventDefault();
          const titleInput = budgetForm.querySelector("input[name='title']");
          const amountInput = budgetForm.querySelector("input[name='amount']");
          if (!titleInput || !amountInput) return;
          const title = titleInput.value.trim();
          const amount = Number(amountInput.value);
          if (!title) {
            titleInput.focus();
            return;
          }
          if (!Number.isFinite(amount) || amount <= 0) {
            amountInput.focus();
            return;
          }
          this.addBudgetEntry(title, Math.round(amount));
        });
      }
      this.appEl.querySelectorAll(".budget-visual__action").forEach((button) => {
        button.addEventListener("click", () => {
          const entryId = button.dataset.entryId;
          const action = button.dataset.action;
          if (!entryId || !action) return;
          if (action === "edit") {
            this.startBudgetEdit(entryId);
          } else if (action === "delete") {
            this.deleteBudgetEntry(entryId);
          }
        });
      });
      this.appEl.querySelectorAll(".budget-visual__edit").forEach((form) => {
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          const entryId = form.dataset.entryId;
          if (!entryId) return;
          const titleInput = form.querySelector("input[name='title']");
          const amountInput = form.querySelector("input[name='amount']");
          if (!titleInput || !amountInput) return;
          const title = titleInput.value.trim();
          const amount = Number(amountInput.value);
          if (!title) {
            titleInput.focus();
            return;
          }
          if (!Number.isFinite(amount) || amount <= 0) {
            amountInput.focus();
            return;
          }
          this.updateBudgetEntry(entryId, title, amount);
        });
        const titleField = form.querySelector("input[name='title']");
        const amountField = form.querySelector("input[name='amount']");
        if (titleField && amountField) {
          const updateDraft = () => {
            this.state.budgetEditingDraft = {
              title: titleField.value,
              amount: amountField.value
            };
          };
          titleField.addEventListener("input", updateDraft);
          amountField.addEventListener("input", updateDraft);
        }
      });
      this.appEl.querySelectorAll("[data-action='cancel-edit']").forEach((button) => {
        button.addEventListener("click", () => {
          this.cancelBudgetEdit();
        });
      });
      const editingForm = this.appEl.querySelector(".budget-visual__edit");
      if (editingForm) {
        const titleInput = editingForm.querySelector("input[name='title']");
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      }
      this.appEl.querySelectorAll(".marketplace-category").forEach((button) => {
        button.addEventListener("click", () => {
          const categoryId = button.dataset.categoryId;
          if (!categoryId || categoryId === this.state.marketplaceCategoryId) {
            return;
          }
          this.state.marketplaceCategoryId = categoryId;
          this.renderDashboard();
        });
      });
      this.appEl.querySelectorAll('[data-action="marketplace-phone"]').forEach((button) => {
        button.addEventListener("click", () => {
          const vendorName = button.dataset.vendorName || "";
          this.showMarketplacePhone(vendorName, button);
        });
      });
      this.appEl.querySelectorAll('[data-action="marketplace-favorite"]').forEach((button) => {
        button.addEventListener("click", () => {
          const vendorId = button.dataset.vendorId || "";
          this.toggleMarketplaceFavorite(vendorId);
        });
      });
      this.animateBudget(previousTotal, totalBudget);
      this.restoreMarketplaceFocus();
    },
    getFocusableElements(container) {
      if (!container) return [];
      const selectorList = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ];
      const focusable = Array.from(container.querySelectorAll(selectorList.join(",")));
      return focusable.filter((element) => {
        if (!element) return false;
        if (element.hasAttribute("disabled")) return false;
        if (element.getAttribute("aria-hidden") === "true") return false;
        if (element.closest('[aria-hidden="true"]')) return false;
        if (element.tabIndex < 0) return false;
        return element.getClientRects().length > 0;
      });
    },
    setupChecklistFocusTrap(checklistModule) {
      if (!checklistModule) return;
      this.teardownChecklistFocusTrap();
      const focusableElements = this.getFocusableElements(checklistModule);
      if (!focusableElements.length) {
        checklistModule.setAttribute("tabindex", "-1");
      } else {
        checklistModule.removeAttribute("tabindex");
      }
      const activeElement = document.activeElement;
      const isActiveInside = activeElement && checklistModule.contains(activeElement);
      const focusTarget = isActiveInside ? null : focusableElements[0] || checklistModule;
      const handleKeydown = (event) => {
        if (event.key !== "Tab") {
          return;
        }
        const elements = this.getFocusableElements(checklistModule);
        if (!elements.length) {
          event.preventDefault();
          checklistModule.focus();
          return;
        }
        const first = elements[0];
        const last = elements[elements.length - 1];
        const current = document.activeElement;
        if (event.shiftKey) {
          if (current === first || !checklistModule.contains(current)) {
            event.preventDefault();
            last.focus();
          }
        } else if (current === last || !checklistModule.contains(current)) {
          event.preventDefault();
          first.focus();
        }
      };
      checklistModule.addEventListener("keydown", handleKeydown);
      this.state.checklistFocusTrapElement = checklistModule;
      this.state.checklistFocusTrapHandler = handleKeydown;
      if (!isActiveInside && focusTarget && typeof focusTarget.focus === "function") {
        requestAnimationFrame(() => {
          focusTarget.focus();
        });
      }
    },
    teardownChecklistFocusTrap() {
      if (this.state.checklistFocusTrapElement && this.state.checklistFocusTrapHandler) {
        this.state.checklistFocusTrapElement.removeEventListener("keydown", this.state.checklistFocusTrapHandler);
      }
      this.state.checklistFocusTrapElement = null;
      this.state.checklistFocusTrapHandler = null;
    },
    captureChecklistFocusOrigin() {
      const activeElement = document.activeElement;
      if (!activeElement || typeof activeElement.focus !== "function") {
        this.state.checklistLastFocused = null;
        this.state.checklistLastFocusedSelector = null;
        return;
      }
      if (activeElement === document.body || activeElement === document.documentElement) {
        this.state.checklistLastFocused = null;
        this.state.checklistLastFocusedSelector = '[data-action="toggle-checklist-expand"]';
        return;
      }
      this.state.checklistLastFocused = activeElement;
      this.state.checklistLastFocusedSelector = this.buildChecklistFocusSelector(activeElement);
    },
    restoreChecklistFocusOrigin() {
      if (!this.state.checklistLastFocused && !this.state.checklistLastFocusedSelector) {
        return;
      }
      const focusElement = (element) => {
        if (!element || typeof element.focus !== "function") {
          return false;
        }
        requestAnimationFrame(() => {
          element.focus();
        });
        return true;
      };
      let restored = false;
      const storedElement = this.state.checklistLastFocused;
      if (storedElement && document.contains(storedElement)) {
        restored = focusElement(storedElement);
      }
      if (!restored && this.state.checklistLastFocusedSelector) {
        const selector = this.state.checklistLastFocusedSelector;
        const fallback = this.appEl ? this.appEl.querySelector(selector) : null;
        if (fallback) {
          restored = focusElement(fallback);
        }
      }
      if (!restored && this.appEl) {
        const expandButton = this.appEl.querySelector('[data-action="toggle-checklist-expand"]');
        if (expandButton) {
          restored = focusElement(expandButton);
        }
      }
      this.state.checklistLastFocused = null;
      this.state.checklistLastFocusedSelector = null;
    },
    buildChecklistFocusSelector(element) {
      if (!element) {
        return null;
      }
      if (element.id) {
        return `#${this.escapeSelectorValue(element.id)}`;
      }
      if (element.hasAttribute("data-action")) {
        const value = element.getAttribute("data-action");
        if (value) {
          return `[data-action="${this.escapeSelectorValue(value)}"]`;
        }
      }
      if (element.hasAttribute("data-modal-target")) {
        const value = element.getAttribute("data-modal-target");
        if (value) {
          return `[data-modal-target="${this.escapeSelectorValue(value)}"]`;
        }
      }
      if (element.name) {
        return `[name="${this.escapeSelectorValue(element.name)}"]`;
      }
      return null;
    },
    escapeSelectorValue(value) {
      if (typeof value !== "string") {
        return "";
      }
      if (typeof CSS !== "undefined" && CSS && typeof CSS.escape === "function") {
        return CSS.escape(value);
      }
      return value.replace(/['"\\]/g, "\\$&");
    },
    handleModuleActivation(event, element) {
      const toolType = element?.dataset?.toolType;
      if (toolType === "quiz") {
        if (event) {
          event.preventDefault();
        }
        this.state.currentStep = 0;
        this.ensureProfile();
        location.hash = "#/quiz";
        return;
      }
      if (!this.state.profile) {
        if (event) {
          event.preventDefault();
        }
        this.state.currentStep = 0;
        this.ensureProfile();
        location.hash = "#/quiz";
        return;
      }
      if (event && event.type === "keydown") {
        event.preventDefault();
      }
      this.openModal(element);
    },
    toggleChecklistExpansion() {
      if (this.state.isChecklistExpanded) {
        this.collapseChecklist();
      } else {
        this.expandChecklist();
      }
    },
    expandChecklist() {
      if (this.state.isChecklistExpanded) {
        return;
      }
      this.captureChecklistFocusOrigin();
      this.state.isChecklistExpanded = true;
      this.renderDashboard();
    },
    collapseChecklist() {
      if (!this.state.isChecklistExpanded) {
        return;
      }
      this.teardownChecklistFocusTrap();
      this.state.isChecklistExpanded = false;
      this.resetChecklistEditing();
      this.resetChecklistFolderEditing();
      this.clearChecklistDropIndicators();
      this.state.checklistDragTaskId = null;
      this.renderDashboard();
    },
    resetChecklistEditing() {
      this.state.checklistEditingId = null;
      this.state.checklistEditingDraft = null;
    },
    startChecklistEdit(taskId) {
      if (!taskId) return;
      const items = Array.isArray(this.state.profile?.checklist) ? this.state.profile.checklist : [];
      let targetItem = null;
      items.forEach((item, index) => {
        const key = this.getChecklistItemKey(item, index);
        if (!targetItem && key === taskId) {
          targetItem = { ...item, id: key };
        }
      });
      if (!targetItem) return;
      this.resetChecklistFolderEditing();
      this.state.checklistEditingId = taskId;
      this.state.checklistEditingDraft = {
        title: targetItem.title || ""
      };
      if (!this.state.isChecklistExpanded) {
        this.captureChecklistFocusOrigin();
        this.state.isChecklistExpanded = true;
      }
      this.renderDashboard();
    },
    cancelChecklistEdit() {
      this.resetChecklistEditing();
      this.renderDashboard();
    },
    resetChecklistFolderEditing() {
      this.state.checklistFolderEditingId = null;
      this.state.checklistFolderEditingDraft = null;
    },
    startChecklistFolderEdit(folderId) {
      if (!folderId) return;
      const folders = Array.isArray(this.state.profile?.checklistFolders) ? this.state.profile.checklistFolders : [];
      const folder = folders.find((item) => item && item.id === folderId);
      if (!folder) return;
      this.resetChecklistEditing();
      this.state.checklistFolderEditingId = folderId;
      this.state.checklistFolderEditingDraft = {
        title: folder.title || ""
      };
      if (!this.state.isChecklistExpanded) {
        this.captureChecklistFocusOrigin();
        this.state.isChecklistExpanded = true;
      }
      this.state.checklistFoldersCollapse = {
        ...this.state.checklistFoldersCollapse,
        [folderId]: false
      };
      this.renderDashboard();
    },
    cancelChecklistFolderEdit() {
      this.resetChecklistFolderEditing();
      this.renderDashboard();
    },
    saveChecklistFolder(folderId, title) {
      const value = typeof title === "string" ? title.trim() : "";
      if (!folderId || !value) {
        return;
      }
      const current = Array.isArray(this.state.profile?.checklistFolders) ? this.state.profile.checklistFolders : [];
      const next = current.map((folder) =>
        folder.id === folderId
          ? {
              ...folder,
              title: value
            }
          : folder
      );
      this.resetChecklistFolderEditing();
      this.updateProfile({ checklistFolders: next });
      this.renderDashboard();
    },
    deleteChecklistFolder(folderId) {
      if (!folderId) return;
      const folders = Array.isArray(this.state.profile?.checklistFolders) ? this.state.profile.checklistFolders : [];
      const nextFolders = folders.filter((folder) => folder && folder.id !== folderId);
      if (nextFolders.length === folders.length) {
        return;
      }
      const tasks = Array.isArray(this.state.profile?.checklist) ? this.state.profile.checklist : [];
      let tasksChanged = false;
      const nextTasks = tasks.map((item, index) => {
        const key = this.getChecklistItemKey(item, index);
        if (item?.folderId === folderId) {
          tasksChanged = true;
          return {
            ...item,
            id: key,
            folderId: null
          };
        }
        if (item && item.id === key) {
          return item;
        }
        return {
          ...item,
          id: key
        };
      });
      this.resetChecklistFolderEditing();
      const collapse = { ...this.state.checklistFoldersCollapse };
      delete collapse[folderId];
      this.state.checklistFoldersCollapse = collapse;
      const patch = { checklistFolders: nextFolders };
      if (tasksChanged) {
        patch.checklist = nextTasks;
      }
      this.updateProfile(patch);
      this.renderDashboard();
    },
    updateChecklistItem(taskId, title) {
      const value = typeof title === "string" ? title.trim() : "";
      if (!taskId || !value) {
        return;
      }
      const current = Array.isArray(this.state.profile?.checklist) ? this.state.profile.checklist : [];
      const next = current.map((item, index) => {
        const key = this.getChecklistItemKey(item, index);
        if (key === taskId) {
          return {
            ...item,
            id: key,
            title: value
          };
        }
        if (item && item.id === key) {
          return item;
        }
        return {
          ...item,
          id: key
        };
      });
      this.resetChecklistEditing();
      this.updateProfile({ checklist: next });
      this.renderDashboard();
    },
    deleteChecklistItem(taskId) {
      if (!taskId) return;
      const current = Array.isArray(this.state.profile?.checklist) ? this.state.profile.checklist : [];
      const next = current.filter((item, index) => this.getChecklistItemKey(item, index) !== taskId);
      this.resetChecklistEditing();
      this.updateProfile({ checklist: next });
      this.renderDashboard();
    },
    toggleChecklistItem(taskId, done) {
      const current = Array.isArray(this.state.profile?.checklist) ? this.state.profile.checklist : [];
      const next = current.map((item, index) => {
        const key = this.getChecklistItemKey(item, index);
        if (key === taskId) {
          return {
            ...item,
            id: key,
            done: Boolean(done)
          };
        }
        if (item && item.id === key) {
          return item;
        }
        return {
          ...item,
          id: key
        };
      });
      this.updateProfile({ checklist: next });
    },
    addChecklistItem(title) {
      const current = Array.isArray(this.state.profile?.checklist) ? this.state.profile.checklist : [];
      const next = [
        ...current,
        {
          id: `task-${Date.now()}`,
          title,
          done: false,
          order: this.getNextChecklistOrder(),
          folderId: null,
          type: "task"
        }
      ];
      this.resetChecklistEditing();
      this.updateProfile({ checklist: next });
      this.renderDashboard();
    },
    createChecklistFolder() {
      this.ensureProfile();
      const profile = this.state.profile;
      if (!profile) return;
      const folders = Array.isArray(profile.checklistFolders) ? profile.checklistFolders : [];
      const now = Date.now();
      const folderId = `folder-${now}`;
      const title = "Новая папка";
      const color = this.getNextFolderColor(folders.length);
      const order = this.getNextFolderOrder();
      const nextFolders = [
        ...folders,
        {
          id: folderId,
          title,
          color,
          createdAt: now,
          order
        }
      ];
      this.resetChecklistEditing();
      this.resetChecklistFolderEditing();
      if (!this.state.isChecklistExpanded) {
        this.captureChecklistFocusOrigin();
        this.state.isChecklistExpanded = true;
      }
      this.state.checklistFolderEditingId = folderId;
      this.state.checklistFolderEditingDraft = { title };
      this.state.checklistFoldersCollapse = {
        ...this.state.checklistFoldersCollapse,
        [folderId]: false
      };
      this.updateProfile({ checklistFolders: nextFolders });
      this.renderDashboard();
    },
    toggleChecklistFolder(folderId) {
      if (!folderId) return;
      const collapse = { ...this.state.checklistFoldersCollapse };
      const current = collapse[folderId];
      collapse[folderId] = current === false ? true : false;
      this.state.checklistFoldersCollapse = collapse;
      this.renderDashboard();
    },
    assignTaskToFolder(taskId, folderId) {
      const current = Array.isArray(this.state.profile?.checklist) ? this.state.profile.checklist : [];
      const folders = Array.isArray(this.state.profile?.checklistFolders) ? this.state.profile.checklistFolders : [];
      const validFolderIds = new Set(folders.map((folder) => folder && folder.id).filter(Boolean));
      let changed = false;
      const next = current.map((item, index) => {
        const key = this.getChecklistItemKey(item, index);
        if (key === taskId) {
          const normalizedFolderId =
            folderId && typeof folderId === "string" && folderId.trim().length && validFolderIds.has(folderId)
              ? folderId
              : null;
          if (item.folderId === normalizedFolderId) {
            return { ...item, id: key };
          }
          changed = true;
          return {
            ...item,
            id: key,
            folderId: normalizedFolderId
          };
        }
        if (item && item.id === key) {
          return item;
        }
        return {
          ...item,
          id: key
        };
      });
      if (!changed) {
        this.clearChecklistDropIndicators();
        this.state.checklistDragTaskId = null;
        return;
      }
      this.updateProfile({ checklist: next });
      this.state.checklistDragTaskId = null;
      this.renderDashboard();
    },
    setupChecklistDragAndDrop() {
      const checklistModule = this.appEl.querySelector(".dashboard-module.checklist");
      if (!checklistModule) return;
      this.clearChecklistDropIndicators();
      const draggableItems = checklistModule.querySelectorAll('[data-draggable-task="true"]');
      const dropTargets = checklistModule.querySelectorAll("[data-folder-drop-target]");
      const handleDragStart = (event) => {
        const taskId = event.currentTarget?.dataset?.taskId;
        if (!taskId) return;
        this.state.checklistDragTaskId = taskId;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", taskId);
        checklistModule.classList.add("checklist--dragging");
      };
      const handleDragEnd = () => {
        this.state.checklistDragTaskId = null;
        this.clearChecklistDropIndicators();
      };
      const handleDragEnter = (event) => {
        if (!this.state.checklistDragTaskId) return;
        event.preventDefault();
        const target = event.currentTarget;
        target.classList.add("checklist-drop-target--active");
      };
      const handleDragOver = (event) => {
        if (!this.state.checklistDragTaskId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      };
      const handleDragLeave = (event) => {
        const target = event.currentTarget;
        target.classList.remove("checklist-drop-target--active");
      };
      const handleDrop = (event) => {
        if (!this.state.checklistDragTaskId) return;
        event.preventDefault();
        const target = event.currentTarget;
        const folderId = target.dataset.folderDropTarget;
        const taskId = this.state.checklistDragTaskId;
        this.clearChecklistDropIndicators();
        if (folderId === "root") {
          this.assignTaskToFolder(taskId, null);
        } else if (folderId) {
          this.assignTaskToFolder(taskId, folderId);
        }
      };
      draggableItems.forEach((item) => {
        item.addEventListener("dragstart", handleDragStart);
        item.addEventListener("dragend", handleDragEnd);
      });
      dropTargets.forEach((target) => {
        target.addEventListener("dragenter", handleDragEnter);
        target.addEventListener("dragover", handleDragOver);
        target.addEventListener("dragleave", handleDragLeave);
        target.addEventListener("drop", handleDrop);
      });
    },
    clearChecklistDropIndicators() {
      const checklistModule = this.appEl.querySelector(".dashboard-module.checklist");
      if (checklistModule) {
        checklistModule.classList.remove("checklist--dragging");
      }
      this.appEl.querySelectorAll("[data-folder-drop-target]").forEach((element) => {
        element.classList.remove("checklist-drop-target--active");
      });
    },
    getNextChecklistOrder() {
      const tasks = Array.isArray(this.state.profile?.checklist) ? this.state.profile.checklist : [];
      return tasks.reduce((max, item) => {
        const value = Number(item?.order);
        return Number.isFinite(value) && value > max ? value : max;
      }, 0) + 1;
    },
    getNextFolderOrder() {
      const folders = Array.isArray(this.state.profile?.checklistFolders) ? this.state.profile.checklistFolders : [];
      return folders.reduce((max, folder) => {
        const value = Number(folder?.order ?? folder?.createdAt);
        return Number.isFinite(value) && value > max ? value : max;
      }, 0) + 1;
    },
    getNextFolderColor(index) {
      const palette = Array.isArray(CHECKLIST_FOLDER_COLORS) && CHECKLIST_FOLDER_COLORS.length
        ? CHECKLIST_FOLDER_COLORS
        : ["#F5D0D4"];
      return palette[index % palette.length];
    },
    addBudgetEntry(title, amount) {
      const current = Array.isArray(this.state.profile?.budgetEntries) ? this.state.profile.budgetEntries : [];
      const next = [
        ...current,
        {
          id: `budget-${Date.now()}`,
          title,
          amount: Math.max(0, amount)
        }
      ];
      this.resetBudgetEditing();
      this.updateProfile({ budgetEntries: next });
      this.renderDashboard();
    },
    startBudgetEdit(entryId) {
      if (!entryId) return;
      const entries = Array.isArray(this.state.profile?.budgetEntries) ? this.state.profile.budgetEntries : [];
      const entry = entries.find((item) => item && item.id === entryId);
      if (!entry) return;
      this.state.budgetEditingId = entryId;
      this.state.budgetEditingDraft = {
        title: entry.title || "",
        amount: entry.amount != null ? String(entry.amount) : ""
      };
      this.renderDashboard();
    },
    updateBudgetEntry(entryId, title, amount) {
      if (!entryId) return;
      const entries = Array.isArray(this.state.profile?.budgetEntries) ? this.state.profile.budgetEntries : [];
      const normalizedAmount = Math.max(0, Math.round(Number(amount)));
      const next = entries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              title,
              amount: normalizedAmount
            }
          : entry
      );
      this.resetBudgetEditing();
      this.updateProfile({ budgetEntries: next });
      this.renderDashboard();
    },
    deleteBudgetEntry(entryId) {
      if (!entryId) return;
      const entries = Array.isArray(this.state.profile?.budgetEntries) ? this.state.profile.budgetEntries : [];
      const next = entries.filter((entry) => entry.id !== entryId);
      if (next.length === entries.length) {
        return;
      }
      this.resetBudgetEditing();
      this.updateProfile({ budgetEntries: next });
      this.renderDashboard();
    },
    cancelBudgetEdit() {
      if (!this.state.budgetEditingId) return;
      this.resetBudgetEditing();
      this.renderDashboard();
    },
    resetBudgetEditing() {
      this.state.budgetEditingId = null;
      this.state.budgetEditingDraft = null;
    },
    animateBudget(previousTotal, totalBudget) {
      const totalEl = document.getElementById("budget-total");
      if (totalEl) {
        this.fitBudgetTotalText(totalEl);
        this.animateNumber(totalEl, previousTotal, totalBudget, () => {
          this.fitBudgetTotalText(totalEl);
        });
      }
      const bars = this.appEl.querySelectorAll(".budget-visual__bar");
      bars.forEach((bar) => {
        const value = Number(bar.dataset.value) || 0;
        const width = totalBudget > 0 ? Math.min(Math.max((value / totalBudget) * 100, value > 0 ? 6 : 0), 100) : 0;
        requestAnimationFrame(() => {
          bar.style.width = `${width}%`;
        });
      });
    },
    fitBudgetTotalText(element) {
      if (!element) return;
      const chart = element.closest(".budget-summary__chart");
      if (!chart) return;
      const chartStyles = getComputedStyle(chart);
      const innerDiameter = this.calculateChartInnerDiameter(chart, chartStyles);
      if (!innerDiameter) return;
      const safeDimension = innerDiameter * 0.82;
      if (!safeDimension) return;
      const maxFont = this.parseNumericVariable(chartStyles.getPropertyValue("--budget-total-font-max")) ||
        parseFloat(getComputedStyle(element).fontSize) || 32;
      const minFont = this.parseNumericVariable(chartStyles.getPropertyValue("--budget-total-font-min")) || Math.max(Math.floor(maxFont * 0.6), 12);
      let fontSize = parseFloat(element.style.fontSize);
      if (!Number.isFinite(fontSize)) {
        fontSize = maxFont;
      }
      fontSize = Math.min(Math.max(fontSize, minFont), maxFont);
      element.style.fontSize = `${fontSize}px`;

      let growAttempts = 0;
      while (fontSize < maxFont && growAttempts < 30) {
        const nextSize = Math.min(fontSize + 1, maxFont);
        element.style.fontSize = `${nextSize}px`;
        if (element.scrollWidth <= safeDimension && element.scrollHeight <= safeDimension) {
          fontSize = nextSize;
          growAttempts += 1;
          if (nextSize === maxFont) break;
        } else {
          element.style.fontSize = `${fontSize}px`;
          break;
        }
      }

      let shrinkAttempts = 0;
      while ((element.scrollWidth > safeDimension || element.scrollHeight > safeDimension) && fontSize > minFont && shrinkAttempts < 40) {
        fontSize -= 1;
        element.style.fontSize = `${fontSize}px`;
        shrinkAttempts += 1;
      }
    },
    calculateChartInnerDiameter(chart, chartStyles) {
      const chartSize = Math.min(chart.clientWidth, chart.clientHeight);
      if (!chartSize) return 0;
      const insetRaw = chartStyles.getPropertyValue("--budget-ring-inset");
      const inset = this.parseInsetValue(insetRaw, chartSize);
      const inner = chartSize - inset * 2;
      return inner > 0 ? inner : 0;
    },
    parseInsetValue(value, referenceSize) {
      if (!value) return 0;
      const trimmed = value.trim();
      if (!trimmed) return 0;
      const numeric = parseFloat(trimmed);
      if (!Number.isFinite(numeric)) return 0;
      if (trimmed.endsWith("%")) {
        return (numeric / 100) * referenceSize;
      }
      return numeric;
    },
    parseNumericVariable(value) {
      if (!value) return null;
      const numeric = parseFloat(value.trim());
      return Number.isFinite(numeric) ? numeric : null;
    },
    animateNumber(element, from, to, onUpdate) {
      const startValue = Number.isFinite(from) ? from : 0;
      const endValue = Number.isFinite(to) ? to : 0;
      const duration = 700;
      const startTime = performance.now();
      const step = (time) => {
        const progress = Math.min((time - startTime) / duration, 1);
        const currentValue = Math.round(startValue + (endValue - startValue) * progress);
        element.textContent = this.formatCurrency(currentValue);
        if (typeof onUpdate === "function") {
          onUpdate(currentValue);
        }
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          element.textContent = this.formatCurrency(endValue);
          if (typeof onUpdate === "function") {
            onUpdate(endValue);
          }
        }
      };
      requestAnimationFrame(step);
    },
    normalizeChecklistData(profile) {
      const result = {
        updated: false,
        checklist: [],
        checklistFolders: []
      };
      if (!profile || typeof profile !== "object") {
        return result;
      }
      const palette = Array.isArray(CHECKLIST_FOLDER_COLORS) ? CHECKLIST_FOLDER_COLORS : [];
      const rawFolders = Array.isArray(profile.checklistFolders) ? profile.checklistFolders : [];
      let colorIndex = 0;
      const normalizedFolders = rawFolders
        .filter((folder) => folder && typeof folder === "object")
        .map((folder, index) => {
          const id =
            typeof folder.id === "string" && folder.id.trim().length
              ? folder.id.trim()
              : `folder-${Date.now()}-${index}`;
          const title =
            typeof folder.title === "string" && folder.title.trim().length
              ? folder.title.trim()
              : "Новая папка";
          const createdAtValue = Number(folder.createdAt);
          const createdAt = Number.isFinite(createdAtValue) ? createdAtValue : Date.now() + index;
          const orderValue = Number(folder.order);
          const order = Number.isFinite(orderValue) ? orderValue : createdAt;
          let color = typeof folder.color === "string" && folder.color.trim().length ? folder.color : "";
          if (!color) {
            color = palette[colorIndex % (palette.length || 1)] || "#F5D0D4";
            colorIndex += 1;
          }
          const normalizedFolder = { ...folder, id, title, createdAt, order, color };
          if (
            folder.id !== normalizedFolder.id ||
            folder.title !== normalizedFolder.title ||
            folder.createdAt !== normalizedFolder.createdAt ||
            folder.order !== normalizedFolder.order ||
            folder.color !== normalizedFolder.color
          ) {
            result.updated = true;
          }
          return normalizedFolder;
        });
      if (normalizedFolders.length !== rawFolders.length) {
        result.updated = true;
      }
      const folderIds = new Set(normalizedFolders.map((folder) => folder.id));
      const rawTasks = Array.isArray(profile.checklist) ? profile.checklist : [];
      let maxOrder = 0;
      const normalizedTasks = rawTasks
        .filter((item) => item && typeof item === "object")
        .map((item, index) => {
          const key = this.getChecklistItemKey(item, index);
          const title = typeof item.title === "string" ? item.title : String(item.title || "");
          const done = Boolean(item.done);
          const orderValue = Number(item.order);
          const hasValidOrder = Number.isFinite(orderValue) && orderValue > 0;
          const order = hasValidOrder ? orderValue : maxOrder + 1;
          maxOrder = Math.max(maxOrder, order);
          const folderId = typeof item.folderId === "string" && folderIds.has(item.folderId) ? item.folderId : null;
          if (!hasValidOrder || folderId !== item.folderId) {
            result.updated = true;
          }
          const normalizedTask = {
            ...item,
            id: key,
            title,
            done,
            order,
            folderId,
            type: "task"
          };
          if (
            item.id !== normalizedTask.id ||
            item.title !== normalizedTask.title ||
            item.done !== normalizedTask.done ||
            item.order !== normalizedTask.order ||
            item.folderId !== normalizedTask.folderId ||
            item.type !== "task"
          ) {
            result.updated = true;
          }
          return normalizedTask;
        });
      if (normalizedTasks.length !== rawTasks.length) {
        result.updated = true;
      }
      normalizedTasks.sort((a, b) => {
        if ((a.order ?? 0) === (b.order ?? 0)) {
          return (a.title || "").localeCompare(b.title || "", "ru", { sensitivity: "base" });
        }
        return (a.order ?? 0) - (b.order ?? 0);
      });
      normalizedFolders.sort((a, b) => {
        const orderDiff = (a.order ?? a.createdAt ?? 0) - (b.order ?? b.createdAt ?? 0);
        if (orderDiff !== 0) {
          return orderDiff;
        }
        return (a.title || "").localeCompare(b.title || "", "ru", { sensitivity: "base" });
      });
      result.checklist = normalizedTasks;
      result.checklistFolders = normalizedFolders;
      return result;
    },
    upgradeProfile(profile) {
      if (!profile || typeof profile !== "object") {
        return { profile: null, updated: false };
      }
      const next = {
        ...profile
      };
      if (!Array.isArray(next.checklist) || next.checklist.length === 0) {
        next.checklist = DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item }));
      }
      if (!Array.isArray(next.checklistFolders)) {
        next.checklistFolders = DEFAULT_CHECKLIST_FOLDERS.map((item) => ({ ...item }));
      }
      const normalized = this.normalizeChecklistData(next);
      next.checklist = normalized.checklist;
      next.checklistFolders = normalized.checklistFolders;
      const updated = normalized.updated || next.schemaVersion !== PROFILE_SCHEMA_VERSION;
      next.schemaVersion = PROFILE_SCHEMA_VERSION;
      if (!next.createdAt) {
        next.createdAt = Date.now();
      }
      next.updatedAt = Date.now();
      return { profile: next, updated };
    },
    formatCurrency(value) {
      const safeValue = Number.isFinite(value) ? value : 0;
      return `${currencyFormatter.format(Math.max(0, Math.round(safeValue)))}` + " ₽";
    },
    getChecklistItemKey(item, index) {
      if (item && typeof item.id === "string" && item.id) {
        return item.id;
      }
      return `task-${index}`;
    },
    escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
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
    showMarketplacePhone(vendorName, trigger) {
      const safeName = this.escapeHtml(vendorName || "подрядчика");
      const rawPhone = typeof MARKETPLACE_PHONE_NUMBER === "string" && MARKETPLACE_PHONE_NUMBER.trim().length
        ? MARKETPLACE_PHONE_NUMBER.trim()
        : "+7 (999) 867 17 49";
      const safePhone = this.escapeHtml(rawPhone);
      const phoneHref = this.escapeHtml(this.formatPhoneHref(rawPhone) || "");
      this.state.modalOpen = true;
      this.state.lastFocused = trigger || document.activeElement;
      const titleEl = document.getElementById("modal-title");
      if (titleEl) {
        titleEl.textContent = "Контакты подрядчика";
      }
      this.modalBody.innerHTML = `
        <div class="marketplace-modal">
          <p>Позвоните <strong>${safeName}</strong>, чтобы обсудить детали свадьбы.</p>
          <p class="marketplace-modal__phone">
            <span aria-hidden="true">📞</span>
            <a href="tel:${phoneHref}" class="marketplace-modal__phone-link">${safePhone}</a>
          </p>
          <p class="modal-note">Скажите, что нашли подрядчика в Bridebook — так вас вспомнят быстрее.</p>
        </div>
      `;
      this.modalOverlay.classList.add("active");
      this.modalOverlay.setAttribute("aria-hidden", "false");
      this.modalCloseBtn.focus();
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
        if (!profile || typeof profile !== "object") {
          return null;
        }
        if (profile.schemaVersion !== PROFILE_SCHEMA_VERSION) {
          const { profile: upgradedProfile, updated } = this.upgradeProfile(profile);
          if (!upgradedProfile) {
            return null;
          }
          if (updated) {
            this.saveProfile(upgradedProfile);
          } else {
            this.state.profile = upgradedProfile;
          }
          return upgradedProfile;
        }
        const normalized = this.normalizeChecklistData(profile);
        if (normalized.updated) {
          const nextProfile = {
            ...profile,
            checklist: normalized.checklist,
            checklistFolders: normalized.checklistFolders,
            schemaVersion: PROFILE_SCHEMA_VERSION,
            updatedAt: Date.now()
          };
          this.saveProfile(nextProfile);
          return nextProfile;
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
        updatedAt: Date.now(),
        schemaVersion: PROFILE_SCHEMA_VERSION
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
