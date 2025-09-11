ALTER TABLE "app"."camera_specs" ADD COLUMN "has_log_color_profile" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_10_bit_video" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD COLUMN "has_12_bit_video" boolean;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" DROP COLUMN "max_video_shooting_minutes";