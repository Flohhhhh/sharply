CREATE TYPE "public"."lens_filter_types_enum" AS ENUM('none', 'front-screw-on', 'rear-screw-on', 'rear-bayonet', 'rear-gel-slot', 'rear-drop-in', 'internal-rotary');--> statement-breakpoint
CREATE TYPE "public"."mount_material_enum" AS ENUM('metal', 'plastic');--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "width_mm" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "height_mm" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "depth_mm" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_autofocus" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "is_prime" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "max_aperture_wide" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "max_aperture_tele" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "min_aperture_wide" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "min_aperture_tele" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "cipa_stabilization_rating_stops" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_stabilization_switch" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "is_macro" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "magnification" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "minimum_focus_distance_mm" integer;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_focus_ring" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "focus_motor_type" text;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_af_mf_switch" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_focus_limiter" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "number_elements" integer;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "number_element_groups" integer;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_diffractive_optics" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "number_diaphragm_blades" integer;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_rounded_diaphragm_blades" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_internal_zoom" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_internal_focus" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "front_element_rotates" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "mount_material" "mount_material_enum";--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_weather_sealing" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_aperture_ring" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "number_custom_control_rings" integer;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "number_function_buttons" integer;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "accepts_filter_types" "lens_filter_types_enum"[];--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "front_filter_thread_size_mm" integer;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "rear_filter_thread_size_mm" integer;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "drop_in_filter_size_mm" integer;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_built_in_teleconverter" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_lens_hood" boolean;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD COLUMN "has_tripod_collar" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" DROP COLUMN "width_mm";--> statement-breakpoint
ALTER TABLE "app"."camera_specs" DROP COLUMN "height_mm";--> statement-breakpoint
ALTER TABLE "app"."camera_specs" DROP COLUMN "depth_mm";