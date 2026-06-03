import { Router } from "express";
import { z } from "zod";
import { CategoryType } from "@prisma/client";
import { prisma } from "../utils/prisma";

const categoryRouter = Router();

const categorySchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(CategoryType)
});

categoryRouter.get("/", async (req, res, next) => {
  try {
    const businessId = z.string().min(1).parse(req.query.businessId);
    const categories = await prisma.category.findMany({ where: { businessId }, orderBy: { name: "asc" } });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

categoryRouter.post("/", async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({ data });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

categoryRouter.put("/:id", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.update({ where: { id: params.id }, data });
    res.json(category);
  } catch (error) {
    next(error);
  }
});

categoryRouter.delete("/:id", async (req, res, next) => {
  try {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    await prisma.category.delete({ where: { id: params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { categoryRouter };
