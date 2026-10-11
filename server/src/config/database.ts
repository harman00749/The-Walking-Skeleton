import mongoose from "mongoose";
import { getEnv } from "./env.js";

export async function connectDatabase(): Promise<void> {
  const { MONGODB_URI } = getEnv();
  await mongoose.connect(MONGODB_URI);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
