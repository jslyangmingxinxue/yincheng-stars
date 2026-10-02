CREATE TABLE `upload_parts` (
	`id` text PRIMARY KEY NOT NULL,
	`session` text NOT NULL,
	`number` integer NOT NULL,
	`size` integer NOT NULL,
	`etag` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_upload_parts_session` ON `upload_parts` (`session`);--> statement-breakpoint
CREATE TABLE `upload_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`post` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`fingerprint` text NOT NULL,
	`storage_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created` text NOT NULL,
	`expires` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_upload_sessions_owner_post` ON `upload_sessions` (`owner`,`post`);