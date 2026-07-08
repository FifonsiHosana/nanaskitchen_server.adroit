import { relations } from "drizzle-orm/relations";
import { order, attributionAndPreferences, user, authTokens, currency, countries, countryProductSettings, product, feedBackQuestions, feedBackAnswers, pricingGroups, orderCartItem, deliveryLocation, orderUserDetail, pricingTiers, flavors, variants, review, userRoles } from "./schema";

export const attributionAndPreferencesRelations = relations(attributionAndPreferences, ({one}) => ({
	order: one(order, {
		fields: [attributionAndPreferences.orderId],
		references: [order.id]
	}),
}));

export const orderRelations = relations(order, ({one, many}) => ({
	attributionAndPreferences: many(attributionAndPreferences),
	pricingGroup: one(pricingGroups, {
		fields: [order.pricingGroupId],
		references: [pricingGroups.id]
	}),
	user: one(user, {
		fields: [order.userId],
		references: [user.id]
	}),
	orderCartItems: many(orderCartItem),
	orderUserDetails: many(orderUserDetail),
}));

export const authTokensRelations = relations(authTokens, ({one}) => ({
	user: one(user, {
		fields: [authTokens.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	authTokens: many(authTokens),
	orders: many(order),
	userRoles: many(userRoles),
}));

export const countriesRelations = relations(countries, ({one, many}) => ({
	currency: one(currency, {
		fields: [countries.currencyId],
		references: [currency.id]
	}),
	countryProductSettings: many(countryProductSettings),
}));

export const currencyRelations = relations(currency, ({many}) => ({
	countries: many(countries),
	pricingTiers: many(pricingTiers),
}));

export const countryProductSettingsRelations = relations(countryProductSettings, ({one}) => ({
	country: one(countries, {
		fields: [countryProductSettings.countryId],
		references: [countries.id]
	}),
	product: one(product, {
		fields: [countryProductSettings.productId],
		references: [product.id]
	}),
}));

export const productRelations = relations(product, ({one, many}) => ({
	countryProductSettings: many(countryProductSettings),
	pricingTiers: many(pricingTiers),
	flavor: one(flavors, {
		fields: [product.flavorId],
		references: [flavors.id]
	}),
	variant: one(variants, {
		fields: [product.variantId],
		references: [variants.id]
	}),
	reviews: many(review),
}));

export const feedBackAnswersRelations = relations(feedBackAnswers, ({one}) => ({
	feedBackQuestion: one(feedBackQuestions, {
		fields: [feedBackAnswers.questionId],
		references: [feedBackQuestions.id]
	}),
}));

export const feedBackQuestionsRelations = relations(feedBackQuestions, ({many}) => ({
	feedBackAnswers: many(feedBackAnswers),
}));

export const pricingGroupsRelations = relations(pricingGroups, ({many}) => ({
	orders: many(order),
	pricingTiers: many(pricingTiers),
	userRoles: many(userRoles),
}));

export const orderCartItemRelations = relations(orderCartItem, ({one}) => ({
	order: one(order, {
		fields: [orderCartItem.orderId],
		references: [order.id]
	}),
}));

export const orderUserDetailRelations = relations(orderUserDetail, ({one}) => ({
	deliveryLocation: one(deliveryLocation, {
		fields: [orderUserDetail.deliveryLocationId],
		references: [deliveryLocation.id]
	}),
	order: one(order, {
		fields: [orderUserDetail.orderId],
		references: [order.id]
	}),
}));

export const deliveryLocationRelations = relations(deliveryLocation, ({many}) => ({
	orderUserDetails: many(orderUserDetail),
}));

export const pricingTiersRelations = relations(pricingTiers, ({one}) => ({
	currency: one(currency, {
		fields: [pricingTiers.currencyId],
		references: [currency.id]
	}),
	pricingGroup: one(pricingGroups, {
		fields: [pricingTiers.pricingGroupId],
		references: [pricingGroups.id]
	}),
	product: one(product, {
		fields: [pricingTiers.productId],
		references: [product.id]
	}),
}));

export const flavorsRelations = relations(flavors, ({many}) => ({
	products: many(product),
}));

export const variantsRelations = relations(variants, ({many}) => ({
	products: many(product),
}));

export const reviewRelations = relations(review, ({one}) => ({
	product: one(product, {
		fields: [review.productId],
		references: [product.id]
	}),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	pricingGroup: one(pricingGroups, {
		fields: [userRoles.pricingGroupId],
		references: [pricingGroups.id]
	}),
	user: one(user, {
		fields: [userRoles.userId],
		references: [user.id]
	}),
}));