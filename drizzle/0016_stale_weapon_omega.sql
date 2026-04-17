CREATE TYPE "public"."exif_primary_count_type_enum" AS ENUM('total', 'mechanical', 'generic');--> statement-breakpoint
CREATE TABLE "app"."exif_shutter_readings" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"tracked_camera_id" varchar(36) NOT NULL,
	"dedupe_key" text NOT NULL,
	"capture_at" timestamp with time zone,
	"primary_count_type" "exif_primary_count_type_enum" NOT NULL,
	"primary_count_value" integer NOT NULL,
	"shutter_count" integer,
	"total_shutter_count" integer,
	"mechanical_shutter_count" integer,
	"source_tag" varchar(255),
	"mechanical_source_tag" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."exif_tracked_cameras" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"gear_id" varchar(36),
	"normalized_brand" varchar(32),
	"make_raw" varchar(255),
	"model_raw" varchar(255),
	"serial_hash" text NOT NULL,
	"first_seen_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."gear_exif_aliases" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"normalized_brand" varchar(32),
	"make_raw" varchar(255),
	"model_raw" varchar(255) NOT NULL,
	"make_normalized" text,
	"model_normalized" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."exif_shutter_readings" ADD CONSTRAINT "exif_shutter_readings_tracked_camera_id_exif_tracked_cameras_id_fk" FOREIGN KEY ("tracked_camera_id") REFERENCES "app"."exif_tracked_cameras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."exif_tracked_cameras" ADD CONSTRAINT "exif_tracked_cameras_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."exif_tracked_cameras" ADD CONSTRAINT "exif_tracked_cameras_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_exif_aliases" ADD CONSTRAINT "gear_exif_aliases_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exif_shutter_readings_dedupe_uq" ON "app"."exif_shutter_readings" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "exif_shutter_readings_tracked_camera_idx" ON "app"."exif_shutter_readings" USING btree ("tracked_camera_id");--> statement-breakpoint
CREATE INDEX "exif_shutter_readings_camera_capture_idx" ON "app"."exif_shutter_readings" USING btree ("tracked_camera_id","capture_at");--> statement-breakpoint
CREATE UNIQUE INDEX "exif_tracked_cameras_user_serial_uq" ON "app"."exif_tracked_cameras" USING btree ("user_id","serial_hash");--> statement-breakpoint
CREATE INDEX "exif_tracked_cameras_gear_idx" ON "app"."exif_tracked_cameras" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "exif_tracked_cameras_user_idx" ON "app"."exif_tracked_cameras" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gear_exif_aliases_gear_idx" ON "app"."gear_exif_aliases" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_exif_aliases_make_model_idx" ON "app"."gear_exif_aliases" USING btree ("make_normalized","model_normalized");--> statement-breakpoint
CREATE UNIQUE INDEX "gear_exif_aliases_gear_make_model_uq" ON "app"."gear_exif_aliases" USING btree ("gear_id","make_normalized","model_normalized");