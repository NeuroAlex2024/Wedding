(function () {
  const messageEl = document.getElementById("invitation-message");
  const container = document.getElementById("invitation-container");

  function showMessage(text) {
    if (messageEl) {
      messageEl.textContent = text;
    }
    if (container) {
      container.removeAttribute("hidden");
    }
  }

  function redirectToSlug(slug) {
    const trimmed = slug.trim();
    if (!trimmed) {
      showMessage("Ссылка не содержит идентификатор приглашения.");
      return;
    }
    const safeSlug = encodeURIComponent(trimmed);
    const target = `/invite/${safeSlug}`;
    showMessage("Перенаправляем на страницу приглашения...");
    window.location.replace(target);
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug") || params.get("id") || "";
    if (slug) {
      redirectToSlug(slug);
      return;
    }
  } catch (error) {
    console.error("Не удалось разобрать параметры приглашения", error);
    showMessage("Не удалось разобрать ссылку. Введите корректный адрес приглашения.");
    return;
  }

  showMessage(
    "Укажите идентификатор приглашения в ссылке (например, invitation.html?id=romadasha-14-10-25)."
  );
})();
