CREATE TYPE "public"."notification_type" AS ENUM('gear_spec_approved', 'badge_awarded');--> statement-breakpoint
CREATE TABLE "app"."notifications" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link_url" text,
	"source_type" varchar(100),
	"source_id" varchar(100),
	"metadata" jsonb,
	"read_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "app"."notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "app"."notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "notifications_user_archived_idx" ON "app"."notifications" USING btree ("user_id","archived_at");