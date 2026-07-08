import { and, eq, inArray, or, sql } from "drizzle-orm";
import {
  countries,
  countryProductSettings,
  currency,
  flavors,
  pricingGroups,
  pricingTiers,
  product,
} from "../../../db";
import { db } from "../../models/db_connection";
import { Request, Response } from "express";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ message: "Invalid request body" });
    }

    const requiredFields = [
      "title",
      //   "image",
      //   "images",
      "unitsPerCase",
      "length",
      "height",
      "width",
      "weight",
    ] as const;

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === "") {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

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
      .values(newProduct as typeof product.$inferInsert);

    const insertedId = (() => {
      const first = inserted[0].insertId as unknown;
      return typeof first === "number"
        ? first
        : (first as { id: number } | undefined)?.id;
    })();

    if (!insertedId) {
      return res
        .status(500)
        .json({ message: "status 500: Failed to create product" });
    }

    // const insertedProductPrices = await db.insert(pricingTiers).values({
    //   amount: 0,
    //   maxCases: 0,
    //   minCases: 0,
    //   currencyId: inserted[0].insertId, // what about other currencies?
    //   discount: 0,
    //   pricingGroupId: 1, // what about other pricing groups?
    //   productId: inserted[0].insertId,
    // } as unknown as typeof pricingTiers.$inferInsert);

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

export const getProducts = async (req: Request, res: Response) => {
  const { id } = req.body;
  try {
    const response = await db
      .select()
      .from(product)
      .innerJoin(pricingTiers, eq(product.id, pricingTiers.productId))
      .innerJoin(
        pricingGroups,
        eq(pricingGroups.id, pricingTiers.pricingGroupId),
      )
      .where(eq(product.flavorId, id))
      .limit(2);
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch products" });
  }
};

export const fetchFlavors = async (req: Request, res: Response) => {
  try {
    const response = await db.select().from(flavors);
    res.status(200).json({ flavors: response });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "status 500: Failed to fetch products" });
  }
};

export const getProductByFlavor = async (req: Request, res: Response) => {
  const { flavorId } = req.params;
  try {
    const response = await db
      .select({
        id: product.id,
        sourceId: product.sourceId,
        title: product.title,
        image: product.image,
        images: product.images,
        length: product.length,
        height: product.height,
        width: product.width,
        weight: product.weight,
        unitsPerCase: product.unitsPerCase,
        countrySettings: sql`JSON_ARRAYAGG(
        JSON_OBJECT(
        'id', ${countryProductSettings.id},
        'countryName', ${countries.countryCode},
        'visible',${countryProductSettings.visible},
        'stock',${countryProductSettings.outOfStock}
        )
      )
    `.as("country_settings"),
        flavorId: product.flavorId,
        isCase: product.isCase,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .from(product)
      .innerJoin(
        countryProductSettings,
        eq(countryProductSettings.productId, product.id),
      )
      .innerJoin(countries, eq(countries.id, countryProductSettings.countryId))
      .where(eq(product.flavorId, Number(flavorId)))
      .groupBy(product.id);
    res.status(200).json({ flavors: response });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "status 500: Failed to get products by their flavor" });
  }
};

export const fetchProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;
  try {
    const response = await db
      .select({
        productId: product.id,
        productTitle: product.title,
        mainImage: product.image,
        images: product.images,
        length: product.length,
        width: product.width,
        height: product.height,
        weight: product.weight,
        isCase: product.isCase,
        unitsPerCase: product.unitsPerCase,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        countrySettings: sql`JSON_ARRAYAGG(
        JSON_OBJECT(
        'id', ${countryProductSettings.id},
        'countryName', ${countries.countryLabel},
        'visible',${countryProductSettings.visible},
        'stock',${countryProductSettings.outOfStock}
        )
      )
    `.as("country_settings"),
      })
      .from(product)
      .innerJoin(
        countryProductSettings,
        eq(countryProductSettings.productId, product.id),
      )
      .innerJoin(countries, eq(countries.id, countryProductSettings.countryId))
      // .innerJoin(currency,eq(currency.id, countries.currencyId))
      .where(eq(product.id, Number(productId)));

    res.status(200).json({ product: response });
  } catch (error) {}
};

