ALTER TABLE "products" ADD COLUMN "auto_soldout" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_one_purchase_per_order_idx" ON "transactions" USING btree ("order_id") WHERE "transactions"."type" = 'purchase';--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_amount_non_negative" CHECK ("orders"."total_amount" >= 0);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_expires_after_created" CHECK ("payments"."expires_at" > "payments"."created_at");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stock_non_negative" CHECK ("products"."stock" is null or "products"."stock" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_non_negative" CHECK ("products"."price" >= 0);