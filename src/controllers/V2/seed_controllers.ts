// import { eq, inArray } from "drizzle-orm";
// import {
//   countries,
//   countryProductSettings,
//   pricingGroups,
//   pricingTiers,
//   product,
// } from "../../../db";
// import { db } from "../../models/db_connection";
// import { Request, Response } from "express";

// // ── helpers ────────────────────────────────────────────────────────────────────
// const now = () => new Date().toISOString().slice(0, 23).replace("T", " ");
// const uid = () => crypto.randomUUID().split("-").slice(0, 2).join("-");

// // ── flavors & variants ─────────────────────────────────────────────────────────
// const FLAVORS = [
//   "Black Shitor (Mild)",
//   "Black Shitor (Hot)",
//   "Black Shitor (Extra Hot)",
//   "Green Shitor",
// ];

// const JAR_VARIANTS = [
//   { suffix: "" }, // plain
//   { suffix: " with bag" },
//   { suffix: " (with package)" },
//   { suffix: " with bag and packaging" },
// ];

// const CASE_VARIANTS = [
//   { suffix: " Case" },
//   { suffix: " Case with bag" },
//   { suffix: " Case (with package)" },
//   { suffix: " Case with bag and packaging" },
// ];

// // ── pricing map: variantIndex -> [wholesale/retail price, distributor price]
// // retail uses same prices as wholesale
// // [wholesale & retail per jar, distributor per jar]
// const PRICING_MAP: Record<number, [number, number]> = {
//   0: [110, 105], // plain
//   1: [115, 115], // with bag
//   2: [125, 120], // with packaging
//   3: [130, 130], // with bag+packaging
// };

// // ── pricing groups & currencies ───────────────────────────────────────────────
// // Retail  = id 1 → GHS (1) + USD (2), minCases 0
// // Wholesale = id 2 → GHS (1) only,    minCases 4
// // Distributor = id 3 → GHS (1) only,  minCases 100

// const GHS_ID = 1;
// const USD_ID = 2;

// const RETAIL_GROUP_ID = 1;
// const WHOLESALE_GROUP_ID = 2;
// const DISTRIBUTOR_GROUP_ID = 3;

// // ── existing products already in DB ───────────────────────────────────────────
// const EXISTING_TITLES = new Set([
//   "16 oz Black Shitor (Mild)",
//   "16 oz Black Shitor (Hot)",
//   "16 oz Black Shitor (Extra Hot)",
//   "16 oz Green Shitor",
//   "16 oz Black Shitor Mild (with package)",
//   "16 oz Black Shitor Hot (with package)",
//   "16 oz Black Shitor Extra Hot (with package)",
//   "16 oz Green Shitor (with package)",
// ]);

// // ── controller ────────────────────────────────────────────────────────────────
// export const bulkInsertProductsAndPricing = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     // 1. Build the full list of 32 products
//     const allProductMeta: {
//       title: string;
//       variantIndex: number;
//       isCase: boolean;
//     }[] = [];

//     for (const flavor of FLAVORS) {
//       for (let i = 0; i < JAR_VARIANTS.length; i++) {
//         allProductMeta.push({
//           title: `16 oz ${flavor}${JAR_VARIANTS[i]!.suffix}`,
//           variantIndex: i,
//           isCase: false,
//         });
//       }
//       for (let i = 0; i < CASE_VARIANTS.length; i++) {
//         allProductMeta.push({
//           title: `16 oz ${flavor}${CASE_VARIANTS[i]!.suffix}`,
//           variantIndex: i,
//           isCase: true,
//         });
//       }
//     }

//     // 2. Insert only the products not already in DB
//     const toInsert = allProductMeta.filter(
//       (p) => !EXISTING_TITLES.has(p.title),
//     );

//     const timestamp = now();
//     if (toInsert.length > 0) {
//       await db.insert(product).values(
//         toInsert.map((p) => ({
//           title: p.title,
//           sourceId: uid(),
//           image: "",
//           images: null,
//           length: null,
//           height: null,
//           width: null,
//           weight: null,
//           unitsPerCase: p.isCase ? 1 : 12,
//           createdAt: timestamp,
//           updatedAt: timestamp,
//         })) as (typeof product.$inferInsert)[],
//       );
//     }

//     // 3. Fetch all 32 products from DB to get their IDs
//     const allTitles = allProductMeta.map((p) => p.title);
//     const insertedProducts = await db
//       .select()
//       .from(product)
//       .where(inArray(product.title, allTitles));

