#!/usr/bin/env node

/**
 * Проверка готовности к деплою SnakeChess
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка готовности к деплою SnakeChess...\n');

let allGood = true;

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${description}: ${filePath}`);
  if (!exists) allGood = false;
  return exists;
}

function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${description}: ${dirPath}`);
  if (!exists) allGood = false;
  return exists;
}

// Проверка основных файлов
console.log('📁 Проверка файловой структуры:');
checkFile('public/index.html', 'Главная страница');
checkFile('public/main.js', 'Клиентский JavaScript');
checkFile('public/style.css', 'Стили');
checkFile('server/index.js', 'Сервер');
checkFile('server/package.json', 'Зависимости сервера');
checkDirectory('server/models', 'Модели базы данных');
checkDirectory('server/routes', 'API маршруты');
checkFile('server/websocket.js', 'WebSocket обработчики');

// Проверка package.json сервера
if (fs.existsSync('server/package.json')) {
  try {
    const pkg = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
    console.log('\n📦 Проверка зависимостей сервера:');

    const requiredDeps = [
      'express', 'mongoose', 'ws', 'bcryptjs', 'jsonwebtoken', 'cors', 'cookie-parser'
    ];

    requiredDeps.forEach(dep => {
      const exists = pkg.dependencies && pkg.dependencies[dep];
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${dep}`);
      if (!exists) allGood = false;
    });

    // Проверка скриптов
    const hasStartScript = pkg.scripts && pkg.scripts.start;
    console.log(`${hasStartScript ? '✅' : '❌'} Скрипт запуска (npm start)`);
    if (!hasStartScript) allGood = false;

  } catch (error) {
    console.log('❌ Ошибка чтения package.json сервера');
    allGood = false;
  }
}

// Проверка наличия README и инструкций
console.log('\n📖 Проверка документации:');
checkFile('README.md', 'Основной README');
checkFile('server/README.md', 'README сервера');
checkFile('DEPLOYMENT.md', 'Инструкции по деплою');

// Проверка Docker файлов
console.log('\n🐳 Проверка Docker конфигурации:');
checkFile('docker-compose.yml', 'Docker Compose');
checkFile('server/Dockerfile', 'Dockerfile сервера');

// Финальный результат
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 Все проверки пройдены! Проект готов к деплою.');
  console.log('\n📋 Следующие шаги:');
  console.log('1. Настройте MongoDB базу данных');
  console.log('2. Создайте аккаунт на Render.com');
  console.log('3. Следуйте инструкциям в DEPLOYMENT.md');
  console.log('4. Добавьте переменные окружения в Render dashboard');
} else {
  console.log('⚠️  Найдены проблемы. Исправьте их перед деплоем.');
  console.log('\n🔧 Возможные решения:');
  console.log('- Убедитесь что все файлы созданы');
  console.log('- Проверьте package.json сервера');
  console.log('- Следуйте инструкциям в README.md');
}

console.log('\n🚀 Деплой на Render.com: https://render.com');
console.log('📚 Инструкции: DEPLOYMENT.md');

process.exit(allGood ? 0 : 1);
