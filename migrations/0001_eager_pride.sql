ALTER TABLE `tenants` MODIFY COLUMN `public_key` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `agent_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_agent_id_agents_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE no action ON UPDATE no action;