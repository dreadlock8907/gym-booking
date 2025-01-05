import { Document } from "https://deno.land/x/mongo@v0.31.2/mod.ts";

export interface IGym extends Document {
  name: string;
  phone: string;
  email: string;
  services: string[];
  status?: 'running' | 'stopped';
  port?: number;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;

  // Новые поля для авторизации
  password?: string;
  isFirstLogin: boolean;
  lastLogin?: Date;
}

export const gymSchema = {
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  services: { type: [String], default: [] },
  status: { type: String, default: 'stopped', enum: ['running', 'stopped'] },
  port: { type: Number, default: null, min: 1024, max: 65535 },
  icon: { type: String, default: null },
  createdAt: { type: Date, default: new Date() },
  updatedAt: { type: Date, default: new Date() },

  // Поля для авторизации
  password: { type: String, default: null },
  isFirstLogin: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null }
}; 