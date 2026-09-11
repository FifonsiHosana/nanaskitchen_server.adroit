import {
  insertVariant,
  selectAllVariants,
} from "../../db/queries/variant_queries";
import { ValidationError } from "./flavor_service";

export const listVariants = async () => {
  return selectAllVariants();
};

export const createVariant = async (input: {
  variantName?: string;
  titleTag?: string;
}) => {
  const variantName = input.variantName?.trim();
  const titleTag = input.titleTag ?? "";

  if (!variantName) {
    throw new ValidationError("variantName is required");
  }

  const id = await insertVariant({ variantName, titleTag });
  return { id, variantName, titleTag };
};
