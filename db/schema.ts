import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, unique, int, varchar, datetime, foreignKey, json, index, decimal, mysqlEnum, text, timestamp, boolean } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const admin = mysqlTable("Admin", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 191 }),
	email: varchar({ length: 191 }).notNull(),
	password: varchar({ length: 191 }).notNull(),
	createdAt: datetime({ mode: 'string', fsp: 3 }).notNull(),
	updatedAt: datetime({ mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "Admin_id"}),
	unique("Admin_email_key").on(table.email),
]);

export const attributionAndPreferences = mysqlTable("AttributionAndPreferences", {
	id: int().autoincrement().notNull(),
	orderId: int().notNull().references(() => order.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	attributionAnswer: json("attribution_answer"),
	preferenceAnswer: json("preference_answer"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "AttributionAndPreferences_id"}),
]);

export const authTokens = mysqlTable("AuthTokens", {
	id: int().autoincrement().notNull(),
	userId: int().references(() => user.id, { onDelete: "set null", onUpdate: "cascade" } ),
	token: varchar({ length: 200 }).notNull(),
	expiresAt: datetime({ mode: 'string', fsp: 3 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "AuthTokens_id"}),
	unique("token").on(table.token),
]);

export const countries = mysqlTable("Countries", {
	id: int().autoincrement().notNull(),
	countryLabel: varchar("country_label", { length: 191 }).notNull(),
	countryCode: varchar("country_code", { length: 191 }).notNull(),
	currencyId: int("currency_id").references(() => currency.id, { onDelete: "set null", onUpdate: "cascade" } ),
},
(table) => [
	primaryKey({ columns: [table.id], name: "Countries_id"}),
	unique("Countries_country_code_unique").on(table.countryCode),
	unique("Countries_country_label_unique").on(table.countryLabel),
]);

export const countryProductSettings = mysqlTable("CountryProductSettings", {
	id: int().autoincrement().notNull(),
	countryId: int().references(() => countries.id, { onDelete: "set null", onUpdate: "cascade" } ),
	productId: int().references(() => product.id, { onDelete: "set null", onUpdate: "cascade" } ),
	outOfStock: boolean().default(false).notNull(),
	visible: boolean().default(false).notNull(),
},
(table) => [
	index("countryId_idx").on(table.countryId),
	index("productId_idx").on(table.productId),
	primaryKey({ columns: [table.id], name: "CountryProductSettings_id"}),
]);

export const currency = mysqlTable("Currency", {
	id: int().autoincrement().notNull(),
	currencyLabel: varchar("currency_label", { length: 191 }).notNull(),
	currencyCode: varchar("currency_code", { length: 191 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "Currency_id"}),
	unique("Currency_currency_code_unique").on(table.currencyCode),
	unique("Currency_currency_label_unique").on(table.currencyLabel),
]);

export const deliveryLocation = mysqlTable("DeliveryLocation", {
	id: int().autoincrement().notNull(),
	location: varchar({ length: 191 }).notNull(),
	price: int(),
	isFreeDelivery: boolean().default(false).notNull(),
	discountPercentage: decimal({ precision: 5, scale: 2 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "DeliveryLocation_id"}),
	unique("delivery_location_name").on(table.location),
]);

export const feedBackAnswers = mysqlTable("FeedBackAnswers", {
	id: int().autoincrement().notNull(),
	questionId: int().references(() => feedBackQuestions.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	referenceId: varchar({ length: 191 }),
	answer: varchar({ length: 191 }).notNull(),
	createdAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(now())`).notNull(),
	updatedAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "FeedBackAnswers_id"}),
	unique("FeedBackAnswers_referenceId_questionId_unique").on(table.referenceId, table.questionId),
]);

export const feedBackQuestions = mysqlTable("FeedBackQuestions", {
	id: int().autoincrement().notNull(),
	question: varchar({ length: 191 }).notNull(),
	questionType: mysqlEnum("question_type", ['rating','comment','yes_no']).notNull(),
	isActive: boolean().default(false).notNull(),
	createdAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(now())`).notNull(),
	updatedAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "FeedBackQuestions_id"}),
	unique("question").on(table.question),
]);

