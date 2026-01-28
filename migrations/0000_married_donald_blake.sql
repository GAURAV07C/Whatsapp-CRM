CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT ('agent'),
	`is_online` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`remote_jid` text NOT NULL,
	`customer_name` text,
	`status` text DEFAULT ('open'),
	`assigned_agent_id` int,
	`unread_count` int DEFAULT 0,
	`last_message_at` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chat_id` int NOT NULL,
	`tenant_id` int NOT NULL,
	`content` text NOT NULL,
	`type` text DEFAULT ('text'),
	`from_me` boolean DEFAULT false,
	`sender_name` text,
	`timestamp` timestamp DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`data` json NOT NULL,
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`public_key` text NOT NULL,
	`config` json NOT NULL DEFAULT ('{"themeColor":"#25D366","greetingMessage":"Hello! How can we help you?","agentName":"Support Agent"}'),
	`allowed_domains` json DEFAULT ('[]'),
	`whatsapp_status` text DEFAULT ('disconnected'),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_public_key_unique` UNIQUE(`public_key`)
);
--> statement-breakpoint
ALTER TABLE `agents` ADD CONSTRAINT `agents_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chats` ADD CONSTRAINT `chats_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chats` ADD CONSTRAINT `chats_assigned_agent_id_agents_id_fk` FOREIGN KEY (`assigned_agent_id`) REFERENCES `agents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_chat_id_chats_id_fk` FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;