import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "./auth/auth.module";
import { ClientsModule } from "./clients/clients.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DepartmentsModule } from "./departments/departments.module";
import { DocumentsModule } from "./documents/documents.module";
import { DocumentSendsModule } from "./document-sends/document-sends.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RecurringTasksModule } from "./recurring-tasks/recurring-tasks.module";
import { ServicesModule } from "./services/services.module";
import { SettingsModule } from "./settings/settings.module";
import { StorageModule } from "./storage/storage.module";
import { TasksModule } from "./tasks/tasks.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET", "dev-secret"),
        signOptions: {
          expiresIn: config.get<string>("JWT_EXPIRES_IN", "1d") as never
        }
      })
    }),
    PrismaModule,
    StorageModule,
    UsersModule,
    AuthModule,
    HealthModule,
    DashboardModule,
    ClientsModule,
    DocumentsModule,
    DocumentSendsModule,
    DepartmentsModule,
    TasksModule,
    RecurringTasksModule,
    ServicesModule,
    SettingsModule
  ]
})
export class AppModule {}