export const updateProduct = async (req: Request, res: Response) => {};

export const fetchPriceListByFlavorandGroupId = async (
  req: Request,
  res: Response,
) => {
  const { priceGroupId, flavorId } = req.params;

  const response = await db
    .select({
      ProductName: product.title,
      groupName: pricingGroups.groupName,
      ProductId: product.id,
      priceGroupId: pricingGroups.id,
      flavorId: product.flavorId,
      flavorName: flavors.label,
      isCase: product.isCase,
      length: product.length,
      width: product.width,
      height: product.height,
      unitsPerCase: product.unitsPerCase,
      PricingTiers: sql`
      JSON_ARRAYAGG(
        JSON_OBJECT(
        'id', ${pricingTiers.id},
        'currencyId', ${pricingTiers.currencyId},
        'currency',${currency.currencyLabel},
        'amount', ${pricingTiers.amount},
        'discount', ${pricingTiers.discount}
        )
      )
    `.as("PricingTiers"),
    })
    .from(product)
    .innerJoin(pricingTiers, eq(pricingTiers.productId, product.id))
    .innerJoin(pricingGroups, eq(pricingTiers.pricingGroupId, pricingGroups.id))
    .innerJoin(currency, eq(currency.id, pricingTiers.currencyId))
    .innerJoin(flavors, eq(flavors.id, product.flavorId))
    .where(
      and(
        eq(product.flavorId, Number(flavorId)),
        eq(pricingGroups.id, Number(priceGroupId)),
      ),
    )
    .groupBy(product.id);
  res.status(200).json({ priceList: response });
};

export const fetchFullPriceListByFlavorId = async (
  req: Request,
  res: Response,
) => {
  const { flavorId } = req.params;

  const response = await db
    .select({
      ProductName: product.title,
      // groupName: pricingGroups.groupName,
      ProductId: product.id,
      // priceGroupId: pricingGroups.id,
      flavorId: product.flavorId,
      flavorName: flavors.label,
      isCase: product.isCase,
      length: product.length,
      width: product.width,
      height: product.height,
      unitsPerCase: product.unitsPerCase,
      PricingTiers: sql`
      JSON_ARRAYAGG(
        JSON_OBJECT(
        'pricingGroupId', ${pricingGroups.id},
        'pricingGroupName', ${pricingGroups.groupName},
        'id', ${pricingTiers.id},
        'currencyId', ${pricingTiers.currencyId},
        'currency',${currency.currencyLabel},
        'amount', ${pricingTiers.amount},
        'discount', ${pricingTiers.discount}
        )
      )
    `.as("PricingTiers"),
    })
    .from(product)
    .innerJoin(pricingTiers, eq(pricingTiers.productId, product.id))
    .innerJoin(pricingGroups, eq(pricingTiers.pricingGroupId, pricingGroups.id))
    .innerJoin(currency, eq(currency.id, pricingTiers.currencyId))
    .innerJoin(flavors, eq(flavors.id, product.flavorId))
    .where(eq(product.flavorId, Number(flavorId)))
    .groupBy(product.id);
  res.status(200).json({ priceList: response });
};

// ── types ─────────────────────────────────────────────────────────────────────
type TierUpdate = {
  id: number;
  amount?: string;
  discount?: string | null;
};

type TierRow = {
  id: number;
  productId: number | null;
  currencyId: number | null;
  pricingGroupId: number | null;
  amount: string;
  discount: string | null;
};

