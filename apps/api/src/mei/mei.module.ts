import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MeiController } from "./mei.controller";
import { MeiService } from "./mei.service";

@Module({
  imports: [PrismaModule],
  controllers: [MeiController],
  providers: [MeiService]
})
export class MeiModule {}
