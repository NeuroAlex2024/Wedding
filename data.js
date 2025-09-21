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

const DASHBOARD_LINKS = [
  { id: "venues", label: "Место проведения" },
  { id: "vendors", label: "Подрядчики" },
  { id: "tools", label: "Инструменты" },
  { id: "checklist", label: "Контрольный список" },
  { id: "budget", label: "Бюджет" },
  { id: "blog", label: "Блог" }
];

const DASHBOARD_TOOLS = [
  {
    id: "budget",
    title: "Бюджет",
    description: "Следите за расходами и планом финансирования.",
    icon: "💰"
  },
  {
    id: "guests",
    title: "Список гостей",
    description: "Отмечайте RSVP и контролируйте посадочные места.",
    icon: "📝"
  },
  {
    id: "website",
    title: "Сайт-приглашение",
    description: "Создайте сайт, чтобы гости узнали детали праздника.",
    icon: "🌐"
  },
  {
    id: "booked",
    title: "Забронировано",
    description: "Сводка всех подтвержденных подрядчиков и услуг.",
    icon: "📌"
  },
  {
    id: "favorites",
    title: "Избранное",
    description: "Сохраняйте лучших подрядчиков и вдохновение.",
    icon: "⭐"
  }
];

const DEFAULT_CHECKLIST = [
  { id: "task-venue", title: "Определиться с местом проведения", completed: false },
  { id: "task-budget", title: "Согласовать общий бюджет свадьбы", completed: false },
  { id: "task-guests", title: "Составить предварительный список гостей", completed: false }
];

const DEFAULT_BUDGET_ITEMS = [
  { id: "budget-venue", title: "Площадка", amount: 250000 },
  { id: "budget-decor", title: "Декор и флористика", amount: 120000 },
  { id: "budget-photo", title: "Фото и видео", amount: 180000 }
];

const BUDGET_COLORS = [
  "#e07a8b",
  "#f29b9c",
  "#f8b26a",
  "#8ac6d1",
  "#b497e0",
  "#7fc8a9"
];
