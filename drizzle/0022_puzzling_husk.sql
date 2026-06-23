ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_COLORWAY_CREATE' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_COLORWAY_UPDATE' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_COLORWAY_REORDER' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_COLORWAY_DELETE' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_COLORWAY_RESET' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_COLORWAY_IMAGE_UPLOAD' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_COLORWAY_IMAGE_REPLACE' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GEAR_COLORWAY_IMAGE_REMOVE' BEFORE 'GEAR_EDIT_PROPOSE';--> statement-breakpoint
CREATE TABLE "app"."gear_colorways" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"swatch_color_a" varchar(7) NOT NULL,
	"swatch_color_b" varchar(7) NOT NULL,
	"sort_order" integer NOT NULL,
	"front_image_url" text,
	"top_view_url" text,
	"rear_view_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."gear_colorways" ADD CONSTRAINT "gear_colorways_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gear_colorways_gear_slug_uidx" ON "app"."gear_colorways" USING btree ("gear_id","slug");--> statement-breakpoint
CREATE INDEX "gear_colorways_gear_order_idx" ON "app"."gear_colorways" USING btree ("gear_id","sort_order");--> statement-breakpoint
CREATE INDEX "gear_publication_state_idx" ON "app"."gear" USING btree ("publication_state");