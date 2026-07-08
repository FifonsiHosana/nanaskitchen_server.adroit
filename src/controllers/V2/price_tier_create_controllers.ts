import { Request, Response } from "express";
import { ValidationError } from "../../services/V2/flavor_service";
import { addPriceTier } from "../../services/V2/price_tier_service";

export const postPriceTier = async (req: Request, res: Response) => {
  try {
    const tier = await addPriceTier(req.body);
    res.status(201).json({ tier });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("postPriceTier error:", error);
    res.status(500).json({ message: "Failed to add price tier" });
  }
};
