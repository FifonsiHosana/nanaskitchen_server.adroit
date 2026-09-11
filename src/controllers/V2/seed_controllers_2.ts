import { Request, Response } from "express";

import { eq, inArray, and } from "drizzle-orm";
import { db } from "../../models/db_connection";
import { product, variants } from "../../../db";

// ── 1. ONE-TIME: Patch variantId on existing products ─────────────────────────
// Hit this once to fill in variantId on all existing products
// based on their title suffix patterns
// DELETE or disable this endpoint after running
export const seedVariantIds = async (req: Request, res: Response) => {
  try {
    await db.insert(variants).values([
      { id: 1, variantName: "Plain", titleTag: "" },
      { id: 2, variantName: "With Bag", titleTag: " with bag" },
      { id: 3, variantName: "With Package", titleTag: " (with package)" },
      {
        id: 4,
        variantName: "With Bag & Package",
        titleTag: " with bag and packaging",
      },
    ]);

    const allProducts = await db.select().from(product);

    // Map title suffix patterns -> variantId
    // variantId: 1=Plain, 2=With Bag, 3=With Package, 4=With Bag & Package
    const getVariantId = (title: string): number | null => {
      if (title.endsWith("with bag and packaging")) return 4;
      if (title.endsWith("(with package)")) return 3;
      if (title.endsWith("with bag")) return 2;
      // plain: ends with flavor name or "Case"
      // e.g. "16 oz Black Shitor (Mild)" / "16 oz Black Shitor (Mild) Case"
      if (
        title.endsWith("(Mild)") ||
        title.endsWith("(Hot)") ||
        title.endsWith("(Extra Hot)") ||
        title.endsWith("Green Shitor") ||
        title.endsWith("Case")
      )
        return 1;
      return null;
    };

    const updates: Promise<unknown>[] = [];
    const skipped: string[] = [];

    for (const p of allProducts) {
      const variantId = getVariantId(p.title);
      if (variantId === null) {
        skipped.push(p.title);
        continue;
      }
      updates.push(
        db.update(product).set({ variantId }).where(eq(product.id, p.id)),
      );
    }

    await Promise.all(updates);

    return res.status(200).json({
      message: "variantId seeded on existing products",
      updated: updates.length,
      skipped,
    });
  } catch (error) {
    console.error("seedVariantIds error:", error);
    return res.status(500).json({ message: "Seeding variantId failed", error });
  }
};

