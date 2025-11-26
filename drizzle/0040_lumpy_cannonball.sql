ALTER TABLE "app"."camera_video_modes"
  ALTER COLUMN "crop_factor"
  SET DATA TYPE boolean
  USING ("crop_factor" IS NOT NULL AND "crop_factor"::numeric > 0);--> statement-breakpoint
ALTER TABLE "app"."camera_video_modes" ALTER COLUMN "crop_factor" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "app"."camera_video_modes" ALTER COLUMN "crop_factor" SET NOT NULL;