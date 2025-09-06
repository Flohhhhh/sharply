CREATE TYPE "public"."badge_award_source" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TABLE "app"."user_badges" (
	"userId" varchar(255) NOT NULL,
	"badgeKey" varchar(200) NOT NULL,
	"awardedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"source" "badge_award_source" DEFAULT 'auto' NOT NULL,
	"context" jsonb,
	"sort_override" integer,
	CONSTRAINT "user_badges_userId_badgeKey_pk" PRIMARY KEY("userId","badgeKey")
);
--> statement-breakpoint
ALTER TABLE "app"."user_badges" ADD CONSTRAINT "user_badges_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "app"."user"("id") ON DELETE no action ON UPDATE no action;