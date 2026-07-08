import { Request, Response } from "express";
import { selectAllPricingGroups } from "../../db/queries/product_catalog_queries";

export const getPricingGroups = async (req: Request, res: Response) => {
  try {
    const groups = await selectAllPricingGroups();
    res.status(200).json({ groups });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pricing groups" });
  }
};
