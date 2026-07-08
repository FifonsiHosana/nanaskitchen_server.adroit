import {
  deleteDeliveryLocationById,
  insertDeliveryLocation,
  selectAllDeliveryLocations,
  selectDeliveryLocationByName,
  updateDeliveryLocationById,
  type DeliveryLocationUpdate,
} from "../../db/queries/delivery_location_queries";
import { ValidationError } from "./flavor_service";

export interface DeliveryLocationInput {
  location?: string;
  price?: number;
  isFreeDelivery?: boolean;
  discountPercentage?: string | null;
}

export const listDeliveryLocations = async () => {
  return selectAllDeliveryLocations();
};

const normalize = (input: DeliveryLocationInput) => ({
  location: input.location?.trim(),
  price: input.isFreeDelivery ? 0 : input.price,
  isFreeDelivery: input.isFreeDelivery ?? false,
  discountPercentage: input.discountPercentage ?? null,
});

export const createDeliveryLocation = async (input: DeliveryLocationInput) => {
  const data = normalize(input);

  if (!data.location) {
    throw new ValidationError("location is required");
  }
  if (!data.isFreeDelivery && (data.price === undefined || data.price < 0)) {
    throw new ValidationError("price is required and must be >= 0");
  }

  const existing = await selectDeliveryLocationByName(data.location);
  if (existing) {
    throw new ValidationError("A delivery location with this name already exists");
  }

  return insertDeliveryLocation({
    location: data.location,
    price: data.price ?? 0,
    isFreeDelivery: data.isFreeDelivery,
    discountPercentage: data.discountPercentage,
  });
};

export const updateDeliveryLocation = async (
  id: number,
  input: DeliveryLocationInput,
) => {
  const data = normalize(input);
  const update: DeliveryLocationUpdate = {};

  if (data.location !== undefined) {
    if (!data.location) throw new ValidationError("location cannot be empty");
    update.location = data.location;
  }
  if (input.isFreeDelivery !== undefined) update.isFreeDelivery = data.isFreeDelivery;
  if (data.price !== undefined) update.price = data.price;
  if (input.discountPercentage !== undefined) {
    update.discountPercentage = data.discountPercentage;
  }

  if (Object.keys(update).length === 0) {
    throw new ValidationError("No fields provided to update");
  }

  return updateDeliveryLocationById(id, update);
};

export const removeDeliveryLocation = async (id: number) => {
  await deleteDeliveryLocationById(id);
};
