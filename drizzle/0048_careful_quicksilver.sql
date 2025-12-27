CREATE TYPE "public"."analog_medium_enum" AS ENUM('35mm', 'half-frame', 'panoramic-35mm', 'aps', '110', '126-instamatic', '828', '120', '220', '127', '620', 'large-format-4x5', 'large-format-5x7', 'large-format-8x10', 'ultra-large-format', 'sheet-film', 'metal-plate', 'glass-plate', 'experimental-other');--> statement-breakpoint
CREATE TYPE "public"."analog_types_enum" AS ENUM('single-lens-reflex-slr', 'rangefinder', 'twin-lens-reflex-tlr', 'point-and-shoot', 'large-format', 'instant-film', 'disposable', 'toy', 'stereo', 'panoramic', 'folding', 'box', 'pinhole', 'press');--> statement-breakpoint
CREATE TYPE "public"."analog_viewfinder_types_enum" AS ENUM('none', 'pentaprism', 'pentamirror', 'waist-level', 'sports-finder', 'rangefinder-style', 'ground-glass', 'other');--> statement-breakpoint
CREATE TYPE "public"."metering_mode_enum" AS ENUM('average', 'center-weighted', 'spot', 'other');--> statement-breakpoint
CREATE TYPE "public"."exposure_modes_enum" AS ENUM('manual', 'aperture-priority', 'shutter-priority', 'program', 'auto', 'other');--> statement-breakpoint
CREATE TYPE "public"."film_transport_enum" AS ENUM('not-applicable', 'manual-lever', 'manual-knob', 'manual-other', 'motorized', 'other');--> statement-breakpoint
CREATE TYPE "public"."focus_aid_enum" AS ENUM('none', 'split-prism', 'microprism', 'electronic-confirm', 'electronic-directional', 'af-point');--> statement-breakpoint
CREATE TYPE "public"."iso_setting_method_enum" AS ENUM('manual', 'dx-only', 'dx-with-override', 'fixed', 'other');--> statement-breakpoint
CREATE TYPE "public"."lens_zoom_types_enum" AS ENUM('two-ring', 'push-pull', 'power-zoom', 'zoom-by-wire', 'collar-zoom', 'other');--> statement-breakpoint
CREATE TYPE "public"."metering_display_type_enum" AS ENUM('needle-middle', 'needle-match', 'led-indicators', 'led-scale', 'lcd-viewfinder', 'lcd-top-panel', 'none', 'other');--> statement-breakpoint
CREATE TYPE "public"."shutter_type_enum" AS ENUM('focal-plane-cloth', 'focal-plane-metal', 'focal-plane-electronic', 'leaf', 'rotary', 'none', 'other');--> statement-breakpoint
ALTER TYPE "public"."gear_type" ADD VALUE 'ANALOG_CAMERA' BEFORE 'LENS';--> statement-breakpoint
CREATE TABLE "app"."analog_camera_specs" (
	"gear_id" varchar(36) PRIMARY KEY NOT NULL,
	"camera_type" "analog_types_enum",
	"capture_medium" "analog_medium_enum",
	"film_transport_type" "film_transport_enum",
	"has_auto_film_advance" boolean,
	"has_optional_motorized_drive" boolean,
	"viewfinder_type" "analog_viewfinder_types_enum",
	"shutter_type" "shutter_type_enum",
	"shutter_speed_max" integer,
	"shutter_speed_min" integer,
	"flash_sync_speed" integer,
	"has_bulb_mode" boolean,
	"has_metering" boolean,
	"metering_modes" "metering_mode_enum"[],
	"exposure_modes" "metering_mode_enum"[],
	"metering_display_types" "metering_display_type_enum"[],
	"has_exposure_compensation" boolean,
	"iso_setting_method" "iso_setting_method_enum",
	"iso_min" integer,
	"iso_max" integer,
	"has_auto_focus" boolean,
	"focus_aid_types" "focus_aid_enum"[],
	"requires_battery_for_shutter" boolean,
	"requires_battery_for_metering" boolean,
	"has_continuous_drive" boolean,
	"max_continuous_fps" integer,
	"has_hot_shoe" boolean,
	"has_self_timer" boolean,
	"has_intervalometer" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "focus_throw_degrees" integer;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "lens_zoom_type" "lens_zoom_types_enum";--> statement-breakpoint
ALTER TABLE "app"."analog_camera_specs" ADD CONSTRAINT "analog_camera_specs_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analog_camera_specs_gear_idx" ON "app"."analog_camera_specs" USING btree ("gear_id");