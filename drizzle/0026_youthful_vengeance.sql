ALTER TABLE "app"."camera_specs" ADD COLUMN "has_autofocus" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_video" boolean;--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "predecessor_gear_id" varchar(36);--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "successor_gear_id" varchar(36);--> statement-breakpoint
ALTER TABLE "app"."gear" ADD CONSTRAINT "gear_predecessor_gear_id_gear_id_fk" FOREIGN KEY ("predecessor_gear_id") REFERENCES "app"."gear"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear" ADD CONSTRAINT "gear_successor_gear_id_gear_id_fk" FOREIGN KEY ("successor_gear_id") REFERENCES "app"."gear"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gear_predecessor_idx" ON "app"."gear" USING btree ("predecessor_gear_id");--> statement-breakpoint
CREATE INDEX "gear_successor_idx" ON "app"."gear" USING btree ("successor_gear_id");