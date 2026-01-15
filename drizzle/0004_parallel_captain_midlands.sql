ALTER TABLE "app"."raw_samples" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."raw_samples" ADD COLUMN "deleted_at" timestamp with time zone;