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
  { id: "venues", title: "Место проведения" },
  { id: "vendors", title: "Подрядчики" },
  { id: "tools", title: "Инструменты" },
  { id: "checklist", title: "Чек лист" },
  { id: "budget", title: "Бюджет" },
  { id: "blog", title: "Блог" }
];

const DASHBOARD_TOOL_ITEMS = [
  { id: "tools-test", title: "Тест", description: "Спланируйте идеальную свадьбу" },
  { id: "tools-budget", title: "Бюджет", description: "Следите за расходами" },
  { id: "tools-guests", title: "Список гостей", description: "Отправляйте приглашения" },
  { id: "tools-website", title: "Сайт-приглашение", description: "Поделитесь деталями" },
  { id: "tools-booked", title: "Забронировано", description: "Контролируйте статусы" },
  { id: "tools-favorites", title: "Избранное", description: "Сохраняйте лучшие идеи" }
];

const DEFAULT_CHECKLIST_ITEMS = [
  { id: "task-1", title: "Выбрать дату и площадку", done: false, folderId: null },
  { id: "task-2", title: "Согласовать бюджет с партнёром", done: false, folderId: null },
  { id: "task-3", title: "Составить список гостей", done: false, folderId: null }
];

const DEFAULT_BUDGET_ENTRIES = [
  { id: "budget-venue", title: "Площадка", amount: 250000 },
  { id: "budget-decor", title: "Декор и флористика", amount: 90000 },
  { id: "budget-photo", title: "Фото и видео", amount: 120000 }
];
