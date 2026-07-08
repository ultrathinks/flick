ALTER TABLE "sessions" ADD COLUMN "previous_refresh_token_hash" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "previous_refresh_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_previous_refresh_token_hash_unique" UNIQUE("previous_refresh_token_hash");