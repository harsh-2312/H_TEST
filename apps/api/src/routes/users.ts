import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../utils/prisma";

const userRouter = Router();

const updateRoleSchema = z.object({ role: z.nativeEnum(UserRole) });

userRouter.get("/", async (req, res, next) => {
  try {
    const businessId = z.string().min(1).parse(req.query.businessId);
    const membership = await prisma.businessMember.findMany({
      where: { businessId },
      include: {
        user: true
      }
    });
    res.json(membership.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      joinedAt: member.joinedAt
    })));
  } catch (error) {
    next(error);
  }
});

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

export { userRouter };
