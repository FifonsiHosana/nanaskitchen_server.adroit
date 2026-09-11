CREATE TABLE `delivery_location` (
	`id` int AUTO_INCREMENT NOT NULL,
	`location` varchar(191) NOT NULL,
	`price` int,
	CONSTRAINT `delivery_location_id` PRIMARY KEY(`id`),
	CONSTRAINT `delivery_location_name` UNIQUE(`location`)
);
--> statement-breakpoint
ALTER TABLE `Order` MODIFY COLUMN `deletedMode` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `Order` MODIFY COLUMN `deletedMode` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `OrderUserDetail` ADD `deliveryLocationId` int;--> statement-breakpoint
ALTER TABLE `OrderUserDetail` ADD CONSTRAINT `OrderUserDetail_deliveryLocationId_delivery_location_id_fk` FOREIGN KEY (`deliveryLocationId`) REFERENCES `delivery_location`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `delivery_location_idx` ON `OrderUserDetail` (`deliveryLocationId`);