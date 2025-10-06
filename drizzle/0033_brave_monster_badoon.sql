CREATE TYPE "public"."rear_display_types_enum" AS ENUM('none', 'fixed', 'single_axis_tilt', 'dual_axis_tilt', 'fully_articulated');--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "rear_display_type" "rear_display_types_enum";--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "rear_display_resolution_million_dots" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "rear_display_size_inches" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "viewfinder_type" "viewfinder_types_enum";--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "viewfinder_magnification" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "viewfinder_resolution_million_dots" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_top_display" boolean;