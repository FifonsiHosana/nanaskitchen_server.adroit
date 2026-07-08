import { Request, Response } from "express";
import { ValidationError } from "../../services/V2/flavor_service";
import { createVariant, listVariants } from "../../services/V2/variant_service";

export const getVariants = async (req: Request, res: Response) => {
  try {
    const variants = await listVariants();
    res.status(200).json({ variants });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch variants" });
  }
};

export const postVariant = async (req: Request, res: Response) => {
  try {
    const variant = await createVariant(req.body);
    res.status(201).json({ variant });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create variant" });
  }
};
