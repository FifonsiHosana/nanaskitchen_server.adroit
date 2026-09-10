import { Request, Response } from "express";
import { ValidationError } from "../../services/V2/flavor_service";
import {
  createDeliveryLocation,
  listDeliveryLocations,
  removeDeliveryLocation,
  updateDeliveryLocation,
} from "../../services/V2/delivery_location_service";
import { deliveryLocation } from "../../../db";
import { like } from "drizzle-orm";
import { totalCount } from "../../db/queries/delivery_location_queries";

export const getDeliveryLocations = async (req: Request, res: Response) => {
  const {
    // limit = "5",
    page = "1",
    pageSize = "5",
    search = "",
  } = req.query as Record<string, string>;
  const conditions = [];
  if (search) {
    conditions.push(like(deliveryLocation.location, `%${search}%`));
  }
  try {
    const [locations, total] = await Promise.all([
      listDeliveryLocations(page, pageSize, conditions),
      totalCount(conditions),
    ]);

    res.status(200).json({ locations, total });
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
