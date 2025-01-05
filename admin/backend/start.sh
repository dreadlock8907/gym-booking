#!/bin/bash

# Установка переменных окружения
export PORT=8000
export MONGO_URI="mongodb://localhost:27017"

# Запуск Deno сервера
deno run --allow-net --allow-env --allow-read --import-map=import_map.json src/main.ts 