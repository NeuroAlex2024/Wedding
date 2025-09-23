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
  {
    id: "task-1",
    title: "Выбрать дату и площадку",
    done: false,
    order: 1,
    type: "task",
    folderId: null
  },
  {
    id: "task-2",
    title: "Согласовать бюджет с партнёром",
    done: false,
    order: 2,
    type: "task",
    folderId: null
  },
  {
    id: "task-3",
    title: "Составить список гостей",
    done: false,
    order: 3,
    type: "task",
    folderId: null
  }
];

const DEFAULT_CHECKLIST_FOLDERS = [];

const CHECKLIST_FOLDER_COLORS = [
  "#F5D0D4",
  "#F9E5C0",
  "#D8F0E3",
  "#DDE6FA",
  "#F3DFFD",
  "#FFE4F0"
];

const DEFAULT_BUDGET_ENTRIES = [
  { id: "budget-venue", title: "Площадка", amount: 250000 },
  { id: "budget-decor", title: "Декор и флористика", amount: 90000 },
  { id: "budget-photo", title: "Фото и видео", amount: 120000 }
];

const MARKETPLACE_IMAGES = [
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?q=80&w=2969&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1525772764200-be829a350797?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1485700281629-290c5a704409?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
];

const CONTRACTOR_MARKETPLACE = [
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
        location: "Москва · Подмосковье"
      },
      {
        id: "photo-alina",
        name: "Фотограф Алина",
        tagline: "Помогу прожить день без позирования и сохранить эмоции семьи.",
        price: 19000,
        rating: 4.8,
        reviews: 842,
        image: MARKETPLACE_IMAGES[1],
        location: "Санкт-Петербург"
      },
      {
        id: "photo-arseniy",
        name: "Фотограф Арсений",
        tagline: "Пленочная эстетика и авторский цвет для атмосферных историй.",
        price: 27000,
        rating: 4.7,
        reviews: 623,
        image: MARKETPLACE_IMAGES[2],
        location: "Казань"
      }
    ]
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
        location: "Москва"
      },
      {
        id: "video-anna",
        name: "Видеограф Анна",
        tagline: "Верну вас в эмоции дня за 5 минут экранного времени.",
        price: 21000,
        rating: 4.8,
        reviews: 412,
        image: MARKETPLACE_IMAGES[3],
        location: "Сочи"
      },
      {
        id: "video-timur",
        name: "Видеограф Тимур",
        tagline: "Динамичные ролики с дрона и стильные тизеры в соцсети.",
        price: 23000,
        rating: 4.6,
        reviews: 287,
        image: MARKETPLACE_IMAGES[0],
        location: "Екатеринбург"
      }
    ]
  },
  {
    id: "catering",
    title: "Кейтеринг",
    contractors: [
      {
        id: "catering-gastroparty",
        name: "GastroParty",
        tagline: "Авторские сет-меню с открытой кухней и live станциями.",
        price: 30000,
        rating: 4.8,
        reviews: 657,
        image: MARKETPLACE_IMAGES[4],
        location: "Москва"
      },
      {
        id: "catering-lavanda",
        name: "Кейтеринг Лаванда",
        tagline: "Средиземноморский стол с акцентом на локальные продукты.",
        price: 22000,
        rating: 4.7,
        reviews: 489,
        image: MARKETPLACE_IMAGES[2],
        location: "Краснодар"
      },
      {
        id: "catering-artfood",
        name: "ArtFood",
        tagline: "Фуршет + банкет, персональные дегустации и сладкий стол.",
        price: 26000,
        rating: 4.9,
        reviews: 915,
        image: MARKETPLACE_IMAGES[3],
        location: "Санкт-Петербург"
      }
    ]
  },
  {
    id: "florists",
    title: "Флористы",
    contractors: [
      {
        id: "florist-maria",
        name: "Флорист Мария",
        tagline: "Воздушные букеты и декор церемонии в пастельных тонах.",
        price: 18000,
        rating: 4.9,
        reviews: 743,
        image: MARKETPLACE_IMAGES[0],
        location: "Москва"
      },
      {
        id: "florist-botanika",
        name: "Botanika",
        tagline: "Минимализм, живой мох и акценты из редких сортов цветов.",
        price: 15000,
        rating: 4.7,
        reviews: 381,
        image: MARKETPLACE_IMAGES[4],
        location: "Санкт-Петербург"
      },
      {
        id: "florist-les",
        name: "Студия Лес",
        tagline: "Ботанический стиль, подвесные инсталляции и арки любой сложности.",
        price: 20000,
        rating: 4.8,
        reviews: 529,
        image: MARKETPLACE_IMAGES[2],
        location: "Калининград"
      }
    ]
  },
  {
    id: "car-rentals",
    title: "Аренда машин",
    contractors: [
      {
        id: "cars-santorini",
        name: "Кабриолет \"Санторини\"",
        tagline: "Ретро кабриолет 1968 года с водителем в стиле old money.",
        price: 27000,
        rating: 4.8,
        reviews: 218,
        image: MARKETPLACE_IMAGES[1],
        location: "Москва"
      },
      {
        id: "cars-luxride",
        name: "LuxRide",
        tagline: "Флот бизнес-класса, welcome-зона с шампанским в пути.",
        price: 24000,
        rating: 4.7,
        reviews: 354,
        image: MARKETPLACE_IMAGES[3],
        location: "Сочи"
      },
      {
        id: "cars-prestigecar",
        name: "PrestigeCar",
        tagline: "Mercedes S-class и minivan для гостей с белым декором.",
        price: 30000,
        rating: 5.0,
        reviews: 487,
        image: MARKETPLACE_IMAGES[4],
        location: "Санкт-Петербург"
      }
    ]
  },
  {
    id: "attire-studios",
    title: "Студии платьев и костюмов",
    contractors: [
      {
        id: "attire-aquarelle",
        name: "Студия Aquarelle",
        tagline: "Индивидуальные примерки и корректировка силуэта за сутки.",
        price: 25000,
        rating: 4.9,
        reviews: 688,
        image: MARKETPLACE_IMAGES[0],
        location: "Москва"
      },
      {
        id: "attire-gentlemen",
        name: "Gentlemen",
        tagline: "Костюмы-трансформеры и аксессуары под цвет букета невесты.",
        price: 17000,
        rating: 4.6,
        reviews: 241,
        image: MARKETPLACE_IMAGES[2],
        location: "Нижний Новгород"
      },
      {
        id: "attire-whiteroom",
        name: "Салон WhiteRoom",
        tagline: "Кутюрные платья, выездной стилист и услуга steam-care.",
        price: 28000,
        rating: 4.8,
        reviews: 915,
        image: MARKETPLACE_IMAGES[1],
        location: "Санкт-Петербург"
      }
    ]
  },
  {
    id: "hosts",
    title: "Ведущие",
    contractors: [
      {
        id: "host-andrey",
        name: "Ведущий Андрей",
        tagline: "Интеллигентный юмор, живой вокал и welcome для гостей.",
        price: 20000,
        rating: 4.9,
        reviews: 803,
        image: MARKETPLACE_IMAGES[3],
        location: "Москва"
      },
      {
        id: "host-ekaterina",
        name: "Ведущая Екатерина",
        tagline: "Сценарий без конкурсов, интерактивы с друзьями и родителями.",
        price: 21000,
        rating: 4.8,
        reviews: 654,
        image: MARKETPLACE_IMAGES[4],
        location: "Санкт-Петербург"
      },
      {
        id: "host-mikhail",
        name: "Ведущий Михаил",
        tagline: "Командная работа с диджеем и внимание к таймингу.",
        price: 19000,
        rating: 4.7,
        reviews: 512,
        image: MARKETPLACE_IMAGES[0],
        location: "Казань"
      }
    ]
  },
  {
    id: "djs",
    title: "Диджеи",
    contractors: [
      {
        id: "dj-skybeat",
        name: "Диджей SkyBeat",
        tagline: "Лайв миксы на саксофоне и плейлист под ваш first dance.",
        price: 15000,
        rating: 4.8,
        reviews: 420,
        image: MARKETPLACE_IMAGES[2],
        location: "Москва"
      },
      {
        id: "dj-neon",
        name: "DJ Neon",
        tagline: "House + pop mashup, световое шоу и фотозона с винилом.",
        price: 13000,
        rating: 4.6,
        reviews: 311,
        image: MARKETPLACE_IMAGES[1],
        location: "Сочи"
      },
      {
        id: "dj-luna",
        name: "Диджей Luna",
        tagline: "R&B-сеты на закате и ночная афтерпати до рассвета.",
        price: 16000,
        rating: 4.9,
        reviews: 502,
        image: MARKETPLACE_IMAGES[4],
        location: "Санкт-Петербург"
      }
    ]
  },
  {
    id: "jewelry",
    title: "Ювелирные магазины",
    contractors: [
      {
        id: "jewelry-aurora",
        name: "Дом Aurora",
        tagline: "Индивидуальные гравировки, платина и этичные камни.",
        price: 30000,
        rating: 4.9,
        reviews: 1576,
        image: MARKETPLACE_IMAGES[3],
        location: "Москва"
      },
      {
        id: "jewelry-northlight",
        name: "NorthLight",
        tagline: "Минималистичные кольца, русское золото и lifetime уход.",
        price: 12000,
        rating: 4.7,
        reviews: 638,
        image: MARKETPLACE_IMAGES[2],
        location: "Санкт-Петербург"
      },
      {
        id: "jewelry-monogold",
        name: "MonoGold",
        tagline: "Лаб-гемы, кастомный оттенок металла и 3D-примерка.",
        price: 15000,
        rating: 4.8,
        reviews: 452,
        image: MARKETPLACE_IMAGES[0],
        location: "Новосибирск"
      }
    ]
  }
];
