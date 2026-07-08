import {
  insertProduct,
  selectAllCountries,
  selectAllCurrencies,
  selectAllPricingGroups,
  selectProductById,
  insertCountryProductSettings,
  type NewProductInput,
} from "../../db/queries/product_catalog_queries";
import { insertPricingTiers } from "../../db/queries/price_tier_queries";
import { ValidationError } from "./flavor_service";

const RETAILER_SLUG = "retailer";

export interface CreateProductInput {
  title?: string;
  flavorId?: number;
  variantId?: number;
  isCase?: boolean;
  unitsPerCase?: number;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  image?: string;
  images?: string[];
}

const requireField = <T>(value: T | undefined, name: string): T => {
  if (value === undefined || value === null || (value as unknown) === "") {
    throw new ValidationError(`${name} is required`);
  }
  return value;
};

export const createProductWithTiers = async (input: CreateProductInput) => {
  const title = requireField(input.title, "title");
  const flavorId = requireField(input.flavorId, "flavorId");
  const variantId = requireField(input.variantId, "variantId");

  const productData: NewProductInput = {
    title,
    flavorId,
    variantId,
    isCase: input.isCase ?? false,
    unitsPerCase: input.unitsPerCase ?? 0,
    length: String(input.length ?? 0),
    width: String(input.width ?? 0),
    height: String(input.height ?? 0),
    weight: String(input.weight ?? 0),
    image: input.image ?? "",
    images: input.images ?? [],
  };

  const productId = await insertProduct(productData);

  const [groups, currencies, countries] = await Promise.all([
    selectAllPricingGroups(),
    selectAllCurrencies(),
    selectAllCountries(),
  ]);

  const tierRows = groups.flatMap((group) =>
    currencies
      .filter((c) => group.groupName === RETAILER_SLUG || c.currencyCode !== "USD")
      .map((c) => ({
        productId,
        pricingGroupId: group.id,
        currencyId: c.id,
        minCases: 0,
        maxCases: 0,
        amount: "0.00",
        discount: null,
      })),
  );

  await insertPricingTiers(tierRows);

  await insertCountryProductSettings(
    countries.map((country) => ({
      productId,
      countryId: country.id,
      outOfStock: true,
      visible: false,
    })),
  );

  const created = await selectProductById(productId);
  return created;
};
