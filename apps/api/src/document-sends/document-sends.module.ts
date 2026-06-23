import { Module } from "@nestjs/common";
import { SettingsModule } from "../settings/settings.module";
import { DocumentSendsController } from "./document-sends.controller";
import { DocumentSendsService } from "./document-sends.service";
import { SendQueueService } from "./send-queue.service";

@Module({
  imports: [SettingsModule],
  controllers: [DocumentSendsController],
  providers: [DocumentSendsService, SendQueueService]
})
export class DocumentSendsModule {}