//     const titleMetaMap = new Map(allProductMeta.map((p) => [p.title, p]));

//     // 4. Build pricing tiers for every product
//     const tierRows: (typeof pricingTiers.$inferInsert)[] = [];

//     for (const p of insertedProducts) {
//       const meta = titleMetaMap.get(p.title);
//       if (!meta) continue;

//       const [wholesalePrice, distributorPrice] = PRICING_MAP[meta.variantIndex];
//       const multiplier = meta.isCase ? 12 : 1;

//       const wPrice = (wholesalePrice * multiplier).toFixed(2); // retail & wholesale
//       const dPrice = (distributorPrice * multiplier).toFixed(2); // distributor

//       // Retail — GHS
//       tierRows.push({
//         productId: p.id,
//         pricingGroupId: RETAIL_GROUP_ID,
//         currencyId: GHS_ID,
//         minCases: 0,
//         maxCases: 9999,
//         amount: wPrice,
//         discount: null,
//       } as typeof pricingTiers.$inferInsert);

//       // Retail — USD
//       tierRows.push({
//         productId: p.id,
//         pricingGroupId: RETAIL_GROUP_ID,
//         currencyId: USD_ID,
//         minCases: 0,
//         maxCases: 9999,
//         amount: wPrice,
//         discount: null,
//       } as typeof pricingTiers.$inferInsert);

//       // Wholesale — GHS only
//       tierRows.push({
//         productId: p.id,
//         pricingGroupId: WHOLESALE_GROUP_ID,
//         currencyId: GHS_ID,
//         minCases: 4,
//         maxCases: 9999,
//         amount: wPrice,
//         discount: null,
//       } as typeof pricingTiers.$inferInsert);

//       // Distributor — GHS only
//       tierRows.push({
//         productId: p.id,
//         pricingGroupId: DISTRIBUTOR_GROUP_ID,
//         currencyId: GHS_ID,
//         minCases: 100,
//         maxCases: 9999,
//         amount: dPrice,
//         discount: null,
//       } as typeof pricingTiers.$inferInsert);
//     }

//     // 5. Insert all pricing tiers
//     if (tierRows.length > 0) {
//       await db.insert(pricingTiers).values(tierRows);
//     }

//     return res.status(201).json({
//       message: "Bulk insert complete",
//       productsInserted: toInsert.length,
//       tiersInserted: tierRows.length,
//       // 32 products × 4 tiers (retail GHS, retail USD, wholesale GHS, distributor GHS)
//       expectedTiers: insertedProducts.length * 4,
//     });
//   } catch (error) {
//     console.error("bulkInsertProductsAndPricing error:", error);
//     return res.status(500).json({ message: "Bulk insert failed", error });
//   }
// };

// // ── product IDs to seed ────────────────────────────────────────────────────────
// const PRODUCT_IDS = [
//   1, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
//   25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
// ];

// // ── controller ────────────────────────────────────────────────────────────────
// export const bulkInsertCountryProductSettings = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     // 1. Fetch all countries
//     const allCountries = await db.select().from(countries);

//     if (allCountries.length === 0) {
//       return res.status(404).json({ message: "No countries found in DB" });
//     }

//     // 2. Build a row per country per product
//     const rows: (typeof countryProductSettings.$inferInsert)[] = [];

//     for (const country of allCountries) {
//       for (const productId of PRODUCT_IDS) {
//         rows.push({
//           countryId: country.id,
//           productId,
//           outOfStock: false, // true = in stock
//           visible: true, // visible in all countries
//         } as typeof countryProductSettings.$inferInsert);
//       }
//     }

//     // 3. Insert in batches of 500 to avoid packet size issues
//     const BATCH_SIZE = 500;
//     let inserted = 0;

//     for (let i = 0; i < rows.length; i += BATCH_SIZE) {
//       const batch = rows.slice(i, i + BATCH_SIZE);
//       await db.insert(countryProductSettings).values(batch);
//       inserted += batch.length;
//     }

//     return res.status(201).json({
//       message: "Country product settings seeded",
//       countriesFound: allCountries.length,
//       productsSeeded: PRODUCT_IDS.length,
//       rowsInserted: inserted,
//       // e.g. 195 countries × 34 products = 6,630 rows
//       expectedRows: allCountries.length * PRODUCT_IDS.length,
//     });
//   } catch (error) {
//     console.error("bulkInsertCountryProductSettings error:", error);
//     return res.status(500).json({ message: "Seeding failed", error });
//   }
// };
