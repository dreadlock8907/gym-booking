#!/bin/bash

# Проверяем, переданы ли порт и рабочая директория как аргументы
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Использование: ./start.sh <порт> <рабочая_директория>"
    exit 1
fi

# Устанавливаем рабочую директорию
cd "$2/gym-service"

# Путь к логу
LOG_DIR="$2/gym-service/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/gym_service_$1.log"

# Путь к PID-файлу
PID_DIR="$2/gym-service/pids"
mkdir -p "$PID_DIR"
PID_FILE="$PID_DIR/gym_service_$1.pid"

# Запускаем Deno-сервис с указанным портом и логированием
echo "$(date): Запуск сервиса на порту $1" >> "$LOG_FILE"
deno run --allow-net --allow-read src/main.ts "$1" >> "$LOG_FILE" 2>&1 &

# Сохраняем PID процесса
echo $! > "$PID_FILE"

# Выводим PID для вызывающего процесса
echo $! 