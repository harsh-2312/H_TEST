import { Router } from "express";
import { z } from "zod";
import { TransactionType } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

const transactionRouter = Router();

const transactionSchema = z.object({
  businessId: z.string().min(1),
  amount: z.number().positive(),
  type: z.nativeEnum(TransactionType),
  paymentMethodId: z.string().min(1),
  categoryId: z.string().min(1),
  note: z.string().max(500).optional().default(""),
  occurredAt: z.string().optional(),
  deviceId: z.string().max(128)
});

const searchSchema = z.object({
  businessId: z.string().min(1),
  type: z.string().optional(),
  categoryId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  userId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20)
});

transactionRouter.get("/", async (req, res, next) => {
  try {
    const query = searchSchema.parse(req.query);
    const where: any = { businessId: query.businessId, isDeleted: false };
    if (query.type) where.type = query.type;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.paymentMethodId) where.paymentMethodId = query.paymentMethodId;
    if (query.userId) where.createdById = query.userId;
    if (query.from) where.occurredAt = { gte: new Date(query.from) };
    if (query.to) where.occurredAt = { ...where.occurredAt, lte: new Date(query.to) };

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { createdBy: true, paymentMethod: true, category: true }
      }),
      prisma.transaction.count({ where })
    ]);

    return res.json({ transactions, total, page: query.page, limit: query.limit });
  } catch (error) {
    next(error);
  }
});

transactionRouter.post("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = transactionSchema.parse(req.body);
    const auth = req.auth;
    if (!auth) return res.status(401).json({ error: "Unauthorized" });

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          businessId: data.businessId,
          createdById: auth.userId,
          updatedById: auth.userId,
          amount: data.amount,
          type: data.type,
          paymentMethodId: data.paymentMethodId,
          categoryId: data.categoryId,
          note: data.note,
          occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
          deviceId: data.deviceId
        }
      });
      await tx.transactionAuditLog.create({
        data: {
          transactionId: created.id,
          action: "CREATE",
          performedById: auth.userId,
          businessId: data.businessId,
          newValue: {
            amount: data.amount,
            type: data.type,
            paymentMethodId: data.paymentMethodId,
            categoryId: data.categoryId,
            note: data.note,
            occurredAt: data.occurredAt
          },
          deviceId: data.deviceId
        }
      });
      return created;
    });

    return res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

const updateSchema = transactionSchema.extend({ transactionId: z.string().min(1) });

transactionRouter.put("/:transactionId", async (req: AuthenticatedRequest, res, next) => {
  try {
    const params = z.object({ transactionId: z.string().min(1) }).parse(req.params);
    const data = transactionSchema.parse(req.body);
    const auth = req.auth;
    if (!auth) return res.status(401).json({ error: "Unauthorized" });

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({ where: { transactionId: params.transactionId } });
      if (!existing) throw new Error("Transaction not found");
      if (existing.isDeleted) throw new Error("Cannot update deleted transaction");

      const updatedTransaction = await tx.transaction.update({
        where: { transactionId: params.transactionId },
        data: {
          updatedById: auth.userId,
          amount: data.amount,
          type: data.type,
          paymentMethodId: data.paymentMethodId,
          categoryId: data.categoryId,
          note: data.note,
          occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
          deviceId: data.deviceId,
          syncVersion: { increment: 1 }
        }
      });

      await tx.transactionAuditLog.create({
        data: {
          transactionId: existing.id,
          action: "UPDATE",
          performedById: auth.userId,
          businessId: existing.businessId,
          oldValue: {
            amount: existing.amount,
            type: existing.type,
            paymentMethodId: existing.paymentMethodId,
            categoryId: existing.categoryId,
            note: existing.note,
            occurredAt: existing.occurredAt
          },
          newValue: {
            amount: data.amount,
            type: data.type,
            paymentMethodId: data.paymentMethodId,
            categoryId: data.categoryId,
            note: data.note,
            occurredAt: data.occurredAt
          },
          deviceId: data.deviceId
        }
      });

      return updatedTransaction;
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

transactionRouter.delete("/:transactionId", async (req: AuthenticatedRequest, res, next) => {
  try {
    const params = z.object({ transactionId: z.string().min(1) }).parse(req.params);
    const auth = req.auth;
    if (!auth) return res.status(401).json({ error: "Unauthorized" });

    const deleted = await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({ where: { transactionId: params.transactionId } });
      if (!existing) throw new Error("Transaction not found");
      const softDeleted = await tx.transaction.update({
        where: { transactionId: params.transactionId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedById: auth.userId,
          syncVersion: { increment: 1 }
        }
      });
      await tx.transactionAuditLog.create({
        data: {
          transactionId: existing.id,
          action: "DELETE",
          performedById: auth.userId,
          businessId: existing.businessId,
          oldValue: existing,
          deviceId: existing.deviceId
        }
      });
      return softDeleted;
    });

    return res.json(deleted);
  } catch (error) {
    next(error);
  }
});

export { transactionRouter };
