ALTER TYPE "public"."viewfinder_types_enum" ADD VALUE 'hybrid';--> statement-breakpoint
ALTER TYPE "public"."viewfinder_types_enum" ADD VALUE 'other';--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "iso_min_expanded" integer;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "iso_max_expanded" integer;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "base_iso" integer[];