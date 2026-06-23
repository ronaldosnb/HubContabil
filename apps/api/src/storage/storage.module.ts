import { Global, Module } from "@nestjs/common";
import { LocalStorageService } from "./local-storage.service";
import { StorageService } from "./storage.types";

@Global()
@Module({
  providers: [
    {
      provide: StorageService,
      useClass: LocalStorageService
    }
  ],
  exports: [StorageService]
})
export class StorageModule {}
