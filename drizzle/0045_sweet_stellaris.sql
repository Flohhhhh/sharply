ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_IMAGE_UPLOAD' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_IMAGE_REPLACE' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_IMAGE_REMOVE' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TABLE "app"."user" ADD COLUMN "social_links" jsonb;