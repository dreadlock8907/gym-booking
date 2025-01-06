import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { ObjectId, Filter } from "https://deno.land/x/mongo@v0.31.2/mod.ts";
import { IGym } from "../models/Gym.ts";
import { IOrigin } from "../models/Origin.ts";
import { Collection } from "https://deno.land/x/mongo@v0.31.2/src/collection/mod.ts";
import { join, dirname } from "https://deno.land/std@0.224.0/path/mod.ts";

const PROJECT_ROOT = Deno.cwd().replace('/backend', '');

const router = new Router();

// Функция валидации телефона
const validatePhone = (phone: string): boolean => {
  // Проверяем, что после удаления всех нецифровых символов остается 10 цифр
  const phoneDigits = phone.replace(/\D/g, '')
  return phoneDigits.length === 10
}

// Создание новой студии
router.post("/", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    
    // Валидация телефона
    if (!validatePhone(body.phone)) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Некорректный номер телефона" };
      return;
    }

    const gymCollection: Collection<IGym> = ctx.state.db.collection("gyms");
    const originsCollection: Collection<IOrigin> = ctx.state.db.collection("origins");
    
    const newGym: IGym = {
      name: body.name,
      phone: body.phone.replace(/\D/g, ''), // Сохраняем только цифры
      email: body.email,
      services: body.services,
      port: body.port || null,
      icon: body.icon || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isFirstLogin: true
    };

    const result = await gymCollection.insertOne(newGym);
    
    // Если указан порт, добавляем origin
    if (body.port) {
      const origin = `http://localhost:${body.port}`;
      await originsCollection.insertOne({
        gymId: result.toString(),
        port: body.port,
        origin: origin,
        createdAt: new Date()
      });
    }
    
    ctx.response.status = 201;
    ctx.response.body = {
      message: "Фитнес-студия успешно создана",
      gym: { ...newGym, _id: result }
    };
  } catch (error) {
    console.error("Ошибка создания студии:", error);
    ctx.response.status = 400;
    ctx.response.body = {
      message: "Ошибка создания фитнес-студии",
      error: String(error)
    };
  }
});

// Получение всех студий
router.get("/", async (ctx) => {
  try {
    const gymCollection: Collection<IGym> = ctx.state.db.collection("gyms");
    const gyms = await gymCollection.find().toArray();
    
    ctx.response.body = gyms;
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Ошибка получения списка студий",
      error: String(error)
    };
  }
});

// Получение студии по ID
router.get("/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const gymCollection: Collection<IGym> = ctx.state.db.collection("gyms");
    const gym = await gymCollection.findOne({ _id: new ObjectId(id) } as Filter<IGym>);
    
    if (!gym) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Студия не найдена" };
      return;
    }
    
    ctx.response.body = gym;
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Ошибка получения студии",
      error: String(error)
    };
  }
});

// Обновление студии
router.put("/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const body = await ctx.request.body({ type: "json" }).value;

    // Валидация телефона
    if (!validatePhone(body.phone)) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Некорректный номер телефона" };
      return;
    }

    const gymCollection: Collection<IGym> = ctx.state.db.collection("gyms");
    
    const updatedGym: Partial<IGym> = {
      name: body.name,
      phone: body.phone.replace(/\D/g, ''), // Сохраняем только цифры
      email: body.email,
      services: body.services,
      status: body.status,
      port: body.port,
      icon: body.icon,
      updatedAt: new Date()
    };

    const result = await gymCollection.updateOne(
      { _id: new ObjectId(id) } as Filter<IGym>,
      { 
        $set: updatedGym
      }
    );
    
    if (result.modifiedCount === 0) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Студия не найдена" };
      return;
    }
    
    ctx.response.body = { 
      message: "Информация о студии обновлена",
      modifiedCount: result.modifiedCount 
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      message: "Ошибка обновления студии",
      error: String(error)
    };
  }
});

