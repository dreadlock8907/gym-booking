import { Document } from "https://deno.land/x/mongo@v0.31.2/mod.ts";

export interface IGym extends Document {
  name: string;
  phone: string;
  email: string;
  services: string[];
  status?: 'running' | 'stopped';
  port?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const gymSchema = {
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  services: { type: [String], default: [] },
  status: { type: String, default: 'stopped', enum: ['running', 'stopped'] },
  port: { type: Number, default: null, min: 1024, max: 65535 },
  createdAt: { type: Date, default: new Date() },
  updatedAt: { type: Date, default: new Date() }
}; 