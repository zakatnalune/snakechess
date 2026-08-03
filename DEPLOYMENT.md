# 🚀 Деплоймент SnakeChess

## Render.com (Рекомендуемый способ)

### 1. Подготовка

Убедитесь что у вас есть:
- Аккаунт на [Render.com](https://render.com)
- MongoDB база данных (MongoDB Atlas или другой провайдер)

### 2. Настройка MongoDB Atlas

1. Создайте кластер на [MongoDB Atlas](https://cloud.mongodb.com)
2. Создайте пользователя базы данных
3. Добавьте IP адрес `0.0.0.0/0` в whitelist
4. Скопируйте connection string

### 3. Деплой на Render.com

#### Вариант A: Автоматический (с GitHub)

1. **Подключите GitHub репозиторий:**
   - В Render dashboard нажмите "New +" → "Web Service"
   - Выберите "Connect GitHub" и авторизуйтесь
   - Найдите ваш репозиторий `snakechess`

2. **Настройте сервис:**
   - **Name:** `snakechess-server`
   - **Runtime:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`

3. **Добавьте Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-super-secret-jwt-key-change-this
   CLIENT_URL=https://snakechess-1.onrender.com
   ```

4. **Deploy:**
   - Нажмите "Create Web Service"
   - Render автоматически соберет и запустит приложение

#### Вариант B: Ручной деплой

Если у вас нет GitHub:
1. Скачайте ZIP архив проекта
2. В Render dashboard → "New +" → "Static Site"
3. Загрузите файлы из папки `public/`
4. Для сервера создайте отдельный "Web Service" и загрузите папку `server/`

### 4. Проверка

После деплоя:
1. Перейдите на `https://your-app-name.onrender.com`
2. Попробуйте зарегистрироваться
3. Создайте игру в лобби

## 🌐 Альтернативные варианты деплоя

### Heroku

1. Установите [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Создайте приложение: `heroku create snakechess-app`
3. Добавьте переменные окружения:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-secret
   heroku config:set CLIENT_URL=https://your-app.herokuapp.com
   ```
4. Деплой: `git push heroku main`

### Railway

1. Создайте проект на [Railway.app](https://railway.app)
2. Подключите GitHub репозиторий
3. Добавьте переменные окружения
4. Автоматический деплой

### VPS (DigitalOcean, Linode, etc.)

1. Создайте VPS сервер
2. Установите Node.js и MongoDB
3. Склонируйте репозиторий
4. Установите PM2: `npm install -g pm2`
5. Запустите: `pm2 start server/index.js --name snakechess`

## 🔧 Переменные окружения

Обязательные переменные:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/snakechess
JWT_SECRET=your-unique-secret-key-minimum-32-characters
CLIENT_URL=https://your-domain.com
PORT=3000
```

### Безопасность JWT_SECRET

Создайте уникальный секрет:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🐳 Docker деплоймент

### Локальный тест с Docker

```bash
# Установите Docker и Docker Compose
docker-compose up --build
```

### Продакшн с Docker

```bash
# Соберите образ
docker build -t snakechess ./server

# Запустите контейнер
docker run -d \
  --name snakechess-server \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=your-mongodb-uri \
  -e JWT_SECRET=your-secret \
  -e CLIENT_URL=your-domain \
  snakechess
```

## 🔍 Диагностика

### Проблемы с подключением

1. **WebSocket не работает:**
   - Проверьте что CLIENT_URL правильный
   - Убедитесь что порт 3000 открыт

2. **База данных:**
   - Проверьте connection string
   - Убедитесь что IP добавлен в whitelist

3. **Регистрация не работает:**
   - Проверьте JWT_SECRET
   - Посмотрите логи сервера

### Логи Render.com

```bash
# Посмотрите логи в Render dashboard
# Или используйте Render CLI
render logs snakechess-server
```

## 📊 Мониторинг

- **Render.com:** Встроенные метрики и логи
- **MongoDB Atlas:** Мониторинг базы данных
- **UptimeRobot:** Мониторинг доступности

## 🔄 Обновление

1. Сделайте изменения в коде
2. Закоммитьте и запушьте в GitHub
3. Render автоматически передеплоит приложение

## 💡 Советы по оптимизации

1. **Performance:**
   - Используйте Redis для сессий (опционально)
   - Настройте индексы в MongoDB

2. **Безопасность:**
   - Регулярно меняйте JWT_SECRET
   - Настройте CORS правильно
   - Используйте HTTPS

3. **Backup:**
   - Настройте автоматический бэкап MongoDB Atlas