export const flavors = mysqlTable("Flavors", {
	id: int().autoincrement().notNull(),
	label: varchar({ length: 191 }),
	image: text().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "Flavors_id"}),
]);

export const openCloseOrders = mysqlTable("OpenCloseOrders", {
	id: int().autoincrement().notNull(),
	event: varchar({ length: 191 }),
	description: text().notNull(),
	dateTimeStart: timestamp("date_time_start", { mode: 'string' }),
	dateTimeEnd: timestamp("date_time_end", { mode: 'string' }),
	active: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "OpenCloseOrders_id"}),
	unique("event").on(table.event),
]);

export const order = mysqlTable("Order", {
	id: int().autoincrement().notNull(),
	sourceId: varchar({ length: 191 }).notNull(),
	totalAmount: decimal({ precision: 12, scale: 2 }).notNull(),
	status: varchar({ length: 191 }).notNull(),
	deletedMode: boolean().default(false).notNull(),
	currency: varchar({ length: 191 }),
	paymentMethod: varchar({ length: 191 }),
	labelUrl: text(),
	trackingNumber: varchar({ length: 191 }),
	ref: varchar({ length: 191 }),
	subtotal: decimal({ precision: 12, scale: 2 }),
	packagingFee: decimal({ precision: 12, scale: 2 }),
	deliveryFee: decimal({ precision: 12, scale: 2 }),
	shippingCost: decimal({ precision: 12, scale: 2 }),
	orderTotalsPrice: decimal({ precision: 12, scale: 2 }),
	version: int(),
	createdAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(now())`).notNull(),
	updatedAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(now())`).notNull(),
	userId: int().references(() => user.id, { onDelete: "set null", onUpdate: "cascade" } ),
	origin: mysqlEnum(['web','ai_agent']).default('web').notNull(),
	pricingGroupId: int().references(() => pricingGroups.id, { onDelete: "set null", onUpdate: "cascade" } ),
},
(table) => [
	primaryKey({ columns: [table.id], name: "Order_id"}),
	unique("Order_sourceId_key").on(table.sourceId),
]);

