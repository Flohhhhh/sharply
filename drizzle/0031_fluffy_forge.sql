CREATE TYPE "public"."camera_type_enum" AS ENUM('dslr', 'mirrorless', 'slr', 'action', 'cinema');--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "camera_type" "camera_type_enum";