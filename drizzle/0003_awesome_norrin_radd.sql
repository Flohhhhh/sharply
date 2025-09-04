CREATE TYPE "public"."popularity_event_type" AS ENUM('view', 'wishlist_add', 'owner_add', 'compare_add', 'review_submit', 'api_fetch');--> statement-breakpoint
CREATE TYPE "public"."popularity_timeframe" AS ENUM('7d', '30d');--> statement-breakpoint
CREATE TABLE "app"."gear_popularity_daily" (
	"date" date NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"wishlist_adds" integer DEFAULT 0 NOT NULL,
	"owner_adds" integer DEFAULT 0 NOT NULL,
	"compare_adds" integer DEFAULT 0 NOT NULL,
	"review_submits" integer DEFAULT 0 NOT NULL,
	"api_fetches" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gear_popularity_daily_date_gear_id_pk" PRIMARY KEY("date","gear_id")
);
--> statement-breakpoint
CREATE TABLE "app"."gear_popularity_lifetime" (
	"gear_id" varchar(36) PRIMARY KEY NOT NULL,
	"views_lifetime" integer DEFAULT 0 NOT NULL,
	"wishlist_lifetime_adds" integer DEFAULT 0 NOT NULL,
	"owner_lifetime_adds" integer DEFAULT 0 NOT NULL,
	"compare_lifetime_adds" integer DEFAULT 0 NOT NULL,
	"review_lifetime_submits" integer DEFAULT 0 NOT NULL,
	"api_fetch_lifetime" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."gear_popularity_windows" (
	"gear_id" varchar(36) NOT NULL,
	"timeframe" "popularity_timeframe" NOT NULL,
	"as_of_date" date NOT NULL,
	"views_sum" integer DEFAULT 0 NOT NULL,
	"wishlist_adds_sum" integer DEFAULT 0 NOT NULL,
	"owner_adds_sum" integer DEFAULT 0 NOT NULL,
	"compare_adds_sum" integer DEFAULT 0 NOT NULL,
	"review_submits_sum" integer DEFAULT 0 NOT NULL,
	"api_fetches_sum" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gear_popularity_windows_gear_id_timeframe_pk" PRIMARY KEY("gear_id","timeframe")
);
--> statement-breakpoint
-- Normalize legacy event_type values to match new enum labels
UPDATE "app"."popularity_events" SET "event_type" = 'view' WHERE "event_type" = 'visit';
UPDATE "app"."popularity_events" SET "event_type" = 'wishlist_add' WHERE "event_type" = 'wishlist';
UPDATE "app"."popularity_events" SET "event_type" = 'owner_add' WHERE "event_type" = 'ownership';
UPDATE "app"."popularity_events" SET "event_type" = 'compare_add' WHERE "event_type" = 'compare';
UPDATE "app"."popularity_events" SET "event_type" = 'review_submit' WHERE "event_type" = 'review';
-- If any historical 'share' events exist, map to 'api_fetch' (or adjust as desired)
UPDATE "app"."popularity_events" SET "event_type" = 'api_fetch' WHERE "event_type" = 'share';

-- Change column type to enum using explicit cast
ALTER TABLE "app"."popularity_events" ALTER COLUMN "event_type" TYPE popularity_event_type USING "event_type"::popularity_event_type;--> statement-breakpoint
ALTER TABLE "app"."gear_popularity_daily" ADD CONSTRAINT "gear_popularity_daily_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_popularity_lifetime" ADD CONSTRAINT "gear_popularity_lifetime_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_popularity_windows" ADD CONSTRAINT "gear_popularity_windows_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gpd_gear_idx" ON "app"."gear_popularity_daily" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gpd_date_idx" ON "app"."gear_popularity_daily" USING btree ("date");--> statement-breakpoint
CREATE INDEX "gpl_gear_idx" ON "app"."gear_popularity_lifetime" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gpw_timeframe_idx" ON "app"."gear_popularity_windows" USING btree ("timeframe");--> statement-breakpoint
ALTER TABLE "app"."popularity_events" DROP COLUMN "points";