import { eq } from "drizzle-orm";
import {
  countryProductSettings,
  order,
  product,
  review,
} from "../../db/schema";
import { db } from "../models/db_connection";
import { Request, Response } from "express";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const response = await db
      .select({
        id: product.id,
        image: product.image,
        images: product.images,
        name: product.title,
        // usd: product.dollarPrice,
        // ghs: product.cediPrice,
        // eur: product.euroPrice,
        length: product.length,
        width: product.width,
        weight: product.weight,
        height: product.height,
        // cediDiscount: product.cediDiscount,
        // dollarDiscount: product.dollarDiscount,
        // euroDiscount: product.euroDiscount,
        // outOfStockGH: product.outOfStockGH,
        // outOfStockUS: product.outOfStockUS,
        // outOfStockEU: product.outOfStockEU,
        // visibleGH: product.visibleGH,
        // visibleUS: product.visibleUS,
        // visibleEU: product.visibleEU,
        // version: product.version,
      })
      .from(product);

    const shaped = response.map(
      ({
        // usd,
        // ghs,
        // eur,
        length,
        width,
        height,
        weight,
        id,
        image,
        images,
        name,
        // cediDiscount,
        // dollarDiscount,
        // euroDiscount,
        // outOfStockGH,
        // outOfStockUS,
        // outOfStockEU,
        // visibleGH,
        // visibleUS,
        // visibleEU,
        // version,
      }) => ({
        id,
        image,
        images,
        name,
        // price: { usd, ghs, eur },
        weight,
        dimensions: { length, width, height },
        // discounts: { cediDiscount, dollarDiscount, euroDiscount },
        // outOfStockGH,
        // outOfStockUS,
        // outOfStockEU,
        // visibleGH,
        // visibleUS,
        // visibleEU,
        // version,
      }),
    );

    return res.status(200).json(shaped);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch products" });
  }
};

export const fetchProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Product id is required" });
    }
    const response = await db
      .select({
        id: product.id,
        image: product.image,
        images: product.images,
        name: product.title,
        // usd: product.dollarPrice,
        // ghs: product.cediPrice,
        // eur: product.euroPrice,
        length: product.length,
        width: product.width,
        weight: product.weight,
        height: product.height,
        // cediDiscount: product.cediDiscount,
        // dollarDiscount: product.dollarDiscount,
        // euroDiscount: product.euroDiscount,
        // version: product.version,
        // visibleGH: product.visibleGH,
        // visibleUS: product.visibleUS,
        // visibleEU: product.visibleEU,
        // outOfStockGH: product.outOfStockGH,
        // outOfStockUS: product.outOfStockUS,
        // outOfStockEU: product.outOfStockEU,
      })
      .from(product)
      .where(eq(product.id, Number(id)))
      .limit(1);

    const shaped = response.map(
      ({
        // usd,
        // ghs,
        // eur,
        length,
        width,
        height,
        weight,
        id,
        image,
        images,
        name,
        // cediDiscount,
        // dollarDiscount,
        // euroDiscount,
        // outOfStockGH,
        // outOfStockUS,
        // outOfStockEU,
        // visibleGH,
        // visibleUS,
        // visibleEU,
        // version,
      }) => ({
        id,
        image,
        images,
        name,
        // price: { usd, ghs, eur },
        weight,
        dimensions: { length, width, height },
        // outOfStockGH,
        // outOfStockUS,
        // outOfStockEU,
        // visibleGH,
        // visibleUS,
        // visibleEU,
        // discounts: { cediDiscount, dollarDiscount, euroDiscount },
        // version,
      }),
    );
    return res.status(200).json(shaped);
  } catch (error) {
    console.error("updateProduct error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to update product" });
  }
};

