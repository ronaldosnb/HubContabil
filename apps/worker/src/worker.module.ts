import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaWorkerService } from "./worker-prisma.service";
import { QueueWorkersService } from "./queue-workers.service";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [PrismaWorkerService, QueueWorkersService]
})
export class WorkerModule {}
