ALTER TABLE "sharply_gear" RENAME COLUMN "price_usd_cents" TO "msrp_usd_cents";--> statement-breakpoint
ALTER TABLE "sharply_camera_specs" ADD COLUMN "max_fps_raw" integer;--> statement-breakpoint
ALTER TABLE "sharply_camera_specs" ADD COLUMN "max_fps_jpg" integer;--> statement-breakpoint
ALTER TABLE "sharply_gear" ADD COLUMN "sensor_format_id" varchar(36);--> statement-breakpoint
ALTER TABLE "sharply_gear" ADD CONSTRAINT "sharply_gear_sensor_format_id_sharply_sensor_formats_id_fk" FOREIGN KEY ("sensor_format_id") REFERENCES "public"."sharply_sensor_formats"("id") ON DELETE set null ON UPDATE no action;