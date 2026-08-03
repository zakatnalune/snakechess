# SnakeChess 🐍♟️

A unique chess variant featuring snake pieces with multiplayer, bot gameplay, and rating system.

## Features

### 🎮 Game Modes
- **Local Play**: Play against yourself or a friend on the same device
- **Bot Gameplay**: Challenge AI opponent (basic implementation, Fairy Stockfish ready)
- **Online Multiplayer**: Real-time games with other players
- **Lobby System**: Find and join games with players worldwide

### 👥 User System
- **Authentication**: Register/login with secure JWT tokens
- **Player Profiles**: Track stats, rating, and game history
- **Rating System**: Elo-based competitive rankings

### 🏆 Competitive Features
- **Leaderboards**: Top player rankings
- **Game History**: Review past games and moves
- **Statistics**: Wins, losses, draws tracking

### 🎯 Game Features
- **Snake Pieces**: Unique 3-step movement pattern
- **Standard Chess Rules**: With snake piece additions
- **Real-time Updates**: WebSocket-powered multiplayer
- **Move Validation**: Server-side move verification
- **Game Saving**: Automatic game logging and replay

## Tech Stack

### Frontend
- **HTML5/CSS3**: Modern responsive UI
- **Vanilla JavaScript**: No frameworks, lightweight and fast
- **WebSocket**: Real-time multiplayer communication

### Backend
- **Node.js**: Server runtime
- **Express.js**: REST API framework
- **MongoDB**: Database for users and games
- **WebSocket**: Real-time communication
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing

## 🚀 Быстрый старт

### Локальная разработка

#### Автоматический запуск (рекомендуется)

**Windows:**
```cmd
dev-start.bat
```

**Linux/Mac:**
```bash
chmod +x dev-start.sh
./dev-start.sh
```

#### Ручная настройка

1. **Установите зависимости:**
   ```bash
   cd server
   npm install
   ```

2. **Настройте переменные окружения:**
   Смотрите **[ENVIRONMENT.md](ENVIRONMENT.md)** для настройки `.env` файла

3. **Запустите сервер:**
   ```bash
   cd server
   npm start
   ```

4. **Откройте игру:**
   Перейдите на `http://localhost:3000`

### Онлайн демо

🎮 **Игра уже развернута на: https://snakechess-1.onrender.com**

## 📦 Деплоймент

Подробные инструкции по деплою в различных сервисах: **[DEPLOYMENT.md](DEPLOYMENT.md)**

### Быстрый деплой на Render.com

1. Создайте аккаунт на [Render.com](https://render.com)
2. Подключите ваш GitHub репозиторий
3. Настройте переменные окружения (см. [ENVIRONMENT.md](ENVIRONMENT.md))
4. Render автоматически развернет приложение

### Требования
- Node.js 18+
- MongoDB (локально или MongoDB Atlas)
- npm или yarn

## 📋 API

### Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь

### Games
- `POST /api/games` - Создать игру
- `GET /api/games/lobby/waiting` - Доступные игры
- `GET /api/games/leaderboard/top` - Рейтинг игроков

## 🎮 Как играть

### Правила Snake Chess

1. **Стандартные шахматные правила** применяются
2. **Snake фигуры** ходят на 3 шага в любом направлении
3. **Продвижение пешек** включает опцию превращения в Snake
4. **Цель**: поставить мат королю противника

### Управление
- **ЛКМ**: Выбрать фигуру и сделать ход
- **Регистрация**: Создайте аккаунт для онлайн игр
- **Лобби**: Найдите соперников для игры

## 🛠️ Разработка

### Структура проекта
```
snakechess/
├── public/                 # Frontend файлы
│   ├── index.html         # Главная страница
│   ├── main.js           # Логика игры и UI
│   ├── style.css         # Стили
│   └── img/              # Ассеты игры
├── server/                # Backend сервер
│   ├── index.js          # Сервер Express
│   ├── models/           # Модели базы данных
│   ├── routes/           # API маршруты
│   ├── websocket.js      # Обработчики WebSocket
│   ├── package.json      # Зависимости
│   └── README.md         # Настройка сервера
├── DEPLOYMENT.md         # Инструкции по деплою
├── ENVIRONMENT.md        # Переменные окружения
└── README.md            # Этот файл
```

### Скрипты разработки
- `npm run dev` - Запуск с hot-reload (сервер)
- `npm start` - Продакшн запуск (сервер)
- `dev-start.bat` - Полный запуск для Windows
- `dev-start.sh` - Полный запуск для Linux/Mac

## 🔮 Будущие улучшения

- [ ] Fairy Stockfish интеграция для продвинутого ИИ
- [ ] Анимации ходов и звуки
- [ ] Перемотка партий
- [ ] Турнирная система
- [ ] Мобильное приложение
- [ ] Продвинная статистика

## 📄 Лицензия

MIT License - свободное использование и модификация

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для фичи
3. Внесите изменения
4. Тщательно протестируйте
5. Создайте Pull Request

## 📞 Контакты

По вопросам и предложениям создавайте Issues на GitHub
