# ✅ Чек-лист деплоя SnakeChess

## Перед деплоем

- [ ] **Проверьте код**
  - [ ] Запустите `node check-deployment.js`
  - [ ] Убедитесь что нет ошибок в консоли
  - [ ] Проверьте что все файлы созданы

- [ ] **Настройте базу данных**
  - [ ] Создайте MongoDB Atlas кластер
  - [ ] Создайте пользователя базы данных
  - [ ] Добавьте IP `0.0.0.0/0` в whitelist
  - [ ] Скопируйте connection string

- [ ] **Сгенерируйте JWT секрет**
  - [ ] Используйте `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - [ ] Минимум 32 символа

## Настройка Render.com

- [ ] **Создайте аккаунт на Render.com**
- [ ] **Создайте новый Web Service**
- [ ] **Подключите GitHub репозиторий**
- [ ] **Настройте параметры:**
  - Runtime: Node
  - Build Command: `cd server && npm install`
  - Start Command: `cd server && npm start`

- [ ] **Добавьте Environment Variables:**
  ```
  NODE_ENV=production
  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/snakechess
  JWT_SECRET=your-unique-secret-key-here
  CLIENT_URL=https://your-app-name.onrender.com
  ```

- [ ] **Создайте сервис**
- [ ] **Дождитесь завершения сборки**

## После деплоя

- [ ] **Проверьте доступность**
  - [ ] Откройте https://your-app-name.onrender.com
  - [ ] Проверьте загрузку страницы

- [ ] **Тестирование функций**
  - [ ] Регистрация нового пользователя ✅
  - [ ] Вход в систему ✅
  - [ ] Создание игры в лобби ✅
  - [ ] Присоединение к игре ✅
  - [ ] Совершение ходов ✅
  - [ ] Просмотр рейтинга ✅
  - [ ] Просмотр истории игр ✅

- [ ] **Проверка логов**
  - [ ] В Render dashboard откройте вкладку Logs
  - [ ] Проверьте отсутствие ошибок
  - [ ] Убедитесь в успешном подключении к MongoDB

## Диагностика проблем

### Сервер не запускается
- [ ] Проверьте Environment Variables
- [ ] Проверьте connection string MongoDB
- [ ] Проверьте JWT_SECRET длину

### База данных не подключается
- [ ] Проверьте правильность connection string
- [ ] Проверьте username/password
- [ ] Проверьте IP whitelist в MongoDB Atlas

### WebSocket не работает
- [ ] Проверьте CLIENT_URL
- [ ] Убедитесь что порт 3000 доступен

### Регистрация не работает
- [ ] Проверьте JWT_SECRET
- [ ] Проверьте CORS настройки

## Мониторинг

- [ ] **Render Metrics:** CPU, Memory, Response times
- [ ] **MongoDB Atlas:** Database performance
- [ ] **Uptime:** Настройте мониторинг доступности

## Оптимизация (опционально)

- [ ] Настройте индексы в MongoDB для часто используемых запросов
- [ ] Добавьте Redis для кэширования сессий
- [ ] Настройте rate limiting для API
- [ ] Добавьте error tracking (Sentry, LogRocket)

## Резервное копирование

- [ ] Настройте автоматический бэкап MongoDB Atlas
- [ ] Экспортируйте важные данные регулярно

---

## 🎉 Готово!

Если все тесты пройдены успешно, ваш SnakeChess готов к использованию! 🎮

**URL вашего приложения:** https://your-app-name.onrender.com
