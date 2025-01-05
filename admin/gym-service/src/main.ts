import { Application, Router } from "oak";

const app = new Application();
const router = new Router();

// Получаем порт из аргументов командной строки
const PORT = Deno.args.length > 0 
  ? parseInt(Deno.args[0], 10) 
  : 3000;

// Middleware для CORS
app.use(async (ctx, next) => {
  ctx.response.headers.set('Access-Control-Allow-Origin', '*');
  ctx.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (ctx.request.method === 'OPTIONS') {
    ctx.response.status = 200;
    return;
  }
  
  await next();
});

// Базовый роут
router.get("/", (ctx) => {
  ctx.response.body = {
    message: "Сервис фитнес-студии работает",
    status: "active",
    port: PORT,
    timestamp: new Date().toISOString()
  };
});

// Роут информации о студии
router.get("/info", (ctx) => {
  ctx.response.body = {
    name: "Моя Фитнес-Студия",
    description: "Современный спортивный комплекс",
    services: [
      "Тренажерный зал",
      "Групповые занятия",
      "Бассейн"
    ],
    contacts: {
      phone: "+7 (999) 123-45-67",
      email: "info@fitness-studio.com"
    },
    workingHours: {
      weekdays: "07:00 - 22:00",
      weekends: "09:00 - 20:00"
    }
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log(`🚀 Сервис студии запущен на порту ${PORT}`);

await app.listen({ port: PORT }); 