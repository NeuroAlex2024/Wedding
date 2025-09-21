const ATMOSPHERE_OPTIONS = [
  "Классическая",
  "Романтичная",
  "Уютная",
  "Роскошная",
  "Современная",
  "Бохо",
  "Рустик",
  "Минималистичная"
];

const STYLE_OPTIONS = [
  "Минимализм",
  "Классика",
  "Рустик",
  "Бохо",
  "Современный",
  "Ретро",
  "Гламур",
  "Винтаж"
];

const CITIES_TOP10 = [
  "Москва",
  "Санкт-Петербург",
  "Казань",
  "Сочи",
  "Калининград",
  "Нижний Новгород",
  "Екатеринбург",
  "Краснодар",
  "Ростов-на-Дону",
  "Самара"
];

const BUDGET_RANGES = [
  "До 200 тыс ₽",
  "200–400 тыс ₽",
  "400–700 тыс ₽",
  "700 тыс – 1 млн ₽",
  "1–2 млн ₽",
  "От 2 млн ₽"
];

const DASHBOARD_NAV_ITEMS = [
  { id: "nav-venues", label: "Место проведения" },
  { id: "nav-vendors", label: "Подрядчики" },
  { id: "nav-tools", label: "Инструменты" },
  { id: "nav-checklist", label: "Контрольный список" },
  { id: "nav-budget", label: "Бюджет" },
  { id: "nav-blog", label: "Блог" }
];

const TOOL_MODULE_ITEMS = [
  { id: "tool-budget", label: "Бюджет", icon: "💰" },
  { id: "tool-guests", label: "Список гостей", icon: "📝" },
  { id: "tool-website", label: "Сайт-приглашение", icon: "🌐" },
  { id: "tool-booked", label: "Забронировано", icon: "📌" },
  { id: "tool-favourites", label: "Избранное", icon: "⭐" }
];

const DEFAULT_CHECKLIST_TASKS = [
  { id: "task-venue", text: "Выбрать и забронировать площадку", done: false },
  { id: "task-budget", text: "Согласовать ключевые статьи бюджета", done: false },
  { id: "task-guests", text: "Составить предварительный список гостей", done: false }
];

const DEFAULT_BUDGET_ITEMS = [
  { id: "budget-venue", title: "Площадка и банкет", amount: 220000 },
  { id: "budget-photo", title: "Фото и видео", amount: 80000 },
  { id: "budget-decor", title: "Декор и флористика", amount: 60000 }
];
