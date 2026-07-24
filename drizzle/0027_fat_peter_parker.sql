ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_LEFT_VIEW_UPLOAD' BEFORE 'GEAR_COLORWAY_CREATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_LEFT_VIEW_REPLACE' BEFORE 'GEAR_COLORWAY_CREATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_LEFT_VIEW_REMOVE' BEFORE 'GEAR_COLORWAY_CREATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_RIGHT_VIEW_UPLOAD' BEFORE 'GEAR_COLORWAY_CREATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_RIGHT_VIEW_REPLACE' BEFORE 'GEAR_COLORWAY_CREATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_RIGHT_VIEW_REMOVE' BEFORE 'GEAR_COLORWAY_CREATE';--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "left_view_url" text;--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "right_view_url" text;--> statement-breakpoint
ALTER TABLE "app"."gear_colorways" ADD COLUMN "left_view_url" text;--> statement-breakpoint
ALTER TABLE "app"."gear_colorways" ADD COLUMN "right_view_url" text;