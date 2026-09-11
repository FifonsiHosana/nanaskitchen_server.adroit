import { Request, Response } from "express";
import { createFlavor, listFlavors, ValidationError } from "../../services/V2/flavor_service";

export const getFlavors = async (req: Request, res: Response) => {
  try {
    const flavors = await listFlavors();
    res.status(200).json({ flavors });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch flavors" });
  }
};

export const postFlavor = async (req: Request, res: Response) => {
  try {
    const flavor = await createFlavor(req.body);
    res.status(201).json({ flavor });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create flavor" });
  }
};
