ALTER TYPE "public"."notification_type" ADD VALUE 'prompt_handle_setup';--> statement-breakpoint
ALTER TABLE "app"."user" ADD COLUMN "handle" varchar(50);--> statement-breakpoint
ALTER TABLE "app"."user" ADD CONSTRAINT "user_handle_unique" UNIQUE("handle");