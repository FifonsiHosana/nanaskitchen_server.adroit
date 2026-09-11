CREATE TABLE `Admin` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(191),
	`email` varchar(191) NOT NULL,
	`password` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL,
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `Admin_id` PRIMARY KEY(`id`),
	CONSTRAINT `Admin_email_key` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `OrderCartItem` DROP FOREIGN KEY `OrderCartItem_orderId_fkey`;
--> statement-breakpoint
ALTER TABLE `OrderUserDetail` DROP FOREIGN KEY `OrderUserDetail_orderId_fkey`;
--> statement-breakpoint
ALTER TABLE `Review` DROP FOREIGN KEY `Review_productId_fkey`;
--> statement-breakpoint
ALTER TABLE `Order` MODIFY COLUMN `deletedMode` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `OrderCartItem` ADD CONSTRAINT `OrderCartItem_orderId_Order_id_fk` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `OrderUserDetail` ADD CONSTRAINT `OrderUserDetail_orderId_Order_id_fk` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `Review` ADD CONSTRAINT `Review_productId_Product_id_fk` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE set null ON UPDATE cascade;