// Удаление студии
router.delete("/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const gymCollection: Collection<IGym> = ctx.state.db.collection("gyms");
    const originsCollection: Collection<IOrigin> = ctx.state.db.collection("origins");
    
    // Находим студию
    const gym = await gymCollection.findOne({ _id: new ObjectId(id) } as Filter<IGym>);
    
    if (!gym) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Студия не найдена" };
      return;
    }
    
    // Если сервер запущен, останавливаем его перед удалением
    if (gym.port && gym.status === 'running') {
      const pidDir = join(PROJECT_ROOT, 'gym-service', 'pids');
      const pidFilePath = join(pidDir, `gym_service_${gym.port}.pid`);
      
      try {
        // Читаем PID из файла
        const pidText = await Deno.readTextFile(pidFilePath);
        const pid = parseInt(pidText.trim(), 10);

        // Завершаем процесс
        try {
          Deno.kill(pid, "SIGTERM");
          console.log(`Процесс ${pid} успешно остановлен перед удалением студии`);
        } catch (killError) {
          console.warn(`Не удалось завершить процесс ${pid}:`, killError);
        }

        // Удаляем PID-файл
        try {
          await Deno.remove(pidFilePath);
          console.log(`PID-файл ${pidFilePath} удален`);
        } catch (removeError) {
          console.warn(`Не удалось удалить PID-файл ${pidFilePath}:`, removeError);
        }
      } catch (readError) {
        console.warn(`Не удалось прочитать PID-файл перед удалением студии:`, readError);
      }
    }
    
    // Удаляем связанные origin
    await originsCollection.deleteMany({ gymId: id } as Filter<IOrigin>);
    
    // Удаляем студию
    const result = await gymCollection.deleteOne({ _id: new ObjectId(id) } as Filter<IGym>);
    
    if (result === 0) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Студия не найдена" };
      return;
    }
    
    ctx.response.body = { 
      message: "Студия успешно удалена",
      deletedCount: result
    };
  } catch (error) {
    console.error('Ошибка при удалении студии:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Ошибка удаления студии",
      error: String(error)
    };
  }
});

