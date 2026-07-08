//first add all locations to the database, then add all countries
//add endpoint
//get endpoint for all countries and locations
//delete endpoint for all countries and locations
//edit endpoint for locations

import { eq } from "drizzle-orm";
import { countries, currency, deliveryLocation } from "../../db";
import { db } from "../models/db_connection";
import { Request, Response } from "express";

//countries

//GET all countries
export const getAllCountries = async (req: Request, res: Response) => {
  try {
    const response = await db
      .select({
        id: countries.id,
        countryCode: countries.countryCode,
        country: countries.countryLabel,
        currency: currency.currencyCode,
      })
      .from(countries)
      .innerJoin(currency, eq(currency.id, countries.currencyId));
    return res.status(200).json({ countries: response });
  } catch (error) {
    return res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
};

//POST a new country
export const addCountry = async (req: Request, res: Response) => {
  try {
    const { country_code, country_label } = req.body;

    if (!country_code || !country_label) {
      return res.status(400).json({
        error: "400 Bad request : country_code and country_label are required",
      });
    }

    const newCountry = await db
      .insert(countries)
      .values({ countryCode: country_code, countryLabel: country_label });

    return res.status(201).json(newCountry);
  } catch (error) {
    return res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
};

//DELETE a country
export const deleteCountry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.delete(countries).where(eq(countries.id, Number(id)));
    return res.status(200).json({ message: "Country deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
};

//delivery locations

//GET all delivery locations
export const getAllDeliveryLocations = async (req: Request, res: Response) => {
  try {
    const response = await db.select().from(deliveryLocation);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
};

//POST a new delivery location
export const addDeliveryLocation = async (req: Request, res: Response) => {
  try {
    const { location, price } = req.body;
    if (!location || !price) {
      return res.status(400).json({
        error: "400 Bad request : location and price are required",
      });
    }
    const newLocation = await db.insert(deliveryLocation).values({
      location,
      price,
    });
    return res.status(201).json(newLocation);
  } catch (error) {
    return res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
};

//PUT update a delivery location
export const updateDeliveryLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { location, price } = req.body;
    if (isNaN(Number(id))) {
      return res.status(400).json({
        error: "400 Bad request : id must be a number",
      });
    }
    // if (Number(id) <= 0) {
    //   return res.status(400).json({
    //     error: "400 Bad request : id must be a positive number",
    //   });
    // }
    // if (typeof location !== "string" || location.trim() === "") {
    //   return res.status(400).json({
    //     error: "400 Bad request : location must be a non-empty string",
    //   });
    // }
    // if (typeof price !== "number" || price < 0) {
    //   return res.status(400).json({
    //     error: "400 Bad request : price must be a positive number",
    //   });
    // }
    if (!location && !price) {
      return res.status(400).json({
        error:
          "400 Bad request : at least one of location or price must be provided",
      });
    }
    const updatedLocation = await db
      .update(deliveryLocation)
      .set({ location, price })
      .where(eq(deliveryLocation.id, Number(id)));
    return res.status(200).json(updatedLocation);
  } catch (error) {
    return res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
};

//DELETE a delivery location
export const deleteDeliveryLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db
      .delete(deliveryLocation)
      .where(eq(deliveryLocation.id, Number(id)));
    return res
      .status(200)
      .json({ message: "Delivery location deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
};
