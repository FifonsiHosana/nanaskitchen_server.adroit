import { Request, Response } from "express";

import { eq, inArray } from "drizzle-orm";
import { flavors, pricingTiers, product } from "../../../db";
import { db } from "../../models/db_connection";

// ── types ─────────────────────────────────────────────────────────────────────
type TierUpdate = {
  id: number;
  amount?: string;
  discount?: string | null;
};

type ProductRow = typeof product.$inferSelect;
type TierRow = typeof pricingTiers.$inferSelect;

// ── 1. PATCH /price-list/tiers ────────────────────────────────────────────────
// Batch update tiers for a single flavor's pricelist
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

    await Promise.all(
      tiers.map((tier) => {
        const updates: Record<string, unknown> = {};
        if (tier.amount !== undefined) updates.amount = tier.amount;
        if (tier.discount !== undefined) updates.discount = tier.discount;
        return db
          .update(pricingTiers)
          .set(updates)
          .where(eq(pricingTiers.id, tier.id));
      }),
    );

    return res.status(200).json({
      message: "Tiers updated",
      updatedCount: tiers.length,
    });
  } catch (error) {
    console.error("updatePriceTiers error:", error);
    return res.status(500).json({ message: "Failed to update tiers", error });
  }
};

// ── 2. GET /price-list/tiers/preview-apply ────────────────────────────────────
// Preview what would change if source flavor's tiers were applied to targets
// Query: sourceFlavorId, targetFlavorIds (comma-separated), priceGroupId
// e.g. GET /price-list/tiers/preview-apply?sourceFlavorId=3&targetFlavorIds=1,2,4&priceGroupId=2
export const previewApplyTiers = async (req: Request, res: Response) => {
  try {
    const { sourceFlavorId, targetFlavorIds, priceGroupId } = req.query as {
      sourceFlavorId: string;
      targetFlavorIds: string;
      priceGroupId: string;
    };

    if (!sourceFlavorId || !targetFlavorIds || !priceGroupId) {
      return res.status(400).json({
        message:
          "sourceFlavorId, targetFlavorIds and priceGroupId are required",
      });
    }

    const srcFlavorId = Number(sourceFlavorId);
    const tgtFlavorIds = targetFlavorIds.split(",").map(Number).filter(Boolean);
    const groupId = Number(priceGroupId);

    if (tgtFlavorIds.includes(srcFlavorId)) {
      return res.status(400).json({
        message: "sourceFlavorId cannot be in targetFlavorIds",
      });
    }

    // Fetch flavor labels for context
    const allFlavors = await db.select().from(flavors);
    const flavorMap = new Map(allFlavors.map((f) => [f.id, f.label]));

    // Fetch all products for source + target flavors
    const allFlavorIds = [srcFlavorId, ...tgtFlavorIds];
    const allProducts = await db
      .select()
      .from(product)
      .where(inArray(product.flavorId, allFlavorIds));

    // Fetch tiers filtered by pricing group
    const allProductIds = allProducts.map((p) => p.id);
    const allTiers = await db
      .select()
      .from(pricingTiers)
      .where(inArray(pricingTiers.productId, allProductIds));

    const filteredTiers = allTiers.filter((t) => t.pricingGroupId === groupId);

    // Group products by flavorId
    const productsByFlavor = new Map<number, ProductRow[]>();
    for (const p of allProducts) {
      if (!p.flavorId) continue;
      if (!productsByFlavor.has(p.flavorId))
        productsByFlavor.set(p.flavorId, []);
      productsByFlavor.get(p.flavorId)!.push(p);
    }

    // Group tiers by productId
    const tiersByProduct = new Map<number, TierRow[]>();
    for (const t of filteredTiers) {
      if (!t.productId) continue;
      if (!tiersByProduct.has(t.productId)) tiersByProduct.set(t.productId, []);
      tiersByProduct.get(t.productId)!.push(t);
    }

    const sourceProducts = productsByFlavor.get(srcFlavorId) ?? [];

    // Build diff per target flavor
    const preview = tgtFlavorIds.map((tgtFlavorId) => {
      const targetProducts = productsByFlavor.get(tgtFlavorId) ?? [];

      // Match by variantId + isCase
      const targetByVariant = new Map<string, ProductRow>();
      for (const p of targetProducts) {
        const key = `${p.variantId}-${p.isCase ? 1 : 0}`;
        targetByVariant.set(key, p);
      }

      const variantDiffs = sourceProducts.map((srcProduct) => {
        const key = `${srcProduct.variantId}-${srcProduct.isCase ? 1 : 0}`;
        const targetProduct = targetByVariant.get(key);
        const srcTiers = tiersByProduct.get(srcProduct.id) ?? [];
        const tgtTiers = targetProduct
          ? (tiersByProduct.get(targetProduct.id) ?? [])
          : [];

        // Diff tiers by currencyId + case-quantity bracket (a product/group
        // can have multiple tiers per currency for different case ranges)
        const tierChanges = srcTiers.map((srcTier) => {
          const matchingTgt = tgtTiers.find(
            (t) =>
              t.currencyId === srcTier.currencyId &&
              t.minCases === srcTier.minCases &&
              t.maxCases === srcTier.maxCases,
          );
          const hasAmountChange = matchingTgt?.amount !== srcTier.amount;
          const hasDiscountChange = matchingTgt?.discount !== srcTier.discount;

          return {
            currencyId: srcTier.currencyId,
            minCases: srcTier.minCases,
            maxCases: srcTier.maxCases,
            targetTierId: matchingTgt?.id ?? null,
            current: matchingTgt
              ? { amount: matchingTgt.amount, discount: matchingTgt.discount }
              : null,
            incoming: { amount: srcTier.amount, discount: srcTier.discount },
            willChange: !matchingTgt || hasAmountChange || hasDiscountChange,
            isNew: !matchingTgt,
          };
        });

        return {
          variantId: srcProduct.variantId,
          isCase: srcProduct.isCase,
          sourceProductId: srcProduct.id,
          sourceName: srcProduct.title,
          targetProductId: targetProduct?.id ?? null,
          targetName: targetProduct?.title ?? null,
          targetMissing: !targetProduct,
          tierChanges,
          hasAnyChange: tierChanges.some((c) => c.willChange),
        };
      });

      return {
        targetFlavorId: tgtFlavorId,
        targetFlavorLabel: flavorMap.get(tgtFlavorId) ?? "Unknown",
        variants: variantDiffs,
        totalChanges: variantDiffs.filter((v) => v.hasAnyChange).length,
      };
    });

    return res.status(200).json({
      sourceFlavorId,
      sourceFlavorLabel: flavorMap.get(srcFlavorId) ?? "Unknown",
      priceGroupId: groupId,
      preview,
    });
  } catch (error) {
    console.error("previewApplyTiers error:", error);
    return res.status(500).json({ message: "Preview failed", error });
  }
};

