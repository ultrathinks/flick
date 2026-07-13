ALTER TABLE "refunds" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "refunds" CASCADE;--> statement-breakpoint
DROP INDEX "transactions_refunded_transaction_idx";--> statement-breakpoint
DROP INDEX "transactions_one_grant_per_user_idx";--> statement-breakpoint
DROP INDEX "transactions_one_purchase_per_order_idx";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "refunded_at";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "refunded_transaction_id";--> statement-breakpoint
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'canceled', 'expired');--> statement-breakpoint
ALTER TABLE "public"."orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "public"."orders" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "public"."transactions" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."transaction_type";--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('grant', 'charge', 'purchase', 'adjustment');--> statement-breakpoint
ALTER TABLE "public"."transactions" ALTER COLUMN "type" SET DATA TYPE "public"."transaction_type" USING "type"::"public"."transaction_type";--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_one_grant_per_user_idx" ON "transactions" USING btree ("user_id") WHERE "transactions"."type" = 'grant';--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_one_purchase_per_order_idx" ON "transactions" USING btree ("order_id") WHERE "transactions"."type" = 'purchase';
