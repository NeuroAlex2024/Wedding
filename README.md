# Wedding

Сервис для создания и публикации цифровых свадебных приглашений. Сервер на Express генерирует статический `index.html` по данным пары и теме оформления и публикует его по адресу вида `/invite/<slug>`.

### Что делает проект
- **Конструктор**: клиентская часть (`src/client`) для подготовки данных приглашения.
- **Публикация**: API `POST /api/invitations` рендерит HTML и сохраняет его в `storage/invites/<slug>/index.html`.
- **Публичный просмотр**: страница доступна по `GET /invite/<slug>` напрямую из файловой системы — без БД. Старые ссылки вида `invitation.html?id=<slug>` автоматически перенаправляются на новый формат.
- **Темы**: конфигурируются в `src/shared/themes.json` и применяются при рендеринге.

---

## Быстрый старт (локально)

Требования: Node.js 18+ (рекомендуется 20 LTS), npm.

1. Установка зависимостей:
   ```bash
   npm install
   ```
2. Запуск в режиме разработки (порт 3000 по умолчанию):
   ```bash
   npm run dev
   ```
   Продакшн-режим:
   ```bash
   npm start
   ```
3. Откройте `http://localhost:3000`.

Директория `storage/invites` создаётся автоматически при старте. Опубликованные приглашения доступны по `http://localhost:3000/invite/<slug>`.

Переменные окружения:
- `PORT` — порт сервера (по умолчанию 3000 локально, 8000 в Docker).

---

## Запуск в Docker

Собрать образ и запустить контейнер (порт 8000, с сохранением приглашений на хосте):
```bash
docker build -t wedding .
docker run -d \
  --name wedding-app \
  -p 8000:8000 \
  -e NODE_ENV=production \
  -e PORT=8000 \
  -v "$(pwd)/storage/invites:/usr/src/app/storage/invites" \
  wedding
```

После запуска откройте `http://<SERVER_IP>:8000`.

> Важно: Том `storage/invites` монтируется как volume, чтобы опубликованные HTML сохранялись между перезапусками.

---

## Запуск через docker-compose

В репозитории уже есть `docker-compose.yml`. Запуск:
```bash
docker compose up -d
```
Проверьте логи:
```bash
docker compose logs -f
```
По умолчанию приложение доступно на `http://<SERVER_IP>:8000`.

---

## Настройка reverse proxy (Nginx)

Пример конфигурации для домена `wedding.example.com`:
```nginx
server {
    server_name wedding.example.com;
    listen 80;

    # если есть TLS, используйте 443 и соответствующие сертификаты
    # listen 443 ssl http2;
    # ssl_certificate ...;
    # ssl_certificate_key ...;

    client_max_body_size 2m;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

После применения конфигурации перезапустите Nginx и убедитесь, что порты 80/443 открыты.

---

## API (кратко)

Базовый URL: `http://<HOST>[:PORT]`

- `POST /api/invitations`
  - Тело (`application/json`):
    ```json
    {
      "invitation": {
        "groom": "Иван",
        "bride": "Мария",
        "date": "2025-09-25",
        "time": "16:00",
        "venueName": "Загородный клуб",
        "venueAddress": "Москва, ул. Пример",
        "giftCard": "Подарки на ваше усмотрение"
      },
      "theme": { "id": "blush" },
      "slug": "необязательный-слаг"
    }
    ```
  - Ответ: `{ "slug": "...", "url": "http(s)://<host>/invite/<slug>" }`

- `GET /api/invitations/:slug` — возвращает `{ slug, html }`.
- `PUT /api/invitations/:slug` — перегенерирует и (при необходимости) переименовывает слаг.
- `DELETE /api/invitations/:slug` — удаляет директорию приглашения.

Публичная страница всегда доступна по `GET /invite/:slug` (тип `text/html`).

---

## Темы оформления

Файл `src/shared/themes.json` содержит список тем и значения по умолчанию. Изменения применяются при старте сервера:
- при локальном запуске — перезапустите процесс;
- в Docker — пересоберите образ или перезапустите контейнер с обновлёнными файлами.

---

## Тестирование

Запуск unit-тестов:
```bash
npm test
```

---

## Структура проекта

```
src/
  client/            # статические страницы и скрипты конструктора
  server/            # Express-приложение (API + отдача статики)
    routes/          # маршруты API и публичные маршруты
    services/        # файловые операции (создание/чтение/удаление приглашений)
    templates/       # серверный рендер HTML приглашения
    utils/           # валидация и вспомогательные функции (slug и т.п.)
  shared/            # общие данные (темы)
storage/
  invites/           # здесь сохраняются опубликованные HTML (персистентно)
```

---

## Резервное копирование

Для сохранности опубликованных страниц регулярно делайте бэкап директории `storage/invites`.

---

## Примечания

- Проект не использует базу данных — все приглашения рендерятся в статические HTML-файлы.
- Слаги формируются из имён и даты (транслитерация + нормализация). При конфликте автоматически добавляется суффикс (`-2`, `-3`, ...).
