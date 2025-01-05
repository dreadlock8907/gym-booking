import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { ObjectId, Filter } from "https://deno.land/x/mongo@v0.31.2/mod.ts";
import { IGym } from "../models/Gym.ts";
import { Collection } from "https://deno.land/x/mongo@v0.31.2/src/collection/mod.ts";
import { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const router = new Router();

// Функция валидации email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Роут первичной проверки email
router.post("/first-login", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { email } = body;

    if (!email || !validateEmail(email)) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Некорректный email" };
      return;
    }

    const gymCollection: Collection<IGym> = ctx.state.db.collection("gyms");
    
    // Ищем студию по email
    const gym = await gymCollection.findOne({ email } as Filter<IGym>);

    if (!gym) {
      ctx.response.status = 404;
      ctx.response.body = { 
        message: "Студия с таким email не найдена",
        isNewUser: false
      };
      return;
    }

    ctx.response.body = { 
      message: "Email подтвержден",
      isNewUser: gym.isFirstLogin,
      gymName: gym.name
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Ошибка проверки email",
      error: String(error)
    };
  }
});

// Роут установки пароля
router.post("/set-password", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { email, password } = body;

    if (!email || !validateEmail(email)) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Некорректный email" };
      return;
    }

    if (!password || password.length < 8) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Пароль должен быть не короче 8 символов" };
      return;
    }

    const gymCollection: Collection<IGym> = ctx.state.db.collection("gyms");
    
    // Ищем студию по email
    const gym = await gymCollection.findOne({ email } as Filter<IGym>);

    if (!gym) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Студия не найдена" };
      return;
    }

    // Хешируем пароль
    const hashedPassword = await hash(password);

    // Обновляем данные студии
    await gymCollection.updateOne(
      { _id: gym._id } as Filter<IGym>,
      { 
        $set: {
          password: hashedPassword,
          isFirstLogin: false,
          lastLogin: new Date()
        }
      }
    );

    ctx.response.body = { 
      message: "Пароль успешно установлен",
      gymName: gym.name
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Ошибка установки пароля",
      error: String(error)
    };
  }
});

// Роут входа
router.post("/login", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { email, password } = body;

    if (!email || !validateEmail(email)) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Некорректный email" };
      return;
    }

    const gymCollection: Collection<IGym> = ctx.state.db.collection("gyms");
    
    // Ищем студию по email
    const gym = await gymCollection.findOne({ email } as Filter<IGym>);

    if (!gym) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Студия не найдена" };
      return;
    }

    // Проверяем, что пароль уже установлен
    if (!gym.password) {
      ctx.response.status = 400;
      ctx.response.body = { 
        message: "Необходимо установить пароль",
        isFirstLogin: true
      };
      return;
    }

    // Проверяем пароль
    const isPasswordValid = await compare(password, gym.password);

    if (!isPasswordValid) {
      ctx.response.status = 401;
      ctx.response.body = { message: "Неверный пароль" };
      return;
    }

    // Обновляем время последнего входа
    await gymCollection.updateOne(
      { _id: gym._id } as Filter<IGym>,
      { 
        $set: {
          lastLogin: new Date()
        }
      }
    );

    ctx.response.body = { 
      message: "Вход выполнен успешно",
      gymName: gym.name,
      gymId: gym._id
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Ошибка входа",
      error: String(error)
    };
  }
});

export default router; 