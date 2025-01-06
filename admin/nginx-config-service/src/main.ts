import { MongoClient, Database } from "mongo";

// Локальный интерфейс, так как не можем импортировать напрямую
interface IOrigin {
  gymId: string;
  port: number;
  origin: string;
  createdAt: Date;
}

import { generateNginxConfig } from "./configGenerator.ts";

const MONGO_URI = Deno.env.get("MONGO_URI") || "mongodb://localhost:27017";
const DB_NAME = "gym_booking";
const NGINX_CONFIG_PATH = "/opt/homebrew/etc/nginx/nginx.conf";

async function watchOrigins() {
  const client = new MongoClient();
  await client.connect(MONGO_URI);
  const db: Database = client.database(DB_NAME);
  const originsCollection = db.collection<IOrigin>("origins");

  // Начальная генерация конфига
  const initialOrigins = await originsCollection.find().toArray();
  await generateNginxConfig(initialOrigins, NGINX_CONFIG_PATH);

  // Эмуляция watch, так как прямой watch недоступен
  let lastCount = initialOrigins.length;
  
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Опрос каждые 5 секунд
    
    try {
      const currentOrigins = await originsCollection.find().toArray();
      
      if (currentOrigins.length !== lastCount) {
        console.log("Изменение в origins");
        await generateNginxConfig(currentOrigins, NGINX_CONFIG_PATH);
        
        // Перезагрузка nginx
        const reloadProcess = new Deno.Command("sudo", {
          args: [ 
            "nginx",
            "-c", NGINX_CONFIG_PATH,
            "-s", "reload"
          ],
          stdout: "piped",
          stderr: "piped"
        });
        
        const { success, stderr } = await reloadProcess.output();
        
        if (success) {
          console.log("✅ Nginx успешно перезагружен");
        } else {
          console.error("❌ Ошибка перезагрузки nginx:", 
            new TextDecoder().decode(stderr)
          );
        }
        
        lastCount = currentOrigins.length;
      }
    } catch (error) {
      console.error("Ошибка обновления конфигурации:", error);
    }
  }
}

// Запуск службы
if (import.meta.main) {
  console.log("🚀 Служба конфигурации nginx запущена");

  
  // Затем начинаем мониторинг origins
  watchOrigins().catch(console.error);
}

export { watchOrigins }; 