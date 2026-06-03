import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const refreshSchema = z.object({ token: z.string() });

authRouter.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await hashPassword(data.password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: "OWNER"
        }
      });
      const business = await tx.business.create({
        data: {
          name: data.businessName,
          ownerId: user.id
        }
      });
      await tx.businessMember.create({
        data: {
          businessId: business.id,
          userId: user.id,
          role: "OWNER"
        }
      });
      await Promise.all([
        tx.paymentMethod.createMany({
          data: [
            { businessId: business.id, name: "Cash", category: "CASH", isDefault: true },
            { businessId: business.id, name: "UPI", category: "UPI", isDefault: true },
            { businessId: business.id, name: "Bank Transfer", category: "BANK_TRANSFER", isDefault: true },
            { businessId: business.id, name: "Card", category: "CARD", isDefault: true }
          ]
        }),
        tx.category.createMany({
          data: [
            { businessId: business.id, name: "Sales", type: "INCOME", isDefault: true },
            { businessId: business.id, name: "Office Expense", type: "EXPENSE", isDefault: true },
            { businessId: business.id, name: "Supplies", type: "EXPENSE", isDefault: true },
            { businessId: business.id, name: "Transfer", type: "TRANSFER", isDefault: true }
          ]
        })
      ]);
      return { user, business };
    });

    const accessToken = signAccessToken({ userId: result.user.id, email: result.user.email, role: "OWNER" });
    const refreshToken = signRefreshToken({ userId: result.user.id });

    await prisma.session.create({
      data: {
        userId: result.user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    return res.status(201).json({ accessToken, refreshToken, user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role, businessIds: [result.business.id] } });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email }, include: { businessMemberships: true } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const passwordMatches = await verifyPassword(data.password, user.passwordHash);
    if (!passwordMatches) return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    return res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role, businessIds: user.businessMemberships.map((m) => m.businessId) } });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const data = refreshSchema.parse(req.body);
    const decoded = verifyRefreshToken(data.token);
    const session = await prisma.session.findUnique({ where: { refreshToken: data.token } });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Refresh token invalid" });
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: "User not found" });

    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    return res.json({ accessToken });
  } catch (error) {
    next(error);
  }
});

export { authRouter };
