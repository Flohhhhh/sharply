CREATE TYPE "public"."camera_af_subject_categories_enum" AS ENUM('people', 'animals', 'vehicles', 'birds', 'aircraft');--> statement-breakpoint
CREATE TYPE "public"."card_bus_enum" AS ENUM('sd_default', 'uhs_i', 'uhs_ii', 'uhs_iii', 'sd_express', 'cfexpress_pcie_gen3x1', 'cfexpress_pcie_gen3x2', 'cfexpress_pcie_gen4x1', 'cfexpress_pcie_gen4x2', 'xqd_1_0', 'xqd_2_0', 'cfast_sata_ii', 'cfast_sata_iii', 'cf_udma4', 'cf_udma5', 'cf_udma6', 'cf_udma7', 'sxs_pcie_gen1', 'sxs_pcie_gen2', 'p2_pci');--> statement-breakpoint
CREATE TYPE "public"."card_form_factor_enum" AS ENUM('sd', 'cfexpress_type_a', 'cfexpress_type_b', 'cfexpress_type_c', 'xqd', 'cfast', 'compactflash_type_i', 'compactflash_type_ii', 'memory_stick_pro_duo', 'memory_stick_pro_hg_duo', 'xd_picture_card', 'smartmedia', 'sxs', 'p2');--> statement-breakpoint
CREATE TYPE "public"."card_speed_class_enum" AS ENUM('c2', 'c4', 'c6', 'c10', 'u1', 'u3', 'v6', 'v10', 'v30', 'v60', 'v90', 'vpg_20', 'vpg_65', 'vpg_130');--> statement-breakpoint
CREATE TYPE "public"."raw_bit_depth_enum" AS ENUM('12', '14', '16');--> statement-breakpoint
CREATE TYPE "public"."sensor_stacking_types_enum" AS ENUM('unstacked', 'partially-stacked', 'fully-stacked');--> statement-breakpoint
CREATE TYPE "public"."sensor_tech_types_enum" AS ENUM('cmos', 'ccd');--> statement-breakpoint
CREATE TYPE "public"."shutter_types_enum" AS ENUM('mechanical', 'efc', 'electronic');--> statement-breakpoint
CREATE TYPE "public"."viewfinder_types_enum" AS ENUM('none', 'optical', 'electronic');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'REVIEW_APPROVE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'REVIEW_REJECT';--> statement-breakpoint
CREATE TABLE "app"."af_area_modes" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(200) NOT NULL,
	"search_name" text NOT NULL,
	"description" varchar(500),
	"brand_id" varchar(36),
	"aliases" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."camera_af_area_specs" (
	"gear_id" varchar(36) NOT NULL,
	"af_area_mode_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "camera_af_area_specs_gear_id_af_area_mode_id_pk" PRIMARY KEY("gear_id","af_area_mode_id")
);
--> statement-breakpoint
CREATE TABLE "app"."camera_card_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gear_id" uuid NOT NULL,
	"slot_index" integer NOT NULL,
	"supported_form_factors" "card_form_factor_enum"[] NOT NULL,
	"supported_buses" "card_bus_enum"[] NOT NULL,
	"supported_speed_classes" "card_speed_class_enum"[],
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."gear" RENAME COLUMN "msrp_usd_cents" TO "msrp_now_usd_cents";--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "sensor_stacking_type" "sensor_stacking_types_enum";--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "sensor_tech_type" "sensor_tech_types_enum";--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "is_back_side_illuminated" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "sensor_readout_speed_ms" integer;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "max_raw_bit_depth" "raw_bit_depth_enum";--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_ibis" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_electronic_vibration_reduction" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "cipa_stabilization_rating_stops" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_pixel_shift_shooting" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_anti_aliasing_filter" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "width_mm" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "height_mm" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "depth_mm" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "processor_name" varchar(200);--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_weather_sealing" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "focus_points" integer;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "af_subject_categories" "camera_af_subject_categories_enum"[];--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_focus_peaking" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_focus_bracketing" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "shutter_speed_max" integer;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "shutter_speed_min" integer;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "flash_sync_speed" integer;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_silent_shooting_available" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "available_shutter_types" "shutter_types_enum"[];--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "viewfinder_type" "viewfinder_types_enum";--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "cipa_battery_shots_per_charge" integer;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "supported_batteries" jsonb;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "usb_c_power_delivery" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "usb_c_charging" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "max_video_shooting_minutes" integer;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_intervalometer" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_self_timer" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_built_in_flash" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_hot_shoe" boolean;--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "announced_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "msrp_at_launch_usd_cents" integer;--> statement-breakpoint
ALTER TABLE "app"."af_area_modes" ADD CONSTRAINT "af_area_modes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "app"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."camera_af_area_specs" ADD CONSTRAINT "camera_af_area_specs_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."camera_af_area_specs" ADD CONSTRAINT "camera_af_area_specs_af_area_mode_id_af_area_modes_id_fk" FOREIGN KEY ("af_area_mode_id") REFERENCES "app"."af_area_modes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "af_area_modes_brand_idx" ON "app"."af_area_modes" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "af_area_modes_name_idx" ON "app"."af_area_modes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "af_area_modes_search_name_idx" ON "app"."af_area_modes" USING btree ("search_name");--> statement-breakpoint
CREATE INDEX "camera_af_area_specs_af_area_mode_idx" ON "app"."camera_af_area_specs" USING btree ("af_area_mode_id");--> statement-breakpoint
CREATE INDEX "camera_af_area_specs_gear_idx" ON "app"."camera_af_area_specs" USING btree ("gear_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_camera_card_slot" ON "app"."camera_card_slots" USING btree ("gear_id","slot_index");