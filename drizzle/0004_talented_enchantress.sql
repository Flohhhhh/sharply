CREATE TABLE "sharply_camera_specs" (
	"gear_id" varchar(36) PRIMARY KEY NOT NULL,
	"sensor_format_id" varchar(36),
	"resolution_mp" numeric(6, 2),
	"iso_min" integer,
	"iso_max" integer,
	"extra" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharply_lens_specs" (
	"gear_id" varchar(36) PRIMARY KEY NOT NULL,
	"focal_length_min_mm" numeric(6, 2),
	"focal_length_max_mm" numeric(6, 2),
	"has_stabilization" boolean,
	"extra" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sharply_brands" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "sharply_gear" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "sharply_gear" ALTER COLUMN "brand_id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "sharply_gear" ALTER COLUMN "mount_id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "sharply_mounts" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "sharply_mounts" ALTER COLUMN "brand_id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "sharply_sensor_formats" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "sharply_camera_specs" ADD CONSTRAINT "sharply_camera_specs_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_camera_specs" ADD CONSTRAINT "sharply_camera_specs_sensor_format_id_sharply_sensor_formats_id_fk" FOREIGN KEY ("sensor_format_id") REFERENCES "public"."sharply_sensor_formats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_lens_specs" ADD CONSTRAINT "sharply_lens_specs_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "camera_specs_sensor_idx" ON "sharply_camera_specs" USING btree ("sensor_format_id");--> statement-breakpoint
CREATE INDEX "lens_specs_focal_idx" ON "sharply_lens_specs" USING btree ("focal_length_min_mm","focal_length_max_mm");