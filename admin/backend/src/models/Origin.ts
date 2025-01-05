import { Document } from "https://deno.land/x/mongo@v0.31.2/mod.ts";

export interface IOrigin extends Document {
  gymId: string;  // ID студии
  port: number;   // Порт студии
  origin: string; // URL origin
  createdAt: Date;
}

export const originSchema = {
  gymId: { type: String, required: true },
  port: { type: Number, required: true, min: 1024, max: 65535 },
  origin: { type: String, required: true },
  createdAt: { type: Date, default: new Date() }
}; 