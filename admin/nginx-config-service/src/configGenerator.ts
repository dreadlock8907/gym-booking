interface Origin {
  port: number;
  origin: string;
  gymId: string;
}

export async function generateNginxConfig(
  origins: Origin[], 
  configPath: string
): Promise<void> {
  // Формируем upstream-блок
  const upstreamServers = origins
    .filter(origin => origin.port)
    .map(origin => `server localhost:${origin.port};`)
    .join('\n        ');

  const nginxConfig = `
events {
    worker_connections 1024;
}

http {
    upstream gym_services {
        ${upstreamServers}
    }

    server {
        listen 80;
        server_name gyms.local;

        location / {
            proxy_pass http://gym_services;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Маршрутизация по идентификатору студии
        location ~ ^/gym/(?<gym_id>[^/]+)/ {
            proxy_pass http://localhost:$gym_id;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}`;

  try {
    await Deno.writeTextFile(configPath, nginxConfig);
    console.log(`✅ Конфигурация nginx обновлена: ${configPath}`);
  } catch (error) {
    console.error(`❌ Ошибка записи конфигурации: ${error}`);
  }
} 