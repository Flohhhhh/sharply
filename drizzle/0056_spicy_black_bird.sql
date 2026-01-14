ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_TOP_VIEW_UPLOAD' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_TOP_VIEW_REPLACE' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_TOP_VIEW_REMOVE' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
DROP TABLE "app"."account" CASCADE;--> statement-breakpoint
DROP TABLE "app"."session" CASCADE;--> statement-breakpoint
DROP TABLE "app"."verification_token" CASCADE;--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "top_view_url" text;