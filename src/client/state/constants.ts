export const ATMOSPHERE_OPTIONS = [
  "Классическая",
  "Романтичная",
  "Уютная",
  "Роскошная",
  "Современная",
  "Бохо",
  "Рустик",
  "Минималистичная",
] as const;

export const STYLE_OPTIONS = [
  "Минимализм",
  "Классика",
  "Рустик",
  "Бохо",
  "Современный",
  "Ретро",
  "Гламур",
  "Винтаж",
] as const;

export const CITIES_TOP10 = [
  "Москва",
  "Санкт-Петербург",
  "Казань",
  "Сочи",
  "Калининград",
  "Нижний Новгород",
  "Екатеринбург",
  "Краснодар",
  "Ростов-на-Дону",
  "Самара",
] as const;

export const BUDGET_RANGES = [
  "До 200 тыс ₽",
  "200–400 тыс ₽",
  "400–700 тыс ₽",
  "700 тыс – 1 млн ₽",
  "1–2 млн ₽",
  "От 2 млн ₽",
] as const;

export const DASHBOARD_NAV_ITEMS = [
  { id: "venues", title: "Место проведения" },
  { id: "vendors", title: "Подрядчики" },
  { id: "tools", title: "Инструменты" },
  { id: "checklist", title: "Чек лист" },
  { id: "budget", title: "Бюджет" },
  { id: "blog", title: "Блог" },
] as const;

export const DASHBOARD_TOOL_ITEMS = [
  { id: "tools-test", title: "Тест", description: "Спланируйте идеальную свадьбу" },
  { id: "tools-budget", title: "Бюджет", description: "Следите за расходами" },
  { id: "tools-guests", title: "Список гостей", description: "Отправляйте приглашения" },
  { id: "tools-website", title: "Сайт-приглашение", description: "Поделитесь деталями" },
  { id: "tools-booked", title: "Забронировано", description: "Контролируйте статусы" },
  { id: "tools-favorites", title: "Избранное", description: "Сохраняйте лучшие идеи" },
] as const;

export const DEFAULT_CHECKLIST_ITEMS = [
  {
    id: "task-1",
    title: "Выбрать дату и площадку",
    done: false,
    order: 1,
    type: "task",
    folderId: null,
  },
  {
    id: "task-2",
    title: "Согласовать бюджет с партнёром",
    done: false,
    order: 2,
    type: "task",
    folderId: null,
  },
  {
    id: "task-3",
    title: "Составить список гостей",
    done: false,
    order: 3,
    type: "task",
    folderId: null,
  },
] as const;

export const DEFAULT_CHECKLIST_FOLDERS: never[] = [];

export const CHECKLIST_FOLDER_COLORS = [
  "#F5D0D4",
  "#F9E5C0",
  "#D8F0E3",
  "#DDE6FA",
  "#F3DFFD",
  "#FFE4F0",
] as const;

export const DEFAULT_BUDGET_ENTRIES = [
  { id: "budget-venue", title: "Площадка", amount: 250000 },
  { id: "budget-decor", title: "Декор и флористика", amount: 90000 },
  { id: "budget-photo", title: "Фото и видео", amount: 120000 },
] as const;

export const MARKETPLACE_IMAGES = [
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?q=80&w=2969&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1525772764200-be829a350797?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1485700281629-290c5a704409?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
] as const;

export const MARKETPLACE_CONTACT_PHONE = "+7 (999) 867 17 49";

export const CONTRACTOR_MARKETPLACE = [
  {
    id: "photographers",
    title: "Фотографы",
    contractors: [
      {
        id: "photo-vladimir",
        name: "Фотограф Владимир",
        tagline: "Теплые репортажи и нежные портреты в любом освещении.",
        price: 24000,
        rating: 4.9,
        reviews: 1159,
        image: MARKETPLACE_IMAGES[0],
        location: "Москва · Подмосковье",
        phone: MARKETPLACE_CONTACT_PHONE,
      },
      {
        id: "photo-alina",
        name: "Фотограф Алина",
        tagline: "Помогу прожить день без позирования и сохранить эмоции семьи.",
        price: 19000,
        rating: 4.8,
        reviews: 842,
        image: MARKETPLACE_IMAGES[1],
        location: "Санкт-Петербург",
        phone: MARKETPLACE_CONTACT_PHONE,
      },
      {
        id: "photo-arseniy",
        name: "Фотограф Арсений",
        tagline: "Пленочная эстетика и авторский цвет для атмосферных историй.",
        price: 27000,
        rating: 4.7,
        reviews: 623,
        image: MARKETPLACE_IMAGES[2],
        location: "Казань",
        phone: MARKETPLACE_CONTACT_PHONE,
      },
      {
        id: "photo-natalia",
        name: "Фотограф Наталия",
        tagline: "Светоносные портреты и съемка утра невесты без спешки.",
        price: 22000,
        rating: 4.9,
        reviews: 982,
        image: MARKETPLACE_IMAGES[3],
        location: "Сочи",
        phone: MARKETPLACE_CONTACT_PHONE,
      },
      {
        id: "photo-ilya",
        name: "Фотограф Илья",
        tagline: "Документальная съемка и искренние кадры гостей в моменте.",
        price: 17000,
        rating: 4.5,
        reviews: 311,
        image: MARKETPLACE_IMAGES[4],
        location: "Новосибирск",
        phone: MARKETPLACE_CONTACT_PHONE,
      },
      {
        id: "photo-darina",
        name: "Фотограф Дарина",
        tagline: "Большие свадьбы с ассистентом и экспресс-галерея за 48 часов.",
        price: 26000,
        rating: 4.8,
        reviews: 753,
        image: MARKETPLACE_IMAGES[0],
        location: "Екатеринбург",
        phone: MARKETPLACE_CONTACT_PHONE,
      },
    ],
  },
  {
    id: "videographers",
    title: "Видеографы",
    contractors: [
      {
        id: "video-sergey",
        name: "Видеограф Сергей",
        tagline: "Cinemagraph-подача, звук с петель и премиальный монтаж.",
        price: 26000,
        rating: 4.9,
        reviews: 534,
        image: MARKETPLACE_IMAGES[1],
        location: "Москва",
        phone: MARKETPLACE_CONTACT_PHONE,
      },
      {
        id: "video-anna",
        name: "Видеограф Анна",
        tagline: "Утренние сборы, церемония и монтаж тизера за 3 дня.",
        price: 23000,
        rating: 4.8,
        reviews: 421,
        image: MARKETPLACE_IMAGES[2],
        location: "Санкт-Петербург",
        phone: MARKETPLACE_CONTACT_PHONE,
      },
      {
        id: "video-oleg",
        name: "Видеограф Олег",
        tagline: "Документальный стиль и живой звук без постановок.",
        price: 21000,
        rating: 4.6,
        reviews: 302,
        image: MARKETPLACE_IMAGES[3],
        location: "Казань",
        phone: MARKETPLACE_CONTACT_PHONE,
      },
    ],
  },
] as const;