// ── 3. POST /price-list/tiers/apply ───────────────────────────────────────────
// Confirm and apply source flavor's tiers to target flavors
// Body: { sourceFlavorId, targetFlavorIds: number[], priceGroupId }
export const applyTiersToFlavors = async (req: Request, res: Response) => {
  try {
    const { sourceFlavorId, targetFlavorIds, priceGroupId } = req.body as {
      sourceFlavorId: number;
      targetFlavorIds: number[];
      priceGroupId: number;
    };

    if (
      !sourceFlavorId ||
      !Array.isArray(targetFlavorIds) ||
      targetFlavorIds.length === 0 ||
      !priceGroupId
    ) {
      return res.status(400).json({
        message:
          "sourceFlavorId, targetFlavorIds and priceGroupId are required",
      });
    }

    if (targetFlavorIds.includes(sourceFlavorId)) {
      return res.status(400).json({
        message: "sourceFlavorId cannot be in targetFlavorIds",
      });
    }

    // Fetch all products for source + target flavors
    const allFlavorIds = [sourceFlavorId, ...targetFlavorIds];
    const allProducts = await db
      .select()
      .from(product)
      .where(inArray(product.flavorId, allFlavorIds));

    // Fetch tiers filtered by pricing group
    const allProductIds = allProducts.map((p) => p.id);
    const allTiers = await db
      .select()
      .from(pricingTiers)
      .where(inArray(pricingTiers.productId, allProductIds));

    const filteredTiers = allTiers.filter(
      (t) => t.pricingGroupId === priceGroupId,
    );

    // Group products and tiers
    const productsByFlavor = new Map<number, ProductRow[]>();
    for (const p of allProducts) {
      if (!p.flavorId) continue;
      if (!productsByFlavor.has(p.flavorId))
        productsByFlavor.set(p.flavorId, []);
      productsByFlavor.get(p.flavorId)!.push(p);
    }

    const tiersByProduct = new Map<number, TierRow[]>();
    for (const t of filteredTiers) {
      if (!t.productId) continue;
      if (!tiersByProduct.has(t.productId)) tiersByProduct.set(t.productId, []);
      tiersByProduct.get(t.productId)!.push(t);
    }

    const sourceProducts = productsByFlavor.get(sourceFlavorId) ?? [];
    const updates: Promise<unknown>[] = [];
    const inserts: (typeof pricingTiers.$inferInsert)[] = [];

    for (const tgtFlavorId of targetFlavorIds) {
      const targetProducts = productsByFlavor.get(tgtFlavorId) ?? [];

      // Match by variantId + isCase
      const targetByVariant = new Map<string, ProductRow>();
      for (const p of targetProducts) {
        const key = `${p.variantId}-${p.isCase ? 1 : 0}`;
        targetByVariant.set(key, p);
      }

      for (const srcProduct of sourceProducts) {
        const key = `${srcProduct.variantId}-${srcProduct.isCase ? 1 : 0}`;
        const targetProduct = targetByVariant.get(key);

        if (!targetProduct) {
          console.warn(
            `No matching variant for variantId=${srcProduct.variantId} isCase=${srcProduct.isCase} in flavor ${tgtFlavorId}`,
          );
          continue;
        }

        const srcTiers = tiersByProduct.get(srcProduct.id) ?? [];
        const tgtTiers = tiersByProduct.get(targetProduct.id) ?? [];

        for (const srcTier of srcTiers) {
          const matchingTgt = tgtTiers.find(
            (t) =>
              t.currencyId === srcTier.currencyId &&
              t.minCases === srcTier.minCases &&
              t.maxCases === srcTier.maxCases,
          );

          if (matchingTgt) {
            updates.push(
              db
                .update(pricingTiers)
                .set({ amount: srcTier.amount, discount: srcTier.discount })
                .where(eq(pricingTiers.id, matchingTgt.id)),
            );
          } else {
            inserts.push({
              productId: targetProduct.id,
              pricingGroupId: priceGroupId,
              currencyId: srcTier.currencyId,
              minCases: srcTier.minCases,
              maxCases: srcTier.maxCases,
              amount: srcTier.amount,
              discount: srcTier.discount,
            } as typeof pricingTiers.$inferInsert);
          }
        }
      }
    }

    await Promise.all(updates);
    if (inserts.length > 0) {
      await db.insert(pricingTiers).values(inserts);
    }

    return res.status(200).json({
      message: "Tiers applied successfully",
      updatedTiers: updates.length,
      insertedTiers: inserts.length,
      targetFlavors: targetFlavorIds,
    });
  } catch (error) {
    console.error("applyTiersToFlavors error:", error);
    return res.status(500).json({ message: "Apply failed", error });
  }
};