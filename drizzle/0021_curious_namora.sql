CREATE TYPE "public"."gear_publication_state" AS ENUM('PUBLISHED', 'RUMORED', 'HIDDEN');--> statement-breakpoint
ALTER TABLE "app"."analog_camera_specs" ALTER COLUMN "max_continuous_fps" SET DATA TYPE numeric(4, 1);--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "publication_state" "gear_publication_state" DEFAULT 'PUBLISHED' NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "link_instruction_manual" text;