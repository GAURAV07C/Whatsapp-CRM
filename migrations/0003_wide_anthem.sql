ALTER TABLE `chats` DROP FOREIGN KEY `chats_assigned_agent_id_agents_id_fk`;
--> statement-breakpoint
ALTER TABLE `chats` MODIFY COLUMN `assigned_agent_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `chats` ADD CONSTRAINT `uniq_agent_customer` UNIQUE(`tenant_id`,`assigned_agent_id`,`remote_jid`);--> statement-breakpoint
ALTER TABLE `chats` ADD CONSTRAINT `chats_assigned_agent_id_tenant_id_agents_id_tenant_id_fk` FOREIGN KEY (`assigned_agent_id`,`tenant_id`) REFERENCES `agents`(`id`,`tenant_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_agent_chat_list` ON `chats` (`assigned_agent_id`,`last_message_at`);