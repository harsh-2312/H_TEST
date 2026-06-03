import { Router } from "express";
import { z } from "zod";
import { PaymentMethodCategory } from "@prisma/client";
import { prisma } from "../utils/prisma";

const paymentMethodRouter = Router();

const paymentMethodSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(1).max(100),
  category: z.nativeEnum(PaymentMethodCategory)
});

paymentMethodRouter.get("/", async (req, res, next) => {
  try {
    const businessId = z.string().min(1).parse(req.query.businessId);
    const paymentMethods = await prisma.paymentMethod.findMany({ where: { businessId }, orderBy: { name: "asc" } });
    res.json(paymentMethods);
  } catch (error) {
    next(error);
  }
});

paymentMethodRouter.post("/", async (req, res, next) => {
  try {
    const data = paymentMethodSchema.parse(req.body);
    const paymentMethod = await prisma.paymentMethod.create({ data });
    res.status(201).json(paymentMethod);
  } catch (error) {
    next(error);
  }
});

paymentMethodRouter.put("/:id", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const data = paymentMethodSchema.parse(req.body);
    const paymentMethod = await prisma.paymentMethod.update({ where: { id: params.id }, data });
    res.json(paymentMethod);
  } catch (error) {
    next(error);
  }
});

paymentMethodRouter.delete("/:id", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    await prisma.paymentMethod.delete({ where: { id: params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { paymentMethodRouter };
