ALTER TABLE "payouts" DROP CONSTRAINT "payouts_payout_transaction_id_unique";--> statement-breakpoint
ALTER TABLE "payouts" DROP CONSTRAINT "payouts_paid_by_users_id_fk";
--> statement-breakpoint
DROP INDEX "payouts_one_requested_per_user_idx";--> statement-breakpoint
DROP INDEX "payouts_user_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "payouts_user_id_idx" ON "payouts" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "payouts" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "payouts" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "payouts" DROP COLUMN "paid_at";--> statement-breakpoint
ALTER TABLE "payouts" DROP COLUMN "paid_by";--> statement-breakpoint
ALTER TABLE "payouts" DROP COLUMN "payout_transaction_id";--> statement-breakpoint
DROP INDEX "transactions_one_grant_per_user_idx";--> statement-breakpoint
ALTER TABLE "public"."transactions" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."transaction_type";--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('grant', 'charge', 'purchase', 'refund', 'adjustment');--> statement-breakpoint
ALTER TABLE "public"."transactions" ALTER COLUMN "type" SET DATA TYPE "public"."transaction_type" USING "type"::"public"."transaction_type";--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_one_grant_per_user_idx" ON "transactions" USING btree ("user_id") WHERE "transactions"."type" = 'grant';--> statement-breakpoint
DROP TYPE "public"."payout_status";