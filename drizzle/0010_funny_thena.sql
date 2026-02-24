CREATE TYPE "public"."review_flag_status" AS ENUM('OPEN', 'RESOLVED_KEEP', 'RESOLVED_REJECTED', 'RESOLVED_DELETED');--> statement-breakpoint
CREATE TABLE "app"."review_flags" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"review_id" varchar(36) NOT NULL,
	"reporter_user_id" varchar(255) NOT NULL,
	"status" "review_flag_status" DEFAULT 'OPEN' NOT NULL,
	"resolved_by_user_id" varchar(255),
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."review_flags" ADD CONSTRAINT "review_flags_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "app"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."review_flags" ADD CONSTRAINT "review_flags_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."review_flags" ADD CONSTRAINT "review_flags_resolved_by_user_id_user_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "app"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_flags_status_idx" ON "app"."review_flags" USING btree ("status");--> statement-breakpoint
CREATE INDEX "review_flags_review_status_idx" ON "app"."review_flags" USING btree ("review_id","status");--> statement-breakpoint
CREATE INDEX "review_flags_reporter_status_idx" ON "app"."review_flags" USING btree ("reporter_user_id","status");--> statement-breakpoint
CREATE INDEX "reviews_created_by_created_at_idx" ON "app"."reviews" USING btree ("created_by_id","created_at");