// ── 1. PATCH /price-list/tiers ────────────────────────────────────────────────
// Batch update multiple tiers at once
// Body: { tiers: [{ id, amount?, discount? }] }
export const updatePriceTiers = async (req: Request, res: Response) => {
  try {
    const { tiers } = req.body as { tiers: TierUpdate[] };

    if (!Array.isArray(tiers) || tiers.length === 0) {
      return res.status(400).json({ message: "tiers array is required" });
    }

    for (const tier of tiers) {
      if (!tier.id) {
        return res.status(400).json({ message: "Each tier must have an id" });
      }
      if (tier.amount === undefined && tier.discount === undefined) {
        return res.status(400).json({
          message: `Tier ${tier.id}: at least one of amount or discount is required`,
        });
      }
    }

    // Update each tier individually (Drizzle doesn't support bulk update with different values)
    const results = await Promise.all(
      tiers.map(async (tier) => {
        const updates: Record<string, unknown> = {};
        if (tier.amount !== undefined) updates.amount = tier.amount;
        if (tier.discount !== undefined) updates.discount = tier.discount;

        await db
          .update(pricingTiers)
          .set(updates)
          .where(eq(pricingTiers.id, tier.id));

        return tier.id;
      }),
    );

    return res.status(200).json({
      message: "Tiers updated",
      updatedTiers: results,
    });
  } catch (error) {
    console.error("updatePriceTiers error:", error);
    return res.status(500).json({ message: "Failed to update tiers", error });
  }
};

// ── 2. GET /price-list/tiers/preview-apply ────────────────────────────────────
// Preview what would change if source product's tiers were applied to targets
// Query params: sourceProductId, targetProductIds (comma-separated)
// e.g. /price-list/tiers/preview-apply?sourceProductId=1&targetProductIds=5,6,7
export const previewApplyTiers = async (req: Request, res: Response) => {
  try {
    const { sourceProductId, targetProductIds } = req.query as {
      sourceProductId: string;
      targetProductIds: string;
    };

    if (!sourceProductId || !targetProductIds) {
      return res.status(400).json({
        message: "sourceProductId and targetProductIds are required",
      });
    }

    const sourceId = Number(sourceProductId);
    const targetIds = targetProductIds.split(",").map(Number).filter(Boolean);

    if (targetIds.includes(sourceId)) {
      return res.status(400).json({
        message: "sourceProductId cannot be in targetProductIds",
      });
    }

    // Fetch source tiers
    const sourceTiers = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.productId, sourceId));

    if (sourceTiers.length === 0) {
      return res.status(404).json({
        message: `No tiers found for source product ${sourceId}`,
      });
    }

    // Fetch target tiers
    const targetTiers = await db
      .select()
      .from(pricingTiers)
      .where(inArray(pricingTiers.productId, targetIds));

    // Fetch product titles for context
    const allIds = [sourceId, ...targetIds];
    const products = await db
      .select({ id: product.id, title: product.title })
      .from(product)
      .where(inArray(product.id, allIds));

    const productMap = new Map(products.map((p) => [p.id, p.title]));

    // Build diff: for each target product, match tiers by currencyId + pricingGroupId
    const diff = targetIds.map((targetId) => {
      const targetProductTiers = targetTiers.filter(
        (t) => t.productId === targetId,
      );

      const changes = sourceTiers.map((sourceTier) => {
        const matchingTarget = targetProductTiers.find(
          (t) =>
            t.currencyId === sourceTier.currencyId &&
            t.pricingGroupId === sourceTier.pricingGroupId,
        );

        const hasAmountChange = matchingTarget?.amount !== sourceTier.amount;
        const hasDiscountChange =
          matchingTarget?.discount !== sourceTier.discount;
        const hasChanges =
          !matchingTarget || hasAmountChange || hasDiscountChange;

        return {
          currencyId: sourceTier.currencyId,
          pricingGroupId: sourceTier.pricingGroupId,
          targetTierId: matchingTarget?.id ?? null,
          current: matchingTarget
            ? {
                amount: matchingTarget.amount,
                discount: matchingTarget.discount,
              }
            : null,
          incoming: {
            amount: sourceTier.amount,
            discount: sourceTier.discount,
          },
          willChange: hasChanges,
          isNew: !matchingTarget, // tier doesn't exist on target yet
        };
      });

      return {
        targetProductId: targetId,
        targetProductTitle: productMap.get(targetId) ?? "Unknown",
        changes,
        totalChanges: changes.filter((c) => c.willChange).length,
      };
    });

    return res.status(200).json({
      sourceProductId: sourceId,
      sourceProductTitle: productMap.get(sourceId) ?? "Unknown",
      preview: diff,
    });
  } catch (error) {
    console.error("previewApplyTiers error:", error);
    return res.status(500).json({ message: "Preview failed", error });
  }
};

