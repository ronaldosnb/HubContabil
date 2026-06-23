import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module";

async function bootstrap() {
  await NestFactory.createApplicationContext(WorkerModule);
  Logger.log("Worker iniciado e aguardando jobs.", "Worker");
}

void bootstrap();
