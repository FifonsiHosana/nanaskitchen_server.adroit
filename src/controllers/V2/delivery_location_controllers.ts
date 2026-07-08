import { Request, Response } from "express";
import { ValidationError } from "../../services/V2/flavor_service";
import {
  createDeliveryLocation,
  listDeliveryLocations,
  removeDeliveryLocation,
  updateDeliveryLocation,
} from "../../services/V2/delivery_location_service";

export const getDeliveryLocations = async (req: Request, res: Response) => {
  try {
    const locations = await listDeliveryLocations();
    res.status(200).json({ locations });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch delivery locations" });
  }
};

export const postDeliveryLocation = async (req: Request, res: Response) => {
  try {
    const location = await createDeliveryLocation(req.body);
    res.status(201).json({ location });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create delivery location" });
  }
};

export const patchDeliveryLocation = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const location = await updateDeliveryLocation(id, req.body);
    res.status(200).json({ location });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update delivery location" });
  }
};

export const deleteDeliveryLocationHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await removeDeliveryLocation(id);
    res.status(200).json({ message: "Delivery location deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete delivery location" });
  }
};
