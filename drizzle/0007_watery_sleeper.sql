CREATE TABLE "app"."badge_awards_log" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"userId" varchar(255),
	"badgeKey" varchar(200) NOT NULL,
	"eventType" varchar(100) NOT NULL,
	"source" "badge_award_source" DEFAULT 'auto' NOT NULL,
	"context" jsonb,
	"awardedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."badge_awards_log" ADD CONSTRAINT "badge_awards_log_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "app"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "badge_awards_log_user_idx" ON "app"."badge_awards_log" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "badge_awards_log_awarded_idx" ON "app"."badge_awards_log" USING btree ("awardedAt");--> statement-breakpoint
CREATE INDEX "badge_awards_log_badge_idx" ON "app"."badge_awards_log" USING btree ("badgeKey");