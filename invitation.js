(function () {
  const STORAGE_PREFIX = "wedding_invitation_public_";
  const monthNames = [
    "Января",
    "Февраля",
    "Марта",
    "Апреля",
    "Мая",
    "Июня",
    "Июля",
    "Августа",
    "Сентября",
    "Октября",
    "Ноября",
    "Декабря"
  ];

  const root = document.getElementById("invitation-root");
  const errorBlock = document.getElementById("invitation-error");
  const errorMessage = document.getElementById("invitation-error-message");
  const taglineEl = document.getElementById("invitation-tagline");
  const namesEl = document.getElementById("invitation-names");
  const dateEl = document.getElementById("invitation-date");
  const venueNameEl = document.getElementById("invitation-venue-name");
  const venueAddressEl = document.getElementById("invitation-venue-address");
  const giftBlock = document.getElementById("invitation-gift");
  const giftValueEl = document.getElementById("invitation-gift-value");

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(value) {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthName = monthNames[month] || "";
    return `${day} ${monthName.toLowerCase()} ${year}`.trim();
  }

  function formatTime(value) {
    if (!value) {
      return "";
    }
    const parts = value.split(":");
    if (parts.length >= 2) {
      const [hours, minutes] = parts;
      if (hours.length === 2 && minutes.length === 2) {
        return `${hours}:${minutes}`;
      }
    }
    return value;
  }

  function showError(message) {
    if (root) {
      root.setAttribute("hidden", "hidden");
    }
    if (errorBlock) {
      errorBlock.removeAttribute("hidden");
    }
    if (errorMessage) {
      errorMessage.textContent = message;
    }
    document.title = "Приглашение недоступно";
  }

  function applyTheme(theme) {
    if (!theme || typeof theme !== "object") {
      return;
    }
    const rootStyle = document.documentElement.style;
    const colors = theme.colors || {};
    if (theme.fontLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = theme.fontLink;
      document.head.appendChild(link);
    }
    const mappings = {
      "--bg": colors.background,
      "--card": colors.card,
      "--accent": colors.accent,
      "--accent-soft": colors.accentSoft,
      "--text": colors.text,
      "--muted": colors.muted,
      "--pattern": colors.pattern,
      "--heading-font": theme.headingFont,
      "--body-font": theme.bodyFont
    };
    Object.keys(mappings).forEach((key) => {
      const value = mappings[key];
      if (typeof value === "string" && value.trim().length) {
        rootStyle.setProperty(key, value);
      }
    });
  }

  function renderInvitation(payload) {
    if (!payload || typeof payload !== "object") {
      showError("Не удалось прочитать данные приглашения.");
      return;
    }
    const invitation = payload.invitation || {};
    const theme = payload.theme || {};
    applyTheme(theme);

    const groom = invitation.groom && invitation.groom.trim().length ? invitation.groom.trim() : "Жених";
    const bride = invitation.bride && invitation.bride.trim().length ? invitation.bride.trim() : "Невеста";
    const dateText = formatDate(invitation.date);
    const timeText = formatTime(invitation.time);
    const venueName = invitation.venueName && invitation.venueName.trim().length ? invitation.venueName.trim() : "Место проведения";
    const venueAddressRaw = invitation.venueAddress && invitation.venueAddress.trim().length ? invitation.venueAddress.trim() : "Адрес уточняется";
    const giftCard = invitation.giftCard && invitation.giftCard.trim().length ? invitation.giftCard.trim() : "";

    const dateParts = [];
    if (dateText) dateParts.push(dateText);
    if (timeText) dateParts.push(timeText);
    const dateLine = dateParts.join(" · ") || "Дата уточняется";

    if (taglineEl) {
      taglineEl.textContent = theme.tagline && theme.tagline.trim().length ? theme.tagline.trim() : "Приглашение";
    }
    if (namesEl) {
      namesEl.textContent = `${groom} и ${bride}`;
    }
    if (dateEl) {
      dateEl.textContent = dateLine;
    }
    if (venueNameEl) {
      venueNameEl.textContent = venueName;
    }
    if (venueAddressEl) {
      venueAddressEl.innerHTML = escapeHtml(venueAddressRaw).replace(/\n/g, "<br>");
    }
    if (giftBlock && giftValueEl) {
      if (giftCard) {
        giftValueEl.textContent = giftCard;
        giftBlock.removeAttribute("hidden");
      } else {
        giftBlock.setAttribute("hidden", "hidden");
      }
    }

    document.title = `${groom} и ${bride} — приглашение`;

    if (errorBlock) {
      errorBlock.setAttribute("hidden", "hidden");
    }
    if (root) {
      root.removeAttribute("hidden");
    }
  }

  function loadInvitation() {
    let id = "";
    try {
      const params = new URLSearchParams(window.location.search);
      id = params.get("id") || params.get("code") || "";
    } catch (error) {
      console.error("Не удалось разобрать параметры ссылки", error);
    }
    if (!id) {
      showError("Ссылка на приглашение не содержит идентификатор.");
      return;
    }
    let raw = null;
    try {
      raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    } catch (error) {
      console.error("Не удалось прочитать приглашение из localStorage", error);
      showError("Браузер запретил доступ к данным приглашения. Проверьте настройки приватности.");
      return;
    }
    if (!raw) {
      showError("Приглашение не найдено. Активируйте ссылку в конструкторе и попробуйте снова.");
      return;
    }
    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      console.error("Не удалось распаковать данные приглашения", error);
      showError("Данные приглашения повреждены. Активируйте ссылку ещё раз.");
      return;
    }
    renderInvitation(payload);
  }

  document.addEventListener("DOMContentLoaded", loadInvitation);
})();
