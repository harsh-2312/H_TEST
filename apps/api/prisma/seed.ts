import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("StrongP@ssw0rd", 12);
  const owner = await prisma.user.upsert({
    where: { email: "owner@ledger.local" },
    update: { name: "Ledger Owner", passwordHash },
    create: { email: "owner@ledger.local", name: "Ledger Owner", passwordHash, role: "OWNER" }
  });

  const business = await prisma.business.upsert({
    where: { id: "default-business" },
    update: { name: "Ledger Business" },
    create: { id: "default-business", name: "Ledger Business", ownerId: owner.id }
  });

  await prisma.businessMember.upsert({
    where: { businessId_userId: { businessId: business.id, userId: owner.id } },
    update: { role: "OWNER" },
    create: { businessId: business.id, userId: owner.id, role: "OWNER" }
  });

  console.log("Seed data created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
