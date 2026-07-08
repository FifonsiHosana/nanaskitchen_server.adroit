CREATE TABLE `AttributionAndPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`attribution_answer` json,
	`preference_answer` json,
	CONSTRAINT `AttributionAndPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `open_close_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event` varchar(191),
	`description` text NOT NULL,
	`date_time_start` timestamp,
	`date_time_end` timestamp,
	`active` boolean NOT NULL DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `open_close_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `event` UNIQUE(`event`)
);
--> statement-breakpoint
ALTER TABLE `Product` ADD `out_of_stock_GH` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Product` ADD `out_of_stock_US` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Product` ADD `out_of_stock_EU` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `AttributionAndPreferences` ADD CONSTRAINT `AttributionAndPreferences_orderId_Order_id_fk` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE cascade ON UPDATE cascade;