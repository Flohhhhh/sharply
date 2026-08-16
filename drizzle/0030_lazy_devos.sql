ALTER TABLE "app"."analog_camera_specs" ADD COLUMN "viewfinder_eye_point_mm" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "viewfinder_eye_point_mm" numeric(5, 2);