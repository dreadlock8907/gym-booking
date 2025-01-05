import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { MongoClient, Database } from "https://deno.land/x/mongo@v0.31.2/mod.ts";

// Импорт роутеров
import gymRoutes from "./routes/gymRoutes.ts";

const app = new Application();
const PORT = Deno.env.get("PORT") || 8000;
const MONGO_URI = Deno.env.get("MONGO_URI") || "mongodb://localhost:27017";
const DB_NAME = "gym_booking";

// Подключение к MongoDB
const client = new MongoClient();
let db: Database;

try {
  await client.connect(MONGO_URI);
  db = client.database(DB_NAME);
  console.log("✅ Успешное подключение к MongoDB");
} catch (error) {
  console.error("❌ Ошибка подключения к MongoDB:", error);
}

// Middleware для CORS
app.use(
  oakCors({
    origin: ["http://localhost:5180"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
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

// Подключаем API роутер к приложению
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

console.log(`🚀 Сервер запущен на порту ${PORT}`);

await app.listen({ port: Number(PORT) }); 