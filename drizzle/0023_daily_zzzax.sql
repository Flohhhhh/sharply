ALTER TABLE "app"."brands" ADD COLUMN "sort_order" integer;--> statement-breakpoint
ALTER TABLE "app"."ownerships" ADD COLUMN "colorway_id" varchar(36);--> statement-breakpoint
ALTER TABLE "app"."ownerships" ADD CONSTRAINT "ownerships_colorway_id_gear_colorways_id_fk" FOREIGN KEY ("colorway_id") REFERENCES "app"."gear_colorways"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ownership_colorway_idx" ON "app"."ownerships" USING btree ("colorway_id");