import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { ObjectId, Filter } from "https://deno.land/x/mongo@v0.31.2/mod.ts";
import { Service } from "../models/Service.ts";
import { Collection } from "https://deno.land/x/mongo@v0.31.2/src/collection/mod.ts";
import { Context } from "https://deno.land/x/oak@v12.6.1/context.ts";

const router = new Router();

// Получение списка всех услуг
router.get("/", async (ctx) => {
  try {
    const serviceCollection: Collection<Service> = ctx.state.db.collection("services");
    const services = await serviceCollection.find().toArray();
    ctx.response.body = services;
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Ошибка получения списка услуг",
      error: String(error)
    };
  }
});

// Создание новой услуги
router.post("/", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const serviceCollection: Collection<Service> = ctx.state.db.collection("services");
    
    const newService: Service = {
      name: body.name,
      description: body.description || "",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const id = await serviceCollection.insertOne(newService);
    
    ctx.response.status = 201;
    ctx.response.body = {
      message: "Услуга успешно создана",
      service: { ...newService, _id: id }
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      message: "Ошибка создания услуги",
      error: String(error)
    };
  }
});

// Обновление услуги
router.put("/:id", async (ctx: Context & { params: { id: string } }) => {
  try {
    const { id } = ctx.params;
    const body = await ctx.request.body({ type: "json" }).value;
    const serviceCollection: Collection<Service> = ctx.state.db.collection("services");
    
    const updatedService: Partial<Service> = {
      name: body.name,
      description: body.description,
      updatedAt: new Date()
    };

    const result = await serviceCollection.updateOne(
      { _id: new ObjectId(id) } as Filter<Service>,
      { $set: updatedService }
    );
    
    if (result.modifiedCount === 0) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Услуга не найдена" };
      return;
    }
    
    ctx.response.body = { 
      message: "Информация об услуге обновлена",
      modifiedCount: result.modifiedCount 
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      message: "Ошибка обновления услуги",
      error: String(error)
    };
  }
});

// Перемещение услуги в другую категорию
router.put("/:id/move", async (ctx: Context & { params: { id: string } }) => {
  try {
    const { id } = ctx.params;
    const body = await ctx.request.body({ type: "json" }).value;
    const serviceCollection: Collection<Service> = ctx.state.db.collection("services");
    
    const result = await serviceCollection.updateOne(
      { _id: new ObjectId(id) } as Filter<Service>,
      { 
        $set: { 
          category: body.newCategory,
          updatedAt: new Date() 
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Услуга не найдена" };
      return;
    }
    
    ctx.response.body = { 
      message: "Категория услуги обновлена",
      modifiedCount: result.modifiedCount 
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      message: "Ошибка перемещения услуги",
      error: String(error)
    };
  }
});

// Удаление услуги с проверкой использования
router.delete("/:id", async (ctx: Context & { params: { id: string } }) => {
  try {
    const { id } = ctx.params;
    const serviceCollection: Collection<Service> = ctx.state.db.collection("services");
    const gymCollection = ctx.state.db.collection("gyms");
    
    // Проверяем, используется ли услуга в каких-либо gym
    const gymUsingService = await gymCollection.findOne({
      services: { $elemMatch: { $eq: id } }
    });

    if (gymUsingService) {
      ctx.response.status = 400;
      ctx.response.body = { 
        message: "Услуга используется в некоторых gym и не может быть удалена" 
      };
      return;
    }

    const result = await serviceCollection.deleteOne(
      { _id: new ObjectId(id) } as Filter<Service>
    );
    
    if (result === 0) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Услуга не найдена" };
      return;
    }
    
    ctx.response.body = { 
      message: "Услуга успешно удалена",
      deletedCount: result
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Ошибка удаления услуги",
      error: String(error)
    };
  }
});

export default router; 