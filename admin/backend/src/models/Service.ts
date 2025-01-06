import { ObjectId } from "https://deno.land/x/mongo@v0.31.2/mod.ts";

export interface Service {
  _id?: ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
} 