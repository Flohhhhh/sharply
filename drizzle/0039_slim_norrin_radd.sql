CREATE TABLE "app"."camera_video_modes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"resolution_key" varchar(64) NOT NULL,
	"resolution_label" varchar(120) NOT NULL,
	"resolution_horizontal" integer,
	"resolution_vertical" integer,
	"fps" integer NOT NULL,
	"codec_label" varchar(120) NOT NULL,
	"bit_depth" integer NOT NULL,
	"crop_factor" numeric(4, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."camera_video_modes" ADD CONSTRAINT "camera_video_modes_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "camera_video_modes_gear_idx" ON "app"."camera_video_modes" USING btree ("gear_id");