import { Request, Response } from "express";
import { ValidationError } from "../../services/V2/flavor_service";
import { createProductWithTiers } from "../../services/V2/product_catalog_service";

export const postCatalogProduct = async (req: Request, res: Response) => {
  try {
    const product = await createProductWithTiers(req.body);
    res.status(201).json({ product });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("postCatalogProduct error:", error);
    res.status(500).json({ message: "Failed to create product" });
  }
};