// Управление сервером студии
router.post("/:id/server", async (ctx) => {
  try {
    // Отладочный вывод текущей рабочей директории
    console.log('Текущая абсолютная рабочая директория:', Deno.cwd());
    console.log('Корневая директория проекта:', PROJECT_ROOT);
    
    const { id } = ctx.params;
    const { action } = await ctx.request.body({ type: "json" }).value;
    const gymCollection: Collection<IGym> = ctx.state.db.collection("gyms");
    
    const gym = await gymCollection.findOne({ _id: new ObjectId(id) } as Filter<IGym>);
    
    if (!gym) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Студия не найдена" };
      return;
    }
    
    let serverStatus: 'running' | 'stopped';
    
    if (action === 'start') {
      // Генерируем порт, если не указан
      const port = gym.port || Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
      
      // Относительный путь к скрипту запуска сервиса
      const servicePath = join(PROJECT_ROOT, 'gym-service', 'start.sh');
      
      try {
        // Создаем директорию для PID-файлов с полными правами
        const pidDir = join(PROJECT_ROOT, 'gym-service', 'pids');
        
        // Расширенное логирование
        console.log('Текущая рабочая директория:', Deno.cwd());
        console.log('Путь к директории PID:', pidDir);
        console.log('Путь к скрипту запуска:', servicePath);

        // Проверяем существование скрипта
        try {
          const scriptStat = await Deno.stat(servicePath);
          console.log('Статус скрипта:', scriptStat);
        } catch (statError) {
          console.error('Полный путь к скрипту:', servicePath);
          
          // Безопасное чтение директории
          const dirEntries: string[] = [];
          for await (const entry of Deno.readDir(join(PROJECT_ROOT, 'gym-service'))) {
            dirEntries.push(entry.name);
          }
          console.error('Содержимое директории:', dirEntries);
          
          console.error('Скрипт не найден:', statError);
          ctx.response.status = 500;
          ctx.response.body = { 
            message: "Скрипт запуска не найден",
            error: String(statError),
            path: servicePath
          };
          return;
        }

        try {
          // Создаем директорию для PID-файлов с полными правами
          await Deno.mkdir(pidDir, { recursive: true, mode: 0o777 });
          console.log('Директория PID создана');
        } catch {
          // Если директория уже существует, это не ошибка
        }

        // Путь к PID-файлу
        const pidFilePath = `${pidDir}/gym_service_${port}.pid`;
        console.log('Путь к PID-файлу:', pidFilePath);

        // Запускаем сервис с помощью Deno.Command (новый API в Deno)
        const process = new Deno.Command('/bin/bash', {
          args: [
            servicePath, 
            port.toString(), 
            PROJECT_ROOT // Передаем корневую директорию проекта
          ],
          stdout: 'null',
          stderr: 'piped',
          stdin: 'null',
          cwd: join(PROJECT_ROOT, 'gym-service') // Устанавливаем рабочую директорию
        });

        const { success, stderr } = await process.output();

        if (!success) {
          const errorMessage = new TextDecoder().decode(stderr);
          console.error('Ошибка запуска сервиса:', errorMessage);
          
          ctx.response.status = 500;
          ctx.response.body = { 
            message: "Не удалось запустить сервис",
            error: errorMessage
          };
          return;
        }

        // Пытаемся прочитать PID из файла
        try {
          const pidText = await Deno.readTextFile(pidFilePath);
          console.log('Содержимое PID-файла:', pidText);
        } catch (pidReadError) {
          console.error('Не удалось прочитать PID-файл:', pidReadError);
        }

        serverStatus = 'running';
        
        // Обновляем порт, если он был null
        await gymCollection.updateOne(
          { _id: new ObjectId(id) } as Filter<IGym>,
          { 
            $set: {
              status: serverStatus,
              port: port,
              updatedAt: new Date()
            }
          }
        );
        
        ctx.response.body = { 
          message: "Сервер запущен",
          status: serverStatus,
          port: port,
          pidFilePath: pidFilePath
        };
      } catch (spawnError) {
        console.error('Критическая ошибка запуска сервиса:', spawnError);
        ctx.response.status = 500;
        ctx.response.body = { 
          message: "Не удалось запустить сервис",
          error: String(spawnError)
        };
      }
    } else if (action === 'stop') {
      if (!gym.port) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Сервис не был запущен" };
        return;
      }

      try {
        // Путь к PID-файлу с корректным относительным путем
        const pidDir = join(PROJECT_ROOT, 'gym-service', 'pids');
        const pidFilePath = join(pidDir, `gym_service_${gym.port}.pid`);
        
        console.log(`Попытка остановить сервис. Путь к PID-файлу: ${pidFilePath}`);
        console.log('Полный абсолютный путь к PID-файлу:', pidFilePath);
        
        // Проверяем существование директории
        try {
          const pidDirStat = await Deno.stat(pidDir);
          console.log('Статус директории PID:', pidDirStat);
        } catch (dirError) {
          console.error('Директория PID не существует:', dirError);
        }
        
        // Список файлов в директории
        try {
          const dirEntries: string[] = [];
          for await (const entry of Deno.readDir(pidDir)) {
            dirEntries.push(entry.name);
          }
          console.log('Файлы в директории PID:', dirEntries);
        } catch (readDirError) {
          console.error('Не удалось прочитать директорию PID:', readDirError);
        }

        try {
          // Читаем PID из файла
          const pidText = await Deno.readTextFile(pidFilePath);
          const pid = parseInt(pidText.trim(), 10);

          console.log(`Найден PID процесса: ${pid}`);

          // Завершаем процесс
          try {
            Deno.kill(pid, "SIGTERM");
            console.log(`Процесс ${pid} успешно остановлен`);
          } catch (killError) {
            console.warn(`Не удалось завершить процесс ${pid}:`, killError);
          }

          // Удаляем PID-файл
          try {
            await Deno.remove(pidFilePath);
            console.log(`PID-файл ${pidFilePath} удален`);
          } catch (removeError) {
            console.warn(`Не удалось удалить PID-файл ${pidFilePath}:`, removeError);
          }
        } catch (readError) {
          console.warn(`Не удалось прочитать PID-файл ${pidFilePath}:`, readError);
        }

        serverStatus = 'stopped';
        
        await gymCollection.updateOne(
          { _id: new ObjectId(id) } as Filter<IGym>,
          { 
            $set: {
              status: serverStatus,
              updatedAt: new Date()
            }
          }
        );
        
        ctx.response.body = { 
          message: "Сервер остановлен",
          status: serverStatus,
          pidFilePath: pidFilePath
        };
      } catch (stopError) {
        console.error('Ошибка остановки сервиса:', stopError);
        ctx.response.status = 500;
        ctx.response.body = { 
          message: "Не удалось остановить сервис",
          error: String(stopError)
        };
      }
    } else {
      ctx.response.status = 400;
      ctx.response.body = { message: "Неверное действие" };
    }
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Ошибка управления сервером студии",
      error: String(error)
    };
  }
});

// Получение списка доступных origin
router.get("/origins", async (ctx) => {
  try {
    const originsCollection: Collection<IOrigin> = ctx.state.db.collection("origins");
    const origins = await originsCollection.find().toArray();
    
    ctx.response.body = origins.map(origin => ({
      port: origin.port,
      origin: origin.origin
    }));
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Ошибка получения списка origin",
      error: String(error)
    };
  }
});

export default router; 