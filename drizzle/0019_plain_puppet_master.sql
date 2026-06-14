ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_REAR_VIEW_UPLOAD' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_REAR_VIEW_REPLACE' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_REAR_VIEW_REMOVE' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "rear_view_url" text;