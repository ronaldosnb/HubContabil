import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { Roles } from "../common/guards/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { SettingsService } from "./settings.service";
import { UpdateSettingsDto } from "./settings.dto";

@Controller("settings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  get() {
    return this.settingsService.get();
  }

  @Patch()
  @Roles(UserRole.ADMIN)
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
