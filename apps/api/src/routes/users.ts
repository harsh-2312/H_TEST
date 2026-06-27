import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { hashPassword } from "../utils/password";
import { AuthenticatedRequest } from "../middleware/auth";

const userRouter = Router();

const updateRoleSchema = z.object({ role: z.nativeEnum(UserRole) });
const updatePermissionSchema = z.object({
  canAddIncome: z.boolean(),
  canAddExpense: z.boolean(),
});

const createStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole).default("STAFF"),
  businessId: z.string().min(1),
  canAddIncome: z.boolean().default(true),
  canAddExpense: z.boolean().default(true),
});

// GET all members of a business
userRouter.get("/", async (req, res, next) => {
  try {
    const businessId = z.string().min(1).parse(req.query.businessId);
    const membership = await prisma.businessMember.findMany({
      where: { businessId },
      include: { user: true }
    });
    res.json(membership.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      canAddIncome: member.canAddIncome,
      canAddExpense: member.canAddExpense,
      joinedAt: member.joinedAt
    })));
  } catch (error) {
    next(error);
  }
});

// POST create staff by owner
userRouter.post("/create-staff", async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createStaffSchema.parse(req.body);

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      // User exists — just add to business if not already member
      const alreadyMember = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId: data.businessId, userId: existing.id } }
      });
      if (alreadyMember) return res.status(409).json({ error: "User already in this business" });

      await prisma.businessMember.create({
        data: {
          businessId: data.businessId,
          userId: existing.id,
          role: data.role,
          canAddIncome: data.canAddIncome,
          canAddExpense: data.canAddExpense,
        }
      });
      return res.status(201).json({
        id: existing.id,
        name: existing.name,
        email: existing.email,
        role: data.role,
        canAddIncome: data.canAddIncome,
        canAddExpense: data.canAddExpense,
      });
    }

    // New user — create and add to business
    const passwordHash = await hashPassword(data.password);
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: data.role,
        }
      });
      const member = await tx.businessMember.create({
        data: {
          businessId: data.businessId,
          userId: user.id,
          role: data.role,
          canAddIncome: data.canAddIncome,
          canAddExpense: data.canAddExpense,
        }
      });
      return { user, member };
    });

    return res.status(201).json({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.member.role,
      canAddIncome: result.member.canAddIncome,
      canAddExpense: result.member.canAddExpense,
    });
  } catch (error) {
    next(error);
  }
});

// PUT update role
userRouter.put("/:id/role", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const update = updateRoleSchema.parse(req.body);
    const membership = await prisma.businessMember.updateMany({
      where: { userId: params.id },
      data: { role: update.role }
    });
    if (membership.count === 0) return res.status(404).json({ error: "User membership not found" });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PUT update permissions
userRouter.put("/:id/permissions", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const { businessId } = z.object({ businessId: z.string().min(1) }).parse(req.query);
    const update = updatePermissionSchema.parse(req.body);
    const membership = await prisma.businessMember.updateMany({
      where: { userId: params.id, businessId },
      data: { canAddIncome: update.canAddIncome, canAddExpense: update.canAddExpense }
    });
    if (membership.count === 0) return res.status(404).json({ error: "Member not found" });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { userRouter };
