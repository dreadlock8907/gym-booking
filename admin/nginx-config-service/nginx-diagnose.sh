#!/bin/bash

# Создаем директории
sudo mkdir -p /opt/homebrew/var/run
sudo mkdir -p /opt/homebrew/var/log/nginx
sudo mkdir -p /opt/homebrew/var/run/nginx
sudo chown $(whoami) /opt/homebrew/var/run/nginx
sudo chmod 777 /opt/homebrew/var/run/nginx

# Создаем файлы логов с правильными правами
sudo touch /opt/homebrew/var/log/nginx/access.log
sudo touch /opt/homebrew/var/log/nginx/error.log
sudo chmod 666 /opt/homebrew/var/log/nginx/access.log
sudo chmod 666 /opt/homebrew/var/log/nginx/error.log

# Проверяем конфигурацию
echo "🔍 Проверка конфигурации nginx:"
/opt/homebrew/bin/nginx -t

# Запускаем nginx
echo "🚀 Запуск nginx:"
sudo nginx -s stop
sudo nginx

echo -e "\n📋 Процессы nginx:"
ps aux | grep nginx

# Прослушиваемые порты
echo "🌐 Порты:"
sudo lsof -i :80

echo -e "\n📝 Содержимое hosts:"
cat /etc/hosts

echo -e "\n🌐 Резолв доменов:"
ping -c 1 www.gyms.local

echo -e "\n🔧 Полный путь nginx:"
which nginx
/opt/homebrew/bin/nginx -v 


#Docroot is: /opt/homebrew/var/www

# The default port has been set in /opt/homebrew/etc/nginx/nginx.conf to 8080 so that
# nginx can run without sudo.

# nginx will load all files in /opt/homebrew/etc/nginx/servers/.

# To start nginx now and restart at login:
#   brew services start nginx
# Or, if you don't want/need a background service you can just run:
#   /opt/homebrew/opt/nginx/bin/nginx -g daemon\ off\;