DROP INDEX "booths_owner_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "booths_owner_id_idx" ON "booths" USING btree ("owner_id");