import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { INITIAL_DEPARTMENTS, INITIAL_SERVICES } from "@hubcontabil/shared";
import { DEFAULT_SETTINGS } from "../src/settings/settings.constants";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@hubcontabil.local" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@hubcontabil.local",
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  for (const name of INITIAL_DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  for (const name of INITIAL_SERVICES) {
    await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  await prisma.systemSetting.upsert({
    where: { key: "general" },
    update: {},
    create: {
      key: "general",
      value: DEFAULT_SETTINGS
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
