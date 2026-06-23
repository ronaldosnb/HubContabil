import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { DEFAULT_SETTINGS, SystemSettings } from "./settings.constants";
import { UpdateSettingsDto } from "./settings.dto";

const SETTINGS_KEY = "general";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const stored = await this.prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY }
    });

    if (!stored || !this.isRecord(stored.value)) {
      return DEFAULT_SETTINGS;
    }

    return this.normalize(stored.value);
  }

  async update(dto: UpdateSettingsDto) {
    const current = await this.get();
    const next = this.normalize({ ...current, ...dto });

    await this.prisma.systemSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: next as unknown as Prisma.InputJsonValue
      },
      update: {
        value: next as unknown as Prisma.InputJsonValue
      }
    });

    return next;
  }

  private normalize(value: Record<string, unknown>): SystemSettings {
    return {
      officeName: this.stringOrDefault(value.officeName, DEFAULT_SETTINGS.officeName),
      emailFromName: this.stringOrDefault(value.emailFromName, DEFAULT_SETTINGS.emailFromName),
      emailFromAddress: this.stringOrDefault(
        value.emailFromAddress,
        DEFAULT_SETTINGS.emailFromAddress
      ),
      wppconnectSession: this.stringOrDefault(
        value.wppconnectSession,
        DEFAULT_SETTINGS.wppconnectSession
      ),
      emailSubjectTemplate: this.stringOrDefault(
        value.emailSubjectTemplate,
        DEFAULT_SETTINGS.emailSubjectTemplate
      ),
      emailBodyTemplate: this.stringOrDefault(
        value.emailBodyTemplate,
        DEFAULT_SETTINGS.emailBodyTemplate
      ),
      whatsappBodyTemplate: this.stringOrDefault(
        value.whatsappBodyTemplate,
        DEFAULT_SETTINGS.whatsappBodyTemplate
      )
    };
  }

  private stringOrDefault(value: unknown, fallback: string) {
    return typeof value === "string" && value.trim() ? value : fallback;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
