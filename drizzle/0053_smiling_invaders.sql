ALTER TABLE "app"."fixed_lens_specs" ALTER COLUMN "focal_length_min_mm" SET DATA TYPE numeric(5, 1);--> statement-breakpoint
ALTER TABLE "app"."fixed_lens_specs" ALTER COLUMN "focal_length_max_mm" SET DATA TYPE numeric(5, 1);--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ALTER COLUMN "focal_length_min_mm" SET DATA TYPE numeric(5, 1);--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ALTER COLUMN "focal_length_max_mm" SET DATA TYPE numeric(5, 1);