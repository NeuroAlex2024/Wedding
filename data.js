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
  { id: "nav-venue", label: "Место проведения" },
  { id: "nav-contractors", label: "Подрядчики" },
  { id: "nav-tools", label: "Инструменты" },
  { id: "nav-checklist", label: "Контрольный список" },
  { id: "nav-budget", label: "Бюджет" },
  { id: "nav-blog", label: "Блог" }
];

const TOOL_MODULE_ITEMS = [
  { id: "tool-budget", title: "Бюджет", description: "Следите за расходами и планом" },
  { id: "tool-guests", title: "Список гостей", description: "Формируйте и отслеживайте RSVР" },
  { id: "tool-website", title: "Сайт-приглашение", description: "Создайте страницу для гостей" },
  { id: "tool-booked", title: "Забронировано", description: "Все подтверждённые поставщики" },
  { id: "tool-favorites", title: "Избранное", description: "Любимые идеи и подрядчики" }
];

const DEFAULT_TASKS = [
  "Определиться с датой и стилем свадьбы",
  "Составить предварительный список гостей",
  "Рассчитать ориентировочный бюджет"
];

const DEFAULT_BUDGET_ITEMS = [
  { id: "budget-venue", label: "Площадка", amount: 320000 },
  { id: "budget-photo", label: "Фото и видео", amount: 120000 },
  { id: "budget-decor", label: "Декор и флористика", amount: 95000 }
];

const BUDGET_RANGE_TARGETS = {
  "До 200 тыс ₽": 200000,
  "200–400 тыс ₽": 400000,
  "400–700 тыс ₽": 700000,
  "700 тыс – 1 млн ₽": 1000000,
  "1–2 млн ₽": 2000000,
  "От 2 млн ₽": 2500000
};
