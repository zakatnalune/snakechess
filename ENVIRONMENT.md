# 🔧 Переменные окружения

## Локальная разработка

Создайте файл `server/.env` со следующим содержимым:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database - Replace with your MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/snakechess

# JWT Secret - Generate a secure random string (minimum 32 characters)
JWT_SECRET=your-development-secret-key-change-this

# Client URL - Your frontend domain
CLIENT_URL=http://localhost:3000
```

## Продакшн (Render.com)

В Render dashboard добавьте следующие Environment Variables:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Режим работы |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/snakechess` | MongoDB connection string |
| `JWT_SECRET` | `your-unique-production-secret-key` | Секрет для JWT токенов |
| `CLIENT_URL` | `https://snakechess-1.onrender.com` | URL вашего приложения |

## Генерация безопасного JWT_SECRET

### Linux/Mac:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Windows PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Онлайн генератор:
- [Random.org](https://www.random.org/strings/?num=1&len=64&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new)

## Настройка MongoDB

### MongoDB Atlas (рекомендуется)

1. Создайте аккаунт на [MongoDB Atlas](https://cloud.mongodb.com)
2. Создайте новый проект
3. Создайте кластер (бесплатный tier M0)
4. Создайте пользователя базы данных
5. Добавьте IP адрес: `0.0.0.0/0` (Allow Access from Anywhere)
6. Скопируйте Connection String из "Connect" → "Connect your application"
7. Замените `<password>` и `<database>` в строке подключения

### Локальная MongoDB

1. Установите MongoDB на ваш компьютер
2. Запустите MongoDB сервис
3. Используйте: `MONGODB_URI=mongodb://localhost:27017/snakechess`

## Проверка подключения

После настройки переменных, сервер должен выводить:
```
Connected to MongoDB
Server running on port 3000
```

Если подключение не работает:
1. Проверьте правильность connection string
2. Убедитесь что IP адрес добавлен в whitelist (Atlas)
3. Проверьте firewall настройки
