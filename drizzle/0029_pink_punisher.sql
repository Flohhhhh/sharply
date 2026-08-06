CREATE TABLE "app"."gear_tags" (
	"gear_id" varchar(36) NOT NULL,
	"tag_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gear_tags_gear_id_tag_id_pk" PRIMARY KEY("gear_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "app"."tags" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"description" varchar(500),
	"icon" varchar(100),
	"page_title" varchar(240),
	"page_content" text,
	"internal_notes" text,
	"unlisted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "aperture_profile_json" jsonb;--> statement-breakpoint
ALTER TABLE "app"."user" ADD COLUMN "preferred_brand_id" varchar(36);--> statement-breakpoint
ALTER TABLE "app"."user" ADD COLUMN "preferred_mount_id" varchar(36);--> statement-breakpoint
ALTER TABLE "app"."gear_tags" ADD CONSTRAINT "gear_tags_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_tags" ADD CONSTRAINT "gear_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "app"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gear_tags_tag_idx" ON "app"."gear_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "tags_name_idx" ON "app"."tags" USING btree ("name");--> statement-breakpoint
ALTER TABLE "app"."user" ADD CONSTRAINT "user_preferred_brand_id_brands_id_fk" FOREIGN KEY ("preferred_brand_id") REFERENCES "app"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user" ADD CONSTRAINT "user_preferred_mount_id_mounts_id_fk" FOREIGN KEY ("preferred_mount_id") REFERENCES "app"."mounts"("id") ON DELETE set null ON UPDATE no action;