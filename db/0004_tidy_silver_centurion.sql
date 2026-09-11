CREATE TABLE `AuthTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`token` varchar(200) NOT NULL,
	`expiresAt` datetime(3) NOT NULL,
	CONSTRAINT `AuthTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `token` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `ProductUserRolePrices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int,
	`minQuantity` int NOT NULL,
	`dollarDiscount` decimal(10,2),
	`cediDiscount` decimal(10,2),
	`euroDiscount` decimal(10,2),
	`roleId` int,
	CONSTRAINT `ProductUserRolePrices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role_name` enum('customer','wholesaler'),
	CONSTRAINT `Roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(191) NOT NULL,
	`phoneNumber` varchar(191),
	`provider` enum('phone_number','gmail'),
	`firstName` varchar(191),
	`lastName` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT (now()),
	`updatedAt` datetime(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `User_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `UserRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`roleId` int,
	CONSTRAINT `UserRoles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `Order` MODIFY COLUMN `createdAt` datetime(3) NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `Order` MODIFY COLUMN `updatedAt` datetime(3) NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `Review` MODIFY COLUMN `createdAt` datetime(3) NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `Review` MODIFY COLUMN `updatedAt` datetime(3) NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `Order` ADD `userId` int;--> statement-breakpoint
ALTER TABLE `OrderCartItem` ADD `hasPackaging` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Product` ADD `visible_GH` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Product` ADD `visible_US` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Product` ADD `visible_EU` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `AuthTokens` ADD CONSTRAINT `AuthTokens_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ProductUserRolePrices` ADD CONSTRAINT `ProductUserRolePrices_productId_Product_id_fk` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ProductUserRolePrices` ADD CONSTRAINT `ProductUserRolePrices_roleId_Roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `UserRoles` ADD CONSTRAINT `UserRoles_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `UserRoles` ADD CONSTRAINT `UserRoles_roleId_Roles_id_fk` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `User_id_idx` ON `UserRoles` (`userId`);--> statement-breakpoint
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE set null ON UPDATE cascade;