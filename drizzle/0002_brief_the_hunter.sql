ALTER TABLE "brands" RENAME TO "sharply_brands";--> statement-breakpoint
ALTER TABLE "gear" RENAME TO "sharply_gear";--> statement-breakpoint
ALTER TABLE "mounts" RENAME TO "sharply_mounts";--> statement-breakpoint
ALTER TABLE "sensor_formats" RENAME TO "sharply_sensor_formats";--> statement-breakpoint
ALTER TABLE "sharply_brands" DROP CONSTRAINT "brands_name_unique";--> statement-breakpoint
ALTER TABLE "sharply_brands" DROP CONSTRAINT "brands_slug_unique";--> statement-breakpoint
ALTER TABLE "sharply_gear" DROP CONSTRAINT "gear_slug_unique";--> statement-breakpoint
ALTER TABLE "sharply_mounts" DROP CONSTRAINT "mounts_name_unique";--> statement-breakpoint
ALTER TABLE "sharply_mounts" DROP CONSTRAINT "mounts_slug_unique";--> statement-breakpoint
ALTER TABLE "sharply_sensor_formats" DROP CONSTRAINT "sensor_formats_name_unique";--> statement-breakpoint
ALTER TABLE "sharply_sensor_formats" DROP CONSTRAINT "sensor_formats_slug_unique";--> statement-breakpoint
ALTER TABLE "sharply_gear" DROP CONSTRAINT "gear_brand_id_brands_id_fk";
--> statement-breakpoint
ALTER TABLE "sharply_gear" DROP CONSTRAINT "gear_mount_id_mounts_id_fk";
--> statement-breakpoint
ALTER TABLE "sharply_gear" ADD CONSTRAINT "sharply_gear_brand_id_sharply_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."sharply_brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_gear" ADD CONSTRAINT "sharply_gear_mount_id_sharply_mounts_id_fk" FOREIGN KEY ("mount_id") REFERENCES "public"."sharply_mounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_brands" ADD CONSTRAINT "sharply_brands_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "sharply_brands" ADD CONSTRAINT "sharply_brands_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "sharply_gear" ADD CONSTRAINT "sharply_gear_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "sharply_mounts" ADD CONSTRAINT "sharply_mounts_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "sharply_mounts" ADD CONSTRAINT "sharply_mounts_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "sharply_sensor_formats" ADD CONSTRAINT "sharply_sensor_formats_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "sharply_sensor_formats" ADD CONSTRAINT "sharply_sensor_formats_slug_unique" UNIQUE("slug");