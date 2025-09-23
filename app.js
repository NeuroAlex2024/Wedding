(function () {
  const storageKey = "wedding_profile_v1";
  const allowedRoutes = ["#/quiz", "#/dashboard", "#/invitation"];
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
  const INVITATION_STYLES = [
    {
      id: "blossom",
      name: "Нежная классика",
      description: "Пастельные тона и романтичная типографика",
      palette: {
        background: "linear-gradient(140deg, #fff7fb 0%, #ffeef3 100%)",
        card: "rgba(255, 255, 255, 0.82)",
        accent: "#d66a7a",
        accentSoft: "rgba(214, 106, 122, 0.18)",
        text: "#35272f",
        subtitle: "#725661",
        ornament: "rgba(214, 106, 122, 0.14)",
        ribbon: "#f9dbe4"
      }
    },
    {
      id: "emerald",
      name: "Садовые огни",
      description: "Глубокая зелень и сияющие акценты",
      palette: {
        background: "linear-gradient(160deg, #f4fff7 0%, #e4f6ec 100%)",
        card: "rgba(255, 255, 255, 0.88)",
        accent: "#2f7d60",
        accentSoft: "rgba(47, 125, 96, 0.18)",
        text: "#1e3b32",
        subtitle: "#2f7d60",
        ornament: "rgba(47, 125, 96, 0.15)",
        ribbon: "#d9f0e4"
      }
    },
    {
      id: "midnight",
      name: "Полночные огни",
      description: "Контраст тёмного неба и золотых искр",
      palette: {
        background: "linear-gradient(160deg, #10132b 0%, #1c1f3f 100%)",
        card: "rgba(21, 24, 49, 0.8)",
        accent: "#f4c77b",
        accentSoft: "rgba(244, 199, 123, 0.12)",
        text: "#ffffff",
        subtitle: "#f4c77b",
        ornament: "rgba(244, 199, 123, 0.2)",
        ribbon: "rgba(244, 199, 123, 0.16)"
      }
    },
    {
      id: "sunset",
      name: "Закат у моря",
      description: "Тёплое солнце и свежий бриз",
      palette: {
        background: "linear-gradient(160deg, #fff4eb 0%, #ffe6d3 100%)",
        card: "rgba(255, 255, 255, 0.86)",
        accent: "#f07a3f",
        accentSoft: "rgba(240, 122, 63, 0.16)",
        text: "#402c1e",
        subtitle: "#d56932",
        ornament: "rgba(240, 122, 63, 0.14)",
        ribbon: "#ffe0c9"
      }
    }
  ];

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
      marketplaceFavorites: new Set(),
      marketplaceSelections: {},
      invitationFormVisible: false
    },
    invitationStyles: INVITATION_STYLES,
    init() {
      this.cacheDom();
      this.bindGlobalEvents();
      this.state.profile = this.loadProfile();
      this.syncMarketplaceFavoritesFromProfile(this.state.profile);
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
      this.syncMarketplaceFavoritesFromProfile(this.state.profile);
      if (hash === "#/welcome") {
        location.replace("#/dashboard");
        return;
      }
      if (!this.allowedRoutes.includes(hash)) {
        location.replace("#/dashboard");
        return;
      }
      this.state.currentRoute = hash;
      this.state.invitationFormVisible = hash === "#/invitation";
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
        case "#/invitation":
          this.renderInvitationBuilder();
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
        budgetEntries: DEFAULT_BUDGET_ENTRIES.map((item) => ({ ...item })),
        marketplaceFavorites: []
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
      if (!Array.isArray(profile.marketplaceFavorites)) {
        profile.marketplaceFavorites = [];
        updated = true;
      } else {
        const normalizedFavorites = Array.from(
          new Set(
            profile.marketplaceFavorites
              .filter((id) => typeof id === "string" && id.trim().length)
              .map((id) => id.trim())
          )
        );
        if (
          normalizedFavorites.length !== profile.marketplaceFavorites.length ||
          normalizedFavorites.some((id, index) => id !== profile.marketplaceFavorites[index])
        ) {
          profile.marketplaceFavorites = normalizedFavorites;
          updated = true;
        }
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
        const attributeList = [];
        if (item.id === "tools-test") {
          attributeList.push('data-tool-type="quiz"');
        }
        if (item.id === "tools-website") {
          attributeList.push('data-tool-route="#/invitation"');
        }
        const extraAttributes = attributeList.length ? ` ${attributeList.join(" ")}` : "";
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
      const favoritesSet = this.state.marketplaceFavorites instanceof Set ? this.state.marketplaceFavorites : new Set();
      const favoritesContractors = [];
      categories.forEach((category) => {
        if (!category || typeof category !== "object" || !Array.isArray(category.contractors)) {
          return;
        }
        const categoryTitle = typeof category.title === "string" ? category.title : String(category.title || "");
        category.contractors.forEach((contractor) => {
          if (
            contractor &&
            typeof contractor === "object" &&
            typeof contractor.id === "string" &&
            favoritesSet.has(contractor.id)
          ) {
            favoritesContractors.push({
              ...contractor,
              categoryTitle
            });
          }
        });
      });
      const favoritesCategory = {
        id: "favorites",
        title: "Избранное",
        contractors: favoritesContractors
      };
      const allCategories = [favoritesCategory, ...categories];
      let selectedId = this.state.marketplaceCategoryId;
      const firstRegularCategoryId = categories[0]?.id || favoritesCategory.id;
      if (!selectedId || !allCategories.some((category) => category && category.id === selectedId)) {
        selectedId = firstRegularCategoryId;
        this.state.marketplaceCategoryId = selectedId;
      }
      const visibleContractorsById = new Map();
      const categoriesMarkup = allCategories
        .map((category) => {
          if (!category || typeof category !== "object") {
            return "";
          }
          const rawId = typeof category.id === "string" ? category.id : String(category.id || "");
          if (!rawId) {
            return "";
          }
          const contractorsForCategory = rawId === "favorites"
            ? favoritesContractors
            : this.getRandomizedContractors(category);
          const decoratedContractors = contractorsForCategory
            .filter((contractor) => contractor && typeof contractor === "object")
            .map((contractor) => ({
              ...contractor,
              categoryTitle:
                typeof contractor.categoryTitle === "string" && contractor.categoryTitle.trim().length
                  ? contractor.categoryTitle
                  : category.title || ""
            }));
          visibleContractorsById.set(rawId, decoratedContractors);
          const safeId = this.escapeHtml(rawId);
          const title = this.escapeHtml(category.title || "");
          const contractorCount = decoratedContractors.length;
          const formattedCount = this.escapeHtml(currencyFormatter.format(contractorCount));
          const isActive = rawId === selectedId;
          const iconMarkup = rawId === "favorites"
            ? '<span class="marketplace-category__icon" aria-hidden="true">❤️</span>'
            : "";
          return `
            <button type="button" class="marketplace-category${isActive ? " marketplace-category--active" : ""}" data-category-id="${safeId}" aria-pressed="${isActive}" aria-controls="marketplace-panel-${safeId}">
              <span class="marketplace-category__name">
                ${iconMarkup}
                <span class="marketplace-category__label">${title}</span>
              </span>
              <span class="marketplace-category__count">${formattedCount}</span>
            </button>
          `;
        })
        .join("");
      const selectedCategory =
        allCategories.find((category) => category && category.id === selectedId) || allCategories[0];
      const selectedSafeId = this.escapeHtml(selectedCategory?.id || "all");
      const selectedContractors = visibleContractorsById.get(selectedCategory?.id) || [];
      const emptyMessage = selectedCategory?.id === "favorites"
        ? '<p class="marketplace-empty marketplace-empty--favorites">Добавьте подрядчиков в избранное, чтобы увидеть их здесь.</p>'
        : '<p class="marketplace-empty">Скоро добавим подрядчиков в эту категорию.</p>';
      const cardsMarkup = selectedContractors.length
        ? selectedContractors
            .map((contractor, index) => this.renderMarketplaceCard(contractor, selectedCategory, index))
            .join("")
        : emptyMessage;
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
      const rawId = typeof contractor.id === "string" && contractor.id.trim().length
        ? contractor.id.trim()
        : `contractor-${index + 1}`;
      const favoritesSet = this.state.marketplaceFavorites instanceof Set ? this.state.marketplaceFavorites : new Set();
      const isFavorite = favoritesSet.has(rawId);
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
      const categoryTitle = typeof contractor.categoryTitle === "string" && contractor.categoryTitle.trim().length
        ? contractor.categoryTitle.trim()
        : category?.title || "";
      const altBase = typeof contractor.imageAlt === "string" && contractor.imageAlt.trim().length
        ? contractor.imageAlt
        : `${rawName}${categoryTitle ? ` — ${categoryTitle}` : ""}`;
      const altText = this.escapeHtml(altBase);
      const phoneValue = typeof contractor.phone === "string" && contractor.phone.trim().length
        ? contractor.phone.trim()
        : "+7 (999) 867 17 49";
      const safePhone = this.escapeHtml(phoneValue);
      const safeIdAttr = this.escapeHtml(rawId);
      return `
        <article class="marketplace-card" role="listitem">
          <div class="marketplace-card__image">
            <img src="${this.escapeHtml(imageUrl)}" alt="${altText}">
            <button type="button" class="marketplace-card__favorite" data-action="marketplace-favorite" data-vendor-id="${safeIdAttr}" aria-pressed="${isFavorite}" aria-label="${this.escapeHtml(favoriteLabel)}" title="${this.escapeHtml(favoriteLabel)}">
              <span class="marketplace-card__favorite-icon" aria-hidden="true">${isFavorite ? "❤️" : "♡"}</span>
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
              <button type="button" class="marketplace-card__action marketplace-card__action--phone" data-action="marketplace-phone" data-vendor-name="${this.escapeHtml(rawName)}" data-vendor-phone="${safePhone}">Показать телефон</button>
            </div>
          </div>
        </article>
      `;
    },
    getRandomizedContractors(category) {
      if (!category || typeof category !== "object") {
        return [];
      }
      const rawId = typeof category.id === "string" ? category.id : String(category.id || "");
      if (!rawId) {
        return [];
      }
      if (!this.state.marketplaceSelections || typeof this.state.marketplaceSelections !== "object") {
        this.state.marketplaceSelections = {};
      }
      const store = this.state.marketplaceSelections;
      const contractors = Array.isArray(category.contractors) ? category.contractors : [];
      if (!contractors.length) {
        store[rawId] = [];
        return [];
      }
      const idToContractor = new Map();
      contractors.forEach((contractor) => {
        if (contractor && typeof contractor === "object" && typeof contractor.id === "string") {
          idToContractor.set(contractor.id, contractor);
        }
      });
      const existingIds = Array.isArray(store[rawId]) ? store[rawId] : [];
      if (existingIds.length) {
        const filteredIds = existingIds.filter((id) => idToContractor.has(id));
        if (filteredIds.length !== existingIds.length) {
          store[rawId] = filteredIds;
        }
        if (filteredIds.length) {
          return filteredIds.map((id) => idToContractor.get(id)).filter(Boolean);
        }
      }
      const maxVisible = Math.min(6, contractors.length);
      const minVisible = Math.min(3, contractors.length);
      const count = this.getRandomIntInclusive(minVisible, maxVisible);
      const shuffled = contractors.slice().sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);
      const selectedIds = selected
        .map((contractor) => (contractor && typeof contractor.id === "string" ? contractor.id : null))
        .filter((id) => id && idToContractor.has(id));
      store[rawId] = selectedIds;
      return selectedIds.map((id) => idToContractor.get(id)).filter(Boolean);
    },
    getRandomIntInclusive(min, max) {
      const lower = Number.isFinite(min) ? Math.ceil(min) : 0;
      const upper = Number.isFinite(max) ? Math.floor(max) : lower;
      if (upper <= lower) {
        return Math.max(0, lower);
      }
      return Math.floor(Math.random() * (upper - lower + 1)) + lower;
    },
    toggleMarketplaceFavorite(vendorId) {
      const id = typeof vendorId === "string" ? vendorId.trim() : "";
      if (!id) {
        return;
      }
      const currentFavorites = this.state.marketplaceFavorites instanceof Set
        ? new Set(this.state.marketplaceFavorites)
        : new Set();
      if (currentFavorites.has(id)) {
        currentFavorites.delete(id);
      } else {
        currentFavorites.add(id);
      }
      this.state.marketplaceFavorites = currentFavorites;
      const favoritesArray = Array.from(currentFavorites);
      this.updateProfile({ marketplaceFavorites: favoritesArray });
      if (this.state.currentRoute === "#/dashboard") {
        this.renderDashboard();
      }
    },
    syncMarketplaceFavoritesFromProfile(profile = this.state.profile) {
      const favorites = Array.isArray(profile?.marketplaceFavorites)
        ? profile.marketplaceFavorites
            .filter((id) => typeof id === "string" && id.trim().length)
            .map((id) => id.trim())
        : [];
      this.state.marketplaceFavorites = new Set(favorites);
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
    renderInvitationBuilder() {
      this.ensureProfile();
      const invitation = this.getInvitationData();
      const activeStyle = this.getInvitationStyle(invitation.styleId);
      const isComplete = this.isInvitationComplete(invitation);
      const showForm = this.state.invitationFormVisible || !isComplete;
      const previewMarkup = this.renderInvitationPreview(invitation, activeStyle);
      const stylesMarkup = this.invitationStyles
        .map((style) => {
          const isActive = style.id === activeStyle.id;
          const palette = style.palette || {};
          const gradient = palette.background || "#ffffff";
          const accent = palette.accent || "#000000";
          return `
            <button type="button" class="invitation-style${isActive ? " invitation-style--active" : ""}" data-style-id="${this.escapeHtml(style.id)}" aria-pressed="${isActive}">
              <span class="invitation-style__preview" style="--style-preview: ${this.escapeHtml(gradient)}; --style-accent: ${this.escapeHtml(accent)}"></span>
              <span class="invitation-style__meta">
                <span class="invitation-style__name">${this.escapeHtml(style.name)}</span>
                <span class="invitation-style__description">${this.escapeHtml(style.description)}</span>
              </span>
            </button>
          `;
        })
        .join("");
      const detailsMarkup = this.renderInvitationDetails(invitation);
      const formOverlay = showForm ? this.renderInvitationForm(invitation) : "";
      const completionHint = isComplete
        ? ""
        : '<p class="invitation-builder__hint">Заполните анкету, чтобы персонализировать приглашение и поделиться ссылкой с гостями.</p>';
      this.appEl.innerHTML = `
        <section class="invitation-builder">
          <header class="invitation-builder__header">
            <div class="invitation-builder__title">
              <button type="button" class="secondary invitation-builder__back" data-action="back-to-dashboard">← Назад</button>
              <div>
                <h1>Сайт-приглашение</h1>
                <p>Создайте красивое цифровое приглашение и поделитесь им с друзьями.</p>
              </div>
            </div>
            <div class="invitation-builder__actions">
              <button type="button" class="secondary" data-action="download-invitation">Сохранить PDF</button>
              <button type="button" data-action="activate-invitation">Активировать сайт</button>
            </div>
          </header>
          ${completionHint}
          <div class="invitation-builder__layout">
            <div class="invitation-builder__preview" id="invitation-preview">
              ${previewMarkup}
            </div>
            <aside class="invitation-builder__sidebar">
              <section class="invitation-styles">
                <h2>Оформление</h2>
                <p>Выберите настроение сайта — всё применится мгновенно.</p>
                <div class="invitation-style-grid">
                  ${stylesMarkup}
                </div>
              </section>
              <section class="invitation-summary">
                <div class="invitation-summary__header">
                  <h2>Данные приглашения</h2>
                  <button type="button" class="secondary" data-action="edit-invitation">Изменить</button>
                </div>
                ${detailsMarkup}
              </section>
            </aside>
          </div>
          ${formOverlay}
        </section>
      `;
      this.bindInvitationBuilderEvents({ showForm });
    },
    bindInvitationBuilderEvents({ showForm }) {
      const backButton = this.appEl.querySelector('[data-action="back-to-dashboard"]');
      if (backButton) {
        backButton.addEventListener("click", (event) => {
          event.preventDefault();
          location.hash = "#/dashboard";
        });
      }
      const editButton = this.appEl.querySelector('[data-action="edit-invitation"]');
      if (editButton) {
        editButton.addEventListener("click", (event) => {
          event.preventDefault();
          this.state.invitationFormVisible = true;
          this.renderInvitationBuilder();
        });
      }
      this.appEl.querySelectorAll("[data-style-id]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          const styleId = button.getAttribute("data-style-id");
          this.handleInvitationStyleChange(styleId);
        });
      });
      const downloadButton = this.appEl.querySelector('[data-action="download-invitation"]');
      if (downloadButton) {
        downloadButton.addEventListener("click", (event) => {
          event.preventDefault();
          this.handleInvitationDownload();
        });
      }
      const activateButton = this.appEl.querySelector('[data-action="activate-invitation"]');
      if (activateButton) {
        activateButton.addEventListener("click", (event) => {
          event.preventDefault();
          this.handleInvitationPublish();
        });
      }
      if (showForm) {
        const form = document.getElementById("invitation-form");
        if (form) {
          form.addEventListener("submit", (event) => this.handleInvitationFormSubmit(event));
          const closeButton = form.querySelector('[data-action="close-invitation-form"]');
          if (closeButton) {
            closeButton.addEventListener("click", (event) => {
              event.preventDefault();
              this.state.invitationFormVisible = false;
              this.renderInvitationBuilder();
            });
          }
        }
      }
    },
    handleInvitationFormSubmit(event) {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form) return;
      const formData = new FormData(form);
      const data = {
        groomName: this.normalizeInvitationInput(formData.get("groomName")),
        brideName: this.normalizeInvitationInput(formData.get("brideName")),
        weddingDate: this.normalizeInvitationInput(formData.get("weddingDate")),
        weddingTime: this.normalizeInvitationInput(formData.get("weddingTime")),
        venueName: this.normalizeInvitationInput(formData.get("venueName")),
        venueAddress: this.normalizeInvitationInput(formData.get("venueAddress")),
        giftCard: this.normalizeInvitationInput(formData.get("giftCard"))
      };
      const current = this.getInvitationData();
      const next = {
        ...current,
        ...data
      };
      if (!next.styleId && this.invitationStyles.length) {
        next.styleId = this.invitationStyles[0].id;
      }
      this.updateProfile({ invitation: next });
      this.state.invitationFormVisible = false;
      this.renderInvitationBuilder();
    },
    normalizeInvitationInput(value) {
      if (typeof value === "string") {
        return value.trim();
      }
      if (value == null) {
        return "";
      }
      return String(value).trim();
    },
    getInvitationData() {
      const profile = this.state.profile || {};
      const stored = profile.invitation && typeof profile.invitation === "object" ? profile.invitation : {};
      const defaultStyle = this.invitationStyles[0]?.id || "";
      return {
        groomName: stored.groomName || profile.groomName || "",
        brideName: stored.brideName || profile.brideName || "",
        weddingDate: stored.weddingDate || "",
        weddingTime: stored.weddingTime || "",
        venueName: stored.venueName || "",
        venueAddress: stored.venueAddress || "",
        giftCard: stored.giftCard || "",
        styleId: stored.styleId || defaultStyle
      };
    },
    getInvitationStyle(styleId) {
      if (!Array.isArray(this.invitationStyles) || !this.invitationStyles.length) {
        return {
          id: "default",
          name: "По умолчанию",
          palette: {
            background: "#ffffff",
            card: "#ffffff",
            accent: "#e07a8b",
            accentSoft: "rgba(224, 122, 139, 0.16)",
            text: "#2f2a3b",
            subtitle: "#6e6781",
            ornament: "rgba(224, 122, 139, 0.08)",
            ribbon: "rgba(224, 122, 139, 0.12)"
          }
        };
      }
      const found = this.invitationStyles.find((style) => style.id === styleId);
      return found || this.invitationStyles[0];
    },
    getInvitationThemeVariables(style) {
      if (!style || typeof style !== "object") {
        return "";
      }
      const palette = style.palette || {};
      const entries = Object.entries(palette).map(([key, value]) => `--invitation-${this.toKebabCase(key)}: ${value};`);
      return entries.join(" ");
    },
    toKebabCase(value) {
      return String(value || "")
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/[_\s]+/g, "-")
        .toLowerCase();
    },
    getInvitationCardMarkup(invitation, style) {
      const themeVars = this.getInvitationThemeVariables(style);
      const groomName = invitation.groomName || "Жених";
      const brideName = invitation.brideName || "Невеста";
      const dateLabel = this.formatInvitationDate(invitation.weddingDate) || "Укажите дату";
      const timeLabel = this.formatInvitationTime(invitation.weddingTime) || "Укажите время";
      const venueName = invitation.venueName || "Название площадки";
      const venueAddress = invitation.venueAddress || "Адрес площадки";
      const giftCard = invitation.giftCard ? this.formatGiftCard(invitation.giftCard) : "";
      const initials = this.getInvitationInitials(invitation);
      const hasGift = Boolean(giftCard);
      return `
        <article class="invitation-card" style="${themeVars}">
          <div class="invitation-card__ornament" aria-hidden="true"></div>
          <div class="invitation-card__inner">
            <span class="invitation-card__badge">Свадебное приглашение</span>
            <div class="invitation-card__initials" aria-hidden="true">${this.escapeHtml(initials)}</div>
            <h2 class="invitation-card__names">${this.escapeHtml(groomName)} <span>&amp;</span> ${this.escapeHtml(brideName)}</h2>
            <p class="invitation-card__subtitle">${this.escapeHtml(dateLabel)}</p>
            <p class="invitation-card__time">${this.escapeHtml(timeLabel)}</p>
            <div class="invitation-card__location">
              <h3>${this.escapeHtml(venueName)}</h3>
              <p>${this.escapeHtml(venueAddress)}</p>
            </div>
            <div class="invitation-card__divider" aria-hidden="true"></div>
            <p class="invitation-card__note">Мы будем счастливы разделить этот день с вами.</p>
            ${hasGift ? `<p class="invitation-card__gift"><span>Для подарков:</span> <strong>${this.escapeHtml(giftCard)}</strong></p>` : ""}
          </div>
          <div class="invitation-card__ribbon" aria-hidden="true"></div>
        </article>
      `;
    },
    renderInvitationPreview(invitation, style) {
      const cardMarkup = this.getInvitationCardMarkup(invitation, style);
      return `
        <div class="invitation-preview-frame">
          ${cardMarkup}
        </div>
      `;
    },
    renderInvitationDetails(invitation) {
      const items = [
        { label: "Жених", value: invitation.groomName || "Добавьте в анкете" },
        { label: "Невеста", value: invitation.brideName || "Добавьте в анкете" },
        { label: "Дата", value: this.formatInvitationDate(invitation.weddingDate) || "Укажите дату" },
        { label: "Время", value: this.formatInvitationTime(invitation.weddingTime) || "Укажите время" },
        { label: "Место", value: invitation.venueName || "Название площадки" },
        { label: "Адрес", value: invitation.venueAddress || "Адрес площадки" },
        { label: "Подарки", value: invitation.giftCard ? this.formatGiftCard(invitation.giftCard) : "Добавьте реквизиты" }
      ];
      const rows = items
        .map((item) => `
          <div class="invitation-details__item">
            <dt>${this.escapeHtml(item.label)}</dt>
            <dd>${this.escapeHtml(item.value)}</dd>
          </div>
        `)
        .join("");
      return `<dl class="invitation-details">${rows}</dl>`;
    },
    renderInvitationForm(invitation) {
      return `
        <div class="invitation-form-overlay" id="invitation-form-overlay" role="dialog" aria-modal="true" aria-labelledby="invitation-form-title">
          <form class="invitation-form" id="invitation-form">
            <h2 id="invitation-form-title">Анкета для приглашения</h2>
            <p>Заполните информацию — мы сразу покажем, как будет выглядеть сайт-приглашение.</p>
            <div class="invitation-form__grid">
              <div class="invitation-form__field">
                <label for="invitation-groom">Жених</label>
                <input id="invitation-groom" name="groomName" type="text" required value="${this.escapeHtml(invitation.groomName)}" placeholder="Иван">
              </div>
              <div class="invitation-form__field">
                <label for="invitation-bride">Невеста</label>
                <input id="invitation-bride" name="brideName" type="text" required value="${this.escapeHtml(invitation.brideName)}" placeholder="Анна">
              </div>
              <div class="invitation-form__field">
                <label for="invitation-date">Дата</label>
                <input id="invitation-date" name="weddingDate" type="date" required value="${this.escapeHtml(invitation.weddingDate)}">
              </div>
              <div class="invitation-form__field">
                <label for="invitation-time">Время</label>
                <input id="invitation-time" name="weddingTime" type="time" required value="${this.escapeHtml(invitation.weddingTime)}">
              </div>
              <div class="invitation-form__field">
                <label for="invitation-venue">Место (название)</label>
                <input id="invitation-venue" name="venueName" type="text" required value="${this.escapeHtml(invitation.venueName)}" placeholder="Банкетный зал «Вдохновение»">
              </div>
              <div class="invitation-form__field invitation-form__field--wide">
                <label for="invitation-address">Адрес</label>
                <input id="invitation-address" name="venueAddress" type="text" required value="${this.escapeHtml(invitation.venueAddress)}" placeholder="Москва, Берёзовая аллея, 15">
              </div>
              <div class="invitation-form__field invitation-form__field--wide">
                <label for="invitation-gift">Для денежных подарков (номер карты)</label>
                <input id="invitation-gift" name="giftCard" type="text" required value="${this.escapeHtml(invitation.giftCard)}" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000">
                <span class="invitation-form__hint">Мы аккуратно покажем номер карты в приглашении.</span>
              </div>
            </div>
            <div class="invitation-form__actions">
              <button type="button" class="secondary" data-action="close-invitation-form">Позже</button>
              <button type="submit">Сохранить</button>
            </div>
          </form>
        </div>
      `;
    },
    isInvitationComplete(invitation) {
      if (!invitation) return false;
      const requiredFields = [
        invitation.groomName,
        invitation.brideName,
        invitation.weddingDate,
        invitation.weddingTime,
        invitation.venueName,
        invitation.venueAddress,
        invitation.giftCard
      ];
      return requiredFields.every((value) => Boolean(this.normalizeInvitationInput(value)));
    },
    formatInvitationDate(rawDate) {
      const value = this.normalizeInvitationInput(rawDate);
      if (!value) return "";
      const parts = value.split("-").map((part) => Number(part));
      if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
        return value;
      }
      const [year, month, day] = parts;
      if (!year || !month || !day) {
        return value;
      }
      const monthName = monthNames[month - 1];
      if (!monthName) {
        return value;
      }
      const dayNumber = String(day);
      const monthLabel = monthName.toLowerCase();
      return `${dayNumber} ${monthLabel} ${year}`;
    },
    formatInvitationTime(rawTime) {
      const value = this.normalizeInvitationInput(rawTime);
      if (!value) return "";
      const match = value.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
      if (!match) {
        return value;
      }
      const hours = String(Math.min(23, Math.max(0, Number(match[1])))).padStart(2, "0");
      const minutes = match[2] != null ? String(Math.min(59, Math.max(0, Number(match[2])))).padStart(2, "0") : "00";
      return `${hours}:${minutes}`;
    },
    formatGiftCard(value) {
      const raw = this.normalizeInvitationInput(value);
      if (!raw) return "";
      const digits = raw.replace(/[^0-9]/g, "");
      if (digits.length >= 8) {
        return digits.replace(/(.{4})/g, "$1 ").trim();
      }
      return raw;
    },
    getInvitationInitials(invitation) {
      const makeInitial = (input) => {
        const value = this.normalizeInvitationInput(input);
        if (!value) return "";
        return value.charAt(0).toUpperCase();
      };
      const parts = [makeInitial(invitation?.groomName), makeInitial(invitation?.brideName)].filter(Boolean);
      if (parts.length === 2) {
        return `${parts[0]} ❤ ${parts[1]}`;
      }
      if (parts.length === 1) {
        return parts[0];
      }
      return "❤";
    },
    handleInvitationStyleChange(styleId) {
      if (!styleId) return;
      const nextStyle = this.invitationStyles.find((style) => style.id === styleId);
      if (!nextStyle) return;
      const current = this.getInvitationData();
      if (current.styleId === nextStyle.id) {
        return;
      }
      const next = {
        ...current,
        styleId: nextStyle.id
      };
      this.updateProfile({ invitation: next });
      this.renderInvitationBuilder();
    },
    handleInvitationDownload() {
      const invitation = this.getInvitationData();
      if (!this.isInvitationComplete(invitation)) {
        this.state.invitationFormVisible = true;
        this.renderInvitationBuilder();
        alert("Пожалуйста, заполните анкету, чтобы сохранить приглашение в PDF.");
        return;
      }
      this.openInvitationWindow({ mode: "pdf" });
    },
    handleInvitationPublish() {
      const invitation = this.getInvitationData();
      if (!this.isInvitationComplete(invitation)) {
        this.state.invitationFormVisible = true;
        this.renderInvitationBuilder();
        alert("Заполните анкету, чтобы активировать сайт-приглашение.");
        return;
      }
      this.openInvitationWindow({ mode: "site" });
    },
    openInvitationWindow({ mode }) {
      const invitation = this.getInvitationData();
      const style = this.getInvitationStyle(invitation.styleId);
      const html = this.buildInvitationPageHtml(invitation, style, { mode });
      const target = window.open("", "_blank");
      if (!target) {
        alert("Похоже, всплывающее окно заблокировано. Разрешите открытие новых вкладок и попробуйте снова.");
        return;
      }
      target.document.write(html);
      target.document.close();
      if (mode === "pdf") {
        target.focus();
        setTimeout(() => {
          try {
            target.print();
          } catch (error) {
            console.error("Не удалось запустить печать", error);
          }
        }, 350);
      }
    },
    buildInvitationPageHtml(invitation, style, { mode } = {}) {
      const pageTitle = `${invitation.groomName || "Жених"} & ${invitation.brideName || "Невеста"} — свадебное приглашение`;
      const descriptionParts = [];
      const formattedDate = this.formatInvitationDate(invitation.weddingDate);
      if (formattedDate) descriptionParts.push(formattedDate);
      const formattedTime = this.formatInvitationTime(invitation.weddingTime);
      if (formattedTime) descriptionParts.push(formattedTime);
      if (invitation.venueName) descriptionParts.push(invitation.venueName);
      if (invitation.venueAddress) descriptionParts.push(invitation.venueAddress);
      const metaDescription = descriptionParts.length ? descriptionParts.join(" • ") : "Свадебное приглашение";
      const cardMarkup = this.getInvitationCardMarkup(invitation, style);
      const footerNote = invitation.groomName && invitation.brideName
        ? `${invitation.groomName} и ${invitation.brideName} ждут вас на празднике любви.`
        : "Мы будем рады видеть вас на нашей свадьбе.";
      const styles = this.getInvitationStandaloneStyles();
      return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(pageTitle)}</title>
  <meta name="description" content="${this.escapeHtml(metaDescription)}">
  <style>${styles}</style>
