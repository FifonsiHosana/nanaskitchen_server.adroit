const { eq } = require("drizzle-orm");
import { Request, Response } from "express";
import { db } from "../../models/db_connection";
import { countries, currency } from "../../../db";

export const getAllCurrencies = async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(currency);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("getAllCurrencies error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch currencies" });
  }
};

export const createCurrency = async (req: Request, res: Response) => {
  const { currencyLabel, currencyCode } = req.body;

  if (!currencyLabel || !currencyCode) {
    return res.status(400).json({
      success: false,
      message: "currencyLabel and currencyCode are required",
    });
  }

  try {
    const [result] = await db.insert(currency).values({
      currencyLabel: currencyLabel.trim(),
      currencyCode: currencyCode.trim().toUpperCase(),
    });

    const [created] = await db
      .select()
      .from(currency)
      .where(eq(currency.id, result.insertId));
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A currency with that label or code already exists",
      });
    }
    console.error("createCurrency error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create currency" });
  }
};

export const updateCurrency = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { currencyLabel, currencyCode } = req.body;

  if (!currencyLabel || !currencyCode) {
    return res.status(400).json({
      success: false,
      message: "currencyLabel and currencyCode are required",
    });
  }

  try {
    await db
      .update(currency)
      .set({
        currencyLabel: currencyLabel.trim(),
        currencyCode: currencyCode.trim().toUpperCase(),
      })
      .where(eq(currency.id, Number(id)));

    const [updated] = await db
      .select()
      .from(currency)
      .where(eq(currency.id, Number(id)));
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Currency not found" });

    res.json({ success: true, data: updated });
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A currency with that label or code already exists",
      });
    }
    console.error("updateCurrency error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update currency" });
  }
};

export const deleteCurrency = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [existing] = await db
      .select()
      .from(currency)
      .where(eq(currency.id, Number(id)));
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Currency not found" });

    await db.delete(currency).where(eq(currency.id, Number(id)));
    res.json({ success: true, message: "Currency deleted" });
  } catch (error) {
    console.error("deleteCurrency error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete currency" });
  }
};

// ─── COUNTRIES ───────────────────────────────────────────────────────────────

export const getAllCountries = async (req: Request, res: Response) => {
  try {
    const result = await db
      .select({
        id: countries.id,
        countryLabel: countries.countryLabel,
        countryCode: countries.countryCode,
        currencyId: countries.currencyId,
        currencyLabel: currency.currencyLabel,
        currencyCode: currency.currencyCode,
      })
      .from(countries)
      .leftJoin(currency, eq(countries.currencyId, currency.id));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("getAllCountries error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch countries" });
  }
};

export const createCountry = async (req: Request, res: Response) => {
  const { countryLabel, countryCode, currencyId } = req.body;

  if (!countryLabel || !countryCode || !currencyId) {
    return res.status(400).json({
      success: false,
      message: "countryLabel, countryCode, and currencyId are required",
    });
  }

  try {
    const [result] = await db.insert(countries).values({
      countryLabel: countryLabel.trim(),
      countryCode: countryCode.trim().toUpperCase(),
      currencyId: parseInt(currencyId),
    });

    const [created] = await db
      .select({
        id: countries.id,
        countryLabel: countries.countryLabel,
        countryCode: countries.countryCode,
        currencyId: countries.currencyId,
        currencyLabel: currency.currencyLabel,
        currencyCode: currency.currencyCode,
      })
      .from(countries)
      .leftJoin(currency, eq(countries.currencyId, currency.id))
      .where(eq(countries.id, result.insertId));

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A country with that label or code already exists",
      });
    }
    console.error("createCountry error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create country" });
  }
};

export const updateCountry = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { countryLabel, countryCode, currencyId } = req.body;

  if (!countryLabel || !countryCode || !currencyId) {
    return res.status(400).json({
      success: false,
      message: "countryLabel, countryCode, and currencyId are required",
    });
  }

  try {
    await db
      .update(countries)
      .set({
        countryLabel: countryLabel.trim(),
        countryCode: countryCode.trim().toUpperCase(),
        currencyId: parseInt(currencyId),
      })
      .where(eq(countries.id, Number(id)));

    const [updated] = await db
      .select({
        id: countries.id,
        countryLabel: countries.countryLabel,
        countryCode: countries.countryCode,
        currencyId: countries.currencyId,
        currencyLabel: currency.currencyLabel,
        currencyCode: currency.currencyCode,
      })
      .from(countries)
      .leftJoin(currency, eq(countries.currencyId, currency.id))
      .where(eq(countries.id, Number(id)));

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Country not found" });
    res.json({ success: true, data: updated });
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A country with that label or code already exists",
      });
    }
    console.error("updateCountry error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update country" });
  }
};

export const deleteCountry = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [existing] = await db
      .select()
      .from(countries)
      .where(eq(countries.id, Number(id)));
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Country not found" });

    await db.delete(countries).where(eq(countries.id, Number(id)));
    res.json({ success: true, message: "Country deleted" });
  } catch (error) {
    console.error("deleteCountry error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete country" });
  }
};
