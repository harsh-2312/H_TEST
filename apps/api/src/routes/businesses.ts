import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

const businessRouter = Router();

businessRouter.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const memberships = await prisma.businessMember.findMany({ where: { userId }, include: { business: true } });
    res.json(memberships.map((member) => ({ business: member.business, role: member.role, joinedAt: member.joinedAt })));
  } catch (error) {
    next(error);
  }
});

businessRouter.get("/:id/members", async (req: AuthenticatedRequest, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const members = await prisma.businessMember.findMany({
      where: { businessId: params.id },
      include: { user: true }
    });
    res.json(members.map((member) => ({ id: member.id, role: member.role, user: { id: member.user.id, name: member.user.name, email: member.user.email } })));
  } catch (error) {
    next(error);
  }
});

export { businessRouter };
