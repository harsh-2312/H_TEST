import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

let prismaInstance: PrismaClient;

try {
  prismaInstance = global.prisma || new PrismaClient();
  if (process.env.NODE_ENV !== "production") global.prisma = prismaInstance;
} catch (err) {
  console.error("[prisma] Failed to instantiate PrismaClient:", err);
  process.exit(1);
}

export const prisma = prismaInstance!;

export async function connectPrisma(): Promise<void> {
  console.log("[prisma] Testing database connection...");
  try {
    await prisma.$connect();
    console.log("[prisma] Database connection established successfully.");
  } catch (err) {
    console.error("[prisma] Unable to connect to the database:", err);
    throw err;
  }
}
