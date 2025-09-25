FROM node:20-alpine

WORKDIR /usr/src/app

# Установим зависимости по lock-файлу
COPY package*.json ./
RUN npm ci --omit=dev

# Скопируем исходники
COPY . .

# Готовим директорию для статически сгенерированных приглашений
RUN mkdir -p /usr/src/app/invites \
  && chown -R node:node /usr/src/app

USER node

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["node", "server.js"]


