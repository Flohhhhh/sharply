ALTER TABLE "app"."lens_specs" ADD COLUMN "is_tilt_shift" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "tilt_degrees" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "shift_mm" numeric(5, 1);