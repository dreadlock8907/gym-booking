#!/bin/bash

# Определение порта (опционально)
PORT=${1:-8081}

# Определение корневой директории проекта
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Переход в директорию проекта
cd "$PROJECT_ROOT"

# Запуск Deno с необходимыми правами
deno run \
    --allow-net \
    --allow-read \
    --allow-write \
    --allow-run \
    --import-map=import_map.json \
    src/main.ts $PORT 