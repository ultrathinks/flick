ALTER TABLE "product_option_groups" ADD COLUMN "max_select" integer;--> statement-breakpoint
UPDATE "product_option_groups" SET "max_select" = 1 WHERE "max_select" IS NULL;