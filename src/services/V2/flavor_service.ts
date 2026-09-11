import { insertFlavor, selectAllFlavors } from "../../db/queries/flavor_queries";

export class ValidationError extends Error {}

export const listFlavors = async () => {
  return selectAllFlavors();
};

export const createFlavor = async (input: { label?: string; image?: string }) => {
  const label = input.label?.trim();
  const image = input.image?.trim() ?? "";

  if (!label) {
    throw new ValidationError("label is required");
  }

  const id = await insertFlavor({ label, image });
  return { id, label, image };
};
