import {
  findExistingTier,
  insertPricingTiers,
} from "../../db/queries/price_tier_queries";
import { ValidationError } from "./flavor_service";

export interface CreateTierInput {
  productId?: number;
  pricingGroupId?: number;
  currencyId?: number;
  minCases?: number;
  maxCases?: number;
  amount?: string;
  discount?: string | null;
}

const requireField = <T>(value: T | undefined, name: string): T => {
  if (value === undefined || value === null) {
    throw new ValidationError(`${name} is required`);
  }
  return value;
};

export const addPriceTier = async (input: CreateTierInput) => {
  const productId = requireField(input.productId, "productId");
  const pricingGroupId = requireField(input.pricingGroupId, "pricingGroupId");
  const currencyId = requireField(input.currencyId, "currencyId");
  const minCases = requireField(input.minCases, "minCases");
  const maxCases = requireField(input.maxCases, "maxCases");
  const amount = requireField(input.amount, "amount");

  const existing = await findExistingTier(productId, pricingGroupId, currencyId);
  if (existing) {
    throw new ValidationError(
      "A tier for this product, pricing group and currency already exists",
    );
  }

  await insertPricingTiers([
    {
      productId,
      pricingGroupId,
      currencyId,
      minCases,
      maxCases,
      amount,
      discount: input.discount ?? null,
    },
  ]);

  return { productId, pricingGroupId, currencyId, minCases, maxCases, amount };
};
