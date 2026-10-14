import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { getEnv } from "./config/env.js";

async function start(): Promise<void> {
  const { PORT } = getEnv();
  try {
    await connectDatabase();
    const server = createServer(createApp());
    server.listen(PORT, () => console.info(`TaskMatrix Sprint 16 API listening on port ${PORT}.`));

    const shutdown = (signal: string) => {
      console.info(`${signal} received. Closing API.`);
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("TaskMatrix Sprint 16 API failed to start.", error);
    process.exit(1);
  }
}

void start();

