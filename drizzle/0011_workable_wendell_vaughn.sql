CREATE TYPE "public"."review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "sharply_reviews" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"created_by_id" varchar(255) NOT NULL,
	"status" "review_status" DEFAULT 'PENDING' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sharply_reviews" ADD CONSTRAINT "sharply_reviews_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_reviews" ADD CONSTRAINT "sharply_reviews_created_by_id_sharply_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."sharply_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "sharply_reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reviews_gear_idx" ON "sharply_reviews" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "reviews_created_by_idx" ON "sharply_reviews" USING btree ("created_by_id");