-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `Order` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` varchar(191) NOT NULL,
	`totalAmount` decimal(12,2) NOT NULL,
	`status` varchar(191) NOT NULL,
	`deletedMode` tinyint(1) NOT NULL DEFAULT 0,
	`currency` varchar(191),
	`paymentMethod` varchar(191),
	`labelUrl` text,
	`trackingNumber` varchar(191),
	`ref` varchar(191),
	`subtotal` decimal(12,2),
	`packagingFee` decimal(12,2),
	`deliveryFee` decimal(12,2),
	`shippingCost` decimal(12,2),
	`orderTotalsPrice` decimal(12,2),
	`version` int,
	`createdAt` datetime(3) NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `Order_id` PRIMARY KEY(`id`),
	CONSTRAINT `Order_sourceId_key` UNIQUE(`sourceId`)
);
--> statement-breakpoint
CREATE TABLE `OrderCartItem` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` varchar(191),
	`orderId` int NOT NULL,
	`title` varchar(191) NOT NULL,
	`quantity` int NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`totalPrice` decimal(12,2),
	`weight` decimal(12,2),
	`length` decimal(12,2),
	`height` decimal(12,2),
	`width` decimal(12,2),
	CONSTRAINT `OrderCartItem_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `OrderUserDetail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`firstName` varchar(191),
	`lastName` varchar(191),
	`email` varchar(191),
	`phone` varchar(191),
	`country` varchar(191),
	`zip` varchar(191),
	`location` varchar(191),
	CONSTRAINT `OrderUserDetail_id` PRIMARY KEY(`id`),
	CONSTRAINT `OrderUserDetail_orderId_key` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `Product` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` varchar(191) NOT NULL,
	`title` varchar(191) NOT NULL,
	`dollarPrice` decimal(10,2) NOT NULL,
	`cediPrice` decimal(10,2) NOT NULL,
	`euroPrice` decimal(10,2),
	`image` text NOT NULL,
	`images` json,
	`dollarDiscount` decimal(10,2),
	`cediDiscount` decimal(10,2),
	`euroDiscount` decimal(10,2),
	`length` decimal(10,2),
	`height` decimal(10,2),
	`width` decimal(10,2),
	`weight` decimal(10,2),
	`country` varchar(191),
	`version` int,
	`createdAt` datetime(3) NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `Product_id` PRIMARY KEY(`id`),
	CONSTRAINT `Product_sourceId_key` UNIQUE(`sourceId`)
);
--> statement-breakpoint
CREATE TABLE `Review` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` varchar(191) NOT NULL,
	`productSourceId` varchar(191),
	`productId` int,
	`name` varchar(191) NOT NULL,
	`comment` text NOT NULL,
	`status` varchar(191) NOT NULL,
	`rating` int NOT NULL,
	`version` int,
	`createdAt` datetime(3) NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `Review_id` PRIMARY KEY(`id`),
	CONSTRAINT `Review_sourceId_key` UNIQUE(`sourceId`)
);
--> statement-breakpoint
ALTER TABLE `OrderCartItem` ADD CONSTRAINT `OrderCartItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `OrderUserDetail` ADD CONSTRAINT `OrderUserDetail_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `Review` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `OrderCartItem_orderId_idx` ON `OrderCartItem` (`orderId`);--> statement-breakpoint
CREATE INDEX `Review_productId_idx` ON `Review` (`productId`);
*/