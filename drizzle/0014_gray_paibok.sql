CREATE TYPE "public"."creator_video_platform" AS ENUM('YOUTUBE');--> statement-breakpoint
CREATE TABLE "app"."approved_creators" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(200) NOT NULL,
	"platform" "creator_video_platform" NOT NULL,
	"channel_url" text NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."gear_creator_videos" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"creator_id" varchar(36) NOT NULL,
	"source_url" text NOT NULL,
	"normalized_url" text NOT NULL,
	"embed_url" text NOT NULL,
	"platform" "creator_video_platform" NOT NULL,
	"external_video_id" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"thumbnail_url" text,
	"published_at" timestamp with time zone,
	"editor_note" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" varchar(255),
	"updated_by_user_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."gear_creator_videos" ADD CONSTRAINT "gear_creator_videos_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_creator_videos" ADD CONSTRAINT "gear_creator_videos_creator_id_approved_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "app"."approved_creators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_creator_videos" ADD CONSTRAINT "gear_creator_videos_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "app"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_creator_videos" ADD CONSTRAINT "gear_creator_videos_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "app"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approved_creators_name_idx" ON "app"."approved_creators" USING btree ("name");--> statement-breakpoint
CREATE INDEX "approved_creators_platform_active_idx" ON "app"."approved_creators" USING btree ("platform","is_active");--> statement-breakpoint
CREATE INDEX "gear_creator_videos_gear_active_idx" ON "app"."gear_creator_videos" USING btree ("gear_id","is_active");--> statement-breakpoint
CREATE INDEX "gear_creator_videos_creator_idx" ON "app"."gear_creator_videos" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "gear_creator_videos_platform_external_idx" ON "app"."gear_creator_videos" USING btree ("platform","external_video_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gear_creator_videos_gear_platform_external_uidx" ON "app"."gear_creator_videos" USING btree ("gear_id","platform","external_video_id");