ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_DELETE' BEFORE 'GEAR_IMAGE_UPLOAD';--> statement-breakpoint
ALTER TABLE "app"."sensor_formats" ADD COLUMN "width_mm" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "app"."sensor_formats" ADD COLUMN "height_mm" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "app"."sensor_formats" ADD COLUMN "area_mm_2" numeric(8, 2);