// PATCH /products/:id
// Update product fields — all fields optional, only sends what changed
// body: { title?, dollarPrice?, cediPrice?, euroPrice?, image?, dollarDiscount?, cediDiscount?, euroDiscount?, length?, height?, width?, weight?, country? }
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Product id is required" });
    }

    // ─── Split countrySettings out from the rest ───────────────────────────

    const { countrySettings, ...rest } = req.body;

    const allowedFields = [
      "title",
      "image",
      "images",
      "length",
      "height",
      "width",
      "weight",
      "unitsPerCase",
    ] as const;

    const updates = allowedFields.reduce<Record<string, unknown>>(
      (acc, field) => {
        if (rest[field] !== undefined) acc[field] = rest[field];
        return acc;
      },
      {},
    );

    if (Object.keys(updates).length === 0 && !countrySettings?.length) {
      return res
        .status(400)
        .json({ message: "No valid fields provided to update" });
    }

    updates.updatedAt = new Date().toISOString().slice(0, 23).replace("T", " ");

    if (Object.keys(updates).length > 0) {
      await db
        .update(product)
        .set(updates)
        .where(eq(product.id, Number(id)));
    }

    if (countrySettings?.length) {
      await Promise.all(
        countrySettings.map(
          (setting: { id: number; stock: number; visible: number }) =>
            db
              .update(countryProductSettings)
              .set({
                outOfStock: Boolean(setting.stock),
                visible: Boolean(setting.visible),
              })
              .where(eq(countryProductSettings.id, setting.id)),
        ),
      );
    }

    const updated = await db
      .select()
      .from(product)
      .where(eq(product.id, Number(id)))
      .limit(1);

    if (!updated.length) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res
      .status(200)
      .json({ message: "Update successful", product: updated[0] });
  } catch (error) {
    console.error("updateProduct error:", error);
    return res.status(500).json({ message: "Failed to update product" });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const requiredFields = [
      "title",
      "dollarPrice",
      "cediPrice",
      "euroPrice",
    ] as const;

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === "") {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    const allowedFields = [
      "title",
      "dollarPrice",
      "cediPrice",
      "euroPrice",
      "image",
      "images",
      "dollarDiscount",
      "cediDiscount",
      "euroDiscount",
      "length",
      "height",
      "width",
      "weight",
      "outOfStockGH",
      "outOfStockUS",
      "outOfStockEU",
      "visibleGH",
      "visibleUS",
      "visibleEU",
      "version",
    ] as const;

    const newProduct = allowedFields.reduce<Record<string, unknown>>(
      (acc, field) => {
        if (req.body[field] !== undefined) acc[field] = req.body[field];
        return acc;
      },
      {},
    );

    const now = new Date().toISOString().slice(0, 23).replace("T", " ");
    newProduct.createdAt = now;
    newProduct.updatedAt = now;
    newProduct.sourceId = crypto.randomUUID().split("-").slice(0, 2).join("-");

    const inserted = await db
      .insert(product)
      .values(newProduct as typeof product.$inferInsert)
      .$returningId();
    const insertedId = (() => {
      const first = inserted[0] as unknown;
      return typeof first === "number"
        ? first
        : (first as { id: number } | undefined)?.id;
    })();

    if (!insertedId) {
      return res
        .status(500)
        .json({ message: "status 500: Failed to create product" });
    }

    const created = await db
      .select()
      .from(product)
      .where(eq(product.id, insertedId))
      .limit(1);

    return res.status(201).json({ product: created[0] });
  } catch (error) {
    console.error("createProduct error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to create product" });
  }
};

// DELETE /products/:id
// this is permanent

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Product id is required" });
    }

    // confirm product exists before deleting
    const existing = await db
      .select({ id: product.id, title: product.title })
      .from(product)
      .where(eq(product.id, Number(id)))
      .limit(1);

    if (!existing.length) {
      return res.status(404).json({ message: "Product not found" });
    }

    await db.delete(product).where(eq(product.id, Number(id)));

    return res.status(200).json({
      message: `Product "${existing[0]?.title ?? "Unknown"}" deleted successfully`,
    });
  } catch (error) {
    console.error("deleteProduct error:", error);
    return res
      .status(500)
      .json({ message: "status 500: Failed to delete product" });
  }
};