export const orderCartItem = mysqlTable("OrderCartItem", {
	id: int().autoincrement().notNull(),
	sourceId: varchar({ length: 191 }),
	orderId: int().notNull().references(() => order.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	title: varchar({ length: 191 }).notNull(),
	quantity: int().notNull(),
	price: decimal({ precision: 12, scale: 2 }).notNull(),
	totalPrice: decimal({ precision: 12, scale: 2 }),
	weight: decimal({ precision: 12, scale: 2 }),
	length: decimal({ precision: 12, scale: 2 }),
	height: decimal({ precision: 12, scale: 2 }),
	width: decimal({ precision: 12, scale: 2 }),
	hasPackaging: boolean().default(false).notNull(),
},
(table) => [
	index("OrderCartItem_orderId_idx").on(table.orderId),
	primaryKey({ columns: [table.id], name: "OrderCartItem_id"}),
]);

export const orderUserDetail = mysqlTable("OrderUserDetail", {
	id: int().autoincrement().notNull(),
	orderId: int().notNull().references(() => order.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	firstName: varchar({ length: 191 }),
	lastName: varchar({ length: 191 }),
	email: varchar({ length: 191 }),
	phone: varchar({ length: 191 }),
	country: varchar({ length: 191 }),
	zip: varchar({ length: 191 }),
	location: varchar({ length: 191 }),
	deliveryLocationId: int().references(() => deliveryLocation.id, { onDelete: "set null", onUpdate: "cascade" } ),
},
(table) => [
	index("delivery_location_idx").on(table.deliveryLocationId),
	primaryKey({ columns: [table.id], name: "OrderUserDetail_id"}),
	unique("OrderUserDetail_orderId_key").on(table.orderId),
]);

export const pricingGroups = mysqlTable("PricingGroups", {
	id: int().autoincrement().notNull(),
	groupName: varchar({ length: 191 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "PricingGroups_id"}),
]);

export const pricingTiers = mysqlTable("PricingTiers", {
	id: int().autoincrement().notNull(),
	productId: int().references(() => product.id, { onDelete: "set null", onUpdate: "cascade" } ),
	pricingGroupId: int().references(() => pricingGroups.id, { onDelete: "set null", onUpdate: "cascade" } ),
	currencyId: int().references(() => currency.id, { onDelete: "set null", onUpdate: "cascade" } ),
	minCases: int().notNull(),
	maxCases: int().notNull(),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	discount: decimal({ precision: 10, scale: 2 }),
},
(table) => [
	index("productId_idx").on(table.productId),
	primaryKey({ columns: [table.id], name: "PricingTiers_id"}),
]);

export const product = mysqlTable("Product", {
	id: int().autoincrement().notNull(),
	sourceId: varchar({ length: 191 }).notNull(),
	title: varchar({ length: 191 }).notNull(),
	image: text().notNull(),
	images: json(),
	length: decimal({ precision: 10, scale: 2 }),
	height: decimal({ precision: 10, scale: 2 }),
	width: decimal({ precision: 10, scale: 2 }),
	weight: decimal({ precision: 10, scale: 2 }),
	createdAt: datetime({ mode: 'string', fsp: 3 }).notNull(),
	updatedAt: datetime({ mode: 'string', fsp: 3 }).notNull(),
	unitsPerCase: int(),
	flavorId: int().references(() => flavors.id, { onDelete: "set null", onUpdate: "cascade" } ),
	isCase: boolean().default(false),
	variantId: int().references(() => variants.id, { onDelete: "set null", onUpdate: "cascade" } ),
},
(table) => [
	index("flavors_index").on(table.flavorId),
	primaryKey({ columns: [table.id], name: "Product_id"}),
	unique("Product_sourceId_key").on(table.sourceId),
]);

export const review = mysqlTable("Review", {
	id: int().autoincrement().notNull(),
	sourceId: varchar({ length: 191 }).notNull(),
	productSourceId: varchar({ length: 191 }),
	productId: int().references(() => product.id, { onDelete: "set null", onUpdate: "cascade" } ),
	name: varchar({ length: 191 }).notNull(),
	comment: text().notNull(),
	status: varchar({ length: 191 }).notNull(),
	rating: int().notNull(),
	version: int(),
	createdAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(now())`).notNull(),
	updatedAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(now())`).notNull(),
},
(table) => [
	index("Review_productId_idx").on(table.productId),
	primaryKey({ columns: [table.id], name: "Review_id"}),
	unique("Review_sourceId_key").on(table.sourceId),
]);

export const user = mysqlTable("User", {
	id: int().autoincrement().notNull(),
	email: varchar({ length: 191 }),
	phoneNumber: varchar({ length: 191 }),
	provider: mysqlEnum(['phone_number','gmail']),
	firstName: varchar({ length: 191 }),
	lastName: varchar({ length: 191 }),
	createdAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(now())`).notNull(),
	updatedAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(now())`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "User_id"}),
]);

export const userRoles = mysqlTable("UserRoles", {
	id: int().autoincrement().notNull(),
	userId: int().references(() => user.id, { onDelete: "set null", onUpdate: "cascade" } ),
	pricingGroupId: int().references(() => pricingGroups.id, { onDelete: "cascade", onUpdate: "cascade" } ),
},
(table) => [
	index("User_id_idx").on(table.userId),
	primaryKey({ columns: [table.id], name: "UserRoles_id"}),
]);

export const variants = mysqlTable("Variants", {
	id: int().autoincrement().notNull(),
	variantName: varchar({ length: 191 }).notNull(),
	titleTag: varchar({ length: 191 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "Variants_id"}),
]);