// ── 3. POST /price-list/tiers/apply ───────────────────────────────────────────
// Confirm and apply source product's tiers to target products
// Body: { sourceProductId, targetProductIds: number[] }
export const applyTiersToProducts = async (req: Request, res: Response) => {
  try {
    const { sourceProductId, targetProductIds } = req.body as {
      sourceProductId: number;
      targetProductIds: number[];
    };

    if (
      !sourceProductId ||
      !Array.isArray(targetProductIds) ||
      targetProductIds.length === 0
    ) {
      return res.status(400).json({
        message: "sourceProductId and targetProductIds array are required",
      });
    }

    if (targetProductIds.includes(sourceProductId)) {
      return res.status(400).json({
        message: "sourceProductId cannot be in targetProductIds",
      });
    }

    // Fetch source tiers
    const sourceTiers = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.productId, sourceProductId));

    if (sourceTiers.length === 0) {
      return res.status(404).json({
        message: `No tiers found for source product ${sourceProductId}`,
      });
    }

    // Fetch existing tiers for all targets
    const existingTargetTiers = await db
      .select()
      .from(pricingTiers)
      .where(inArray(pricingTiers.productId, targetProductIds));

    const updates: Promise<unknown>[] = [];
    const inserts: (typeof pricingTiers.$inferInsert)[] = [];

    for (const targetId of targetProductIds) {
      const targetTiersForProduct = existingTargetTiers.filter(
        (t) => t.productId === targetId,
      );

      for (const sourceTier of sourceTiers) {
        const matchingTarget = targetTiersForProduct.find(
          (t) =>
            t.currencyId === sourceTier.currencyId &&
            t.pricingGroupId === sourceTier.pricingGroupId,
        );

        if (matchingTarget) {
          // Update existing tier
          updates.push(
            db
              .update(pricingTiers)
              .set({ amount: sourceTier.amount, discount: sourceTier.discount })
              .where(eq(pricingTiers.id, matchingTarget.id)),
          );
        } else {
          // Insert new tier (target didn't have this currency/group combo)
          inserts.push({
            productId: targetId,
            pricingGroupId: sourceTier.pricingGroupId,
            currencyId: sourceTier.currencyId,
            minCases: sourceTier.minCases,
            maxCases: sourceTier.maxCases,
            amount: sourceTier.amount,
            discount: sourceTier.discount,
          } as typeof pricingTiers.$inferInsert);
        }
      }
    }

    // Run all updates and inserts
    await Promise.all(updates);
    if (inserts.length > 0) {
      await db.insert(pricingTiers).values(inserts);
    }

    return res.status(200).json({
      message: "Tiers applied successfully",
      updatedTiers: updates.length,
      insertedTiers: inserts.length,
      targetProducts: targetProductIds,
    });
  } catch (error) {
    console.error("applyTiersToProducts error:", error);
    return res.status(500).json({ message: "Apply failed", error });
  }
};

export const fixPriceList = async (req: Request, res: Response) => {
  try {
    const invalidTiers = await db
      .select({ id: pricingTiers.id })
      .from(pricingTiers)
      .innerJoin(
        pricingGroups,
        eq(pricingTiers.pricingGroupId, pricingGroups.id),
      )
      .innerJoin(product, eq(product.id, pricingTiers.productId))
      .where(
        or(
          // Retailers shouldn't have case products
          and(
            eq(product.isCase, true),
            eq(pricingGroups.groupName, "Retailer"),
          ),
          // Wholesalers shouldn't have single products
          and(
            eq(product.isCase, false),
            eq(pricingGroups.groupName, "Wholesaler"),
          ),
          // Distributors shouldn't have single products
          and(
            eq(product.isCase, false),
            eq(pricingGroups.groupName, "Distributor"),
          ),
        ),
      );

    if (invalidTiers.length === 0) {
      return res.status(200).json({ message: "No inconsistencies found" });
    }

    const invalidIds = invalidTiers.map((t) => t.id);

    await db.delete(pricingTiers).where(inArray(pricingTiers.id, invalidIds));

    res.status(200).json({
      message: `Successfully deleted ${invalidIds.length} inconsistent records`,
    });
  } catch (error) {
    console.error("fixPriceList error:", error);
    res.status(500).json({ message: "Failed to fix price list" });
  }
};
