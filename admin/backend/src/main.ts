import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { MongoClient, Database } from "https://deno.land/x/mongo@v0.31.2/mod.ts";

// Импорт роутеров
import gymRoutes from "./routes/gymRoutes.ts";
import authRoutes from "./routes/authRoutes.ts";
import serviceRoutes from "./routes/serviceRoutes.ts";

const app = new Application();
const PORT = Deno.env.get("PORT") || 8000;
const MONGO_URI = Deno.env.get("MONGO_URI") || "mongodb://localhost:27017";
const DB_NAME = "gym_booking";

// Функция инициализации origin для frontend
async function initializeFrontendOrigin(db: Database) {
  try {
    const originsCollection = db.collection("origins");
    
    // Проверяем, существует ли уже origin для frontend
    const existingFrontendOrigin = await originsCollection.findOne({ 
      origin: "http://localhost:5180" 
    });
    
    if (!existingFrontendOrigin) {
      // Если нет, добавляем постоянный origin для frontend
      await originsCollection.insertOne({
        gymId: "frontend",  // Специальный идентификатор для frontend
        port: 5180,
        origin: "http://localhost:5180",
        createdAt: new Date()
      });
      
      console.log("✅ Добавлен постоянный origin для frontend");
    }
  } catch (error) {
    console.error("❌ Ошибка инициализации origin для frontend:", error);
  }
}

// Функция инициализации коллекции services
async function initializeServicesCollection(db: Database) {
  try {
    const servicesCollection = db.collection("services");
    
    // Проверяем, есть ли уже какие-то услуги
    const servicesCount = await servicesCollection.countDocuments();
    
    if (servicesCount === 0) {
      console.log("✅ Коллекция services создана");
    } else {
      console.log(`✅ Коллекция services существует, количество услуг: ${servicesCount}`);
    }
  } catch (error) {
    console.error("❌ Ошибка инициализации коллекции services:", error);
  }
}

// Подключение к MongoDB
const client = new MongoClient();
let db: Database;

try {
  await client.connect(MONGO_URI);
  db = client.database(DB_NAME);
  console.log("✅ Успешное подключение к MongoDB");
  
  // Инициализируем origin для frontend
  await initializeFrontendOrigin(db);
  
  // Инициализируем коллекцию services
  await initializeServicesCollection(db);
} catch (error) {
  console.error("❌ Ошибка подключения к MongoDB:", error);
}

// Функция получения разрешенных origin из базы
async function getAllowedOrigins(db: Database): Promise<string[]> {
  try {
    const originsCollection = db.collection("origins");
    const origins = await originsCollection.find().toArray();
    return origins.map(origin => origin.origin);
  } catch (error) {
    console.error("Ошибка получения origin:", error);
    return ["http://localhost:5180"];  // Дефолтный origin
  }
}

// Middleware для CORS
app.use(
  oakCors({
    origin: async (requestOrigin) => {
      const allowedOrigins = await getAllowedOrigins(db);
      
      // Проверяем, есть ли origin в списке разрешенных
      if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        return requestOrigin;
      }
      
      // Возвращаем первый origin по умолчанию
      return allowedOrigins[0];
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Логирование запросов
app.use(async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  try {
    await next();
  } catch (err) {
    console.error(err);
    throw err;
  }
});

// Middleware для базы данных
app.use(async (ctx, next) => {
  ctx.state.db = db;
  await next();
});

// Создаем API роутер
const apiRouter = new Router({ prefix: "/api" });

// Подключаем маршруты
apiRouter.use("/gyms", gymRoutes.routes());
apiRouter.use("/gyms", gymRoutes.allowedMethods());

// Подключаем роуты авторизации
apiRouter.use("/auth", authRoutes.routes());
apiRouter.use("/auth", authRoutes.allowedMethods());

// Подключаем роуты услуг
apiRouter.use("/services", serviceRoutes.routes());
apiRouter.use("/services", serviceRoutes.allowedMethods());

// Подключаем API роутер к приложению
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

console.log(`🚀 Сервер запущен на порту ${PORT}`);

await app.listen({ port: Number(PORT) }); 