</head>
<body>
  <main class="invitation-page">
    <div class="invitation-page__wrapper">
      ${cardMarkup}
      <p class="invitation-page__footer">${this.escapeHtml(footerNote)}</p>
    </div>
  </main>
</body>
</html>`;
    },
    getInvitationStandaloneStyles() {
      return `:root {
  color-scheme: light;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: 'Playfair Display', 'Georgia', 'Times New Roman', serif;
  background: linear-gradient(145deg, #f6f3f8 0%, #fdf7f9 100%);
  color: #2f2a3b;
}
.invitation-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem 4rem;
}
.invitation-page__wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}
.invitation-page__footer {
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  color: rgba(47, 42, 59, 0.72);
  text-align: center;
}
.invitation-card {
  position: relative;
  width: min(560px, 90vw);
  border-radius: 28px;
  padding: 2.75rem 2.5rem 3.25rem;
  background: var(--invitation-card, rgba(255, 255, 255, 0.85));
  color: var(--invitation-text, #2f2a3b);
  box-shadow: 0 30px 60px rgba(47, 42, 59, 0.18);
  overflow: hidden;
  backdrop-filter: blur(6px);
}
.invitation-card__ornament {
  position: absolute;
  inset: 0;
  background: var(--invitation-background, linear-gradient(140deg, rgba(255, 247, 251, 0.95), rgba(255, 238, 243, 0.8)));
  opacity: 1;
  z-index: 0;
}
.invitation-card__ribbon {
  position: absolute;
  inset: auto 12% 0;
  height: 120px;
  background: var(--invitation-ribbon, rgba(224, 122, 139, 0.12));
  z-index: 1;
  filter: blur(0.5px);
}
.invitation-card__inner {
  position: relative;
  z-index: 2;
  text-align: center;
  display: grid;
  gap: 1rem;
}
.invitation-card__badge {
  align-self: start;
  justify-self: center;
  padding: 0.35rem 1.25rem;
  border-radius: 999px;
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  background: var(--invitation-accent-soft, rgba(224, 122, 139, 0.16));
  color: var(--invitation-subtitle, #725661);
}
.invitation-card__initials {
  font-size: 2.4rem;
  color: var(--invitation-subtitle, #725661);
  letter-spacing: 0.2em;
}
.invitation-card__names {
  margin: 0;
  font-size: clamp(2.4rem, 5vw, 3.4rem);
  font-weight: 600;
  letter-spacing: 0.05em;
}
.invitation-card__names span {
  color: var(--invitation-accent, #d66a7a);
}
.invitation-card__subtitle {
  margin: 0;
  font-size: 1.25rem;
  color: var(--invitation-subtitle, #725661);
  letter-spacing: 0.05em;
}
.invitation-card__time {
  margin: 0;
  font-size: 1.1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.invitation-card__location {
  margin-top: 0.5rem;
  display: grid;
  gap: 0.35rem;
}
.invitation-card__location h3 {
  margin: 0;
  font-size: 1.25rem;
}
.invitation-card__location p {
  margin: 0;
  font-size: 1rem;
  color: var(--invitation-subtitle, #725661);
}
.invitation-card__divider {
  width: 60%;
  height: 1px;
  background: var(--invitation-ornament, rgba(214, 106, 122, 0.18));
  justify-self: center;
  margin: 0.75rem auto 0;
}
.invitation-card__note {
  margin: 0;
  font-size: 1.05rem;
}
.invitation-card__gift {
  margin: 0;
  font-size: 1rem;
  color: var(--invitation-subtitle, #725661);
}
.invitation-card__gift span {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  display: block;
  margin-bottom: 0.25rem;
}
.invitation-card__gift strong {
  font-size: 1.1rem;
  color: var(--invitation-accent, #d66a7a);
}
@media print {
  body {
    background: #ffffff;
  }
  .invitation-page {
    padding: 0;
  }
  .invitation-page__footer {
    display: none;
  }
  .invitation-card {
    box-shadow: none;
    width: 100%;
    max-width: none;
    border-radius: 0;
  }
}
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
          const phone = button.dataset.vendorPhone || "";
          this.showMarketplaceContact(vendorName, phone, button);
        });
      });
      this.appEl.querySelectorAll('[data-action="marketplace-favorite"]').forEach((button) => {
        button.addEventListener("click", () => {
          const vendorId = button.dataset.vendorId || "";
          this.toggleMarketplaceFavorite(vendorId);
        });
      });
      this.animateBudget(previousTotal, totalBudget);
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
      const toolRoute = element?.dataset?.toolRoute;
      if (toolRoute) {
        if (event) {
          event.preventDefault();
        }
        this.ensureProfile();
        location.hash = toolRoute;
        return;
      }
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
    formatPhoneLink(phone) {
      if (typeof phone !== "string") {
        return "+79998671749";
      }
      const digits = phone.replace(/\D+/g, "");
      if (!digits) {
        return "+79998671749";
      }
      if (digits.startsWith("7")) {
        return `+${digits}`;
      }
      if (digits.startsWith("8") && digits.length === 11) {
        return `+7${digits.slice(1)}`;
      }
      if (digits.startsWith("00")) {
        return `+${digits.slice(2)}`;
      }
      return digits.startsWith("+") ? digits : `+${digits}`;
    },
    showMarketplaceContact(vendorName, phone, trigger) {
      const safeName = this.escapeHtml(vendorName || "подрядчика");
      const displayPhone = typeof phone === "string" && phone.trim().length ? phone.trim() : "+7 (999) 867 17 49";
      const safePhone = this.escapeHtml(displayPhone);
      const phoneHref = this.escapeHtml(this.formatPhoneLink(displayPhone));
      this.state.modalOpen = true;
      this.state.lastFocused = trigger || document.activeElement;
      const titleEl = document.getElementById("modal-title");
      if (titleEl) {
        titleEl.textContent = "Контакты подрядчика";
      }
      this.modalBody.innerHTML = `
        <p>Свяжитесь с <strong>${safeName}</strong> и обсудите детали свадьбы.</p>
        <p class="modal-phone">
          <span class="modal-phone__label">Телефон</span>
          <a class="modal-phone__value" href="tel:${phoneHref}">${safePhone}</a>
        </p>
        <p class="modal-note">Позвоните и расскажите подрядчику о вашем празднике.</p>
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
        this.syncMarketplaceFavoritesFromProfile(profile);
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
      this.state.marketplaceFavorites = new Set();
      this.state.marketplaceSelections = {};
    }
  };

  window.App = App;
  document.addEventListener("DOMContentLoaded", () => App.init());
})();
