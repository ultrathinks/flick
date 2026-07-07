ALTER TABLE "user_codes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_codes" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "code" text;--> statement-breakpoint
UPDATE "users" SET "code" = gen_random_uuid()::text WHERE "code" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_code_unique" UNIQUE("code");
