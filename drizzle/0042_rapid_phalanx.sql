CREATE TABLE "app"."gear_popularity_intraday" (
	"date" date NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"wishlist_adds" integer DEFAULT 0 NOT NULL,
	"owner_adds" integer DEFAULT 0 NOT NULL,
	"compare_adds" integer DEFAULT 0 NOT NULL,
	"review_submits" integer DEFAULT 0 NOT NULL,
	"api_fetches" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gear_popularity_intraday_date_gear_id_pk" PRIMARY KEY("date","gear_id")
);
--> statement-breakpoint
ALTER TABLE "app"."gear_popularity_intraday" ADD CONSTRAINT "gear_popularity_intraday_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gpi_gear_idx" ON "app"."gear_popularity_intraday" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gpi_date_idx" ON "app"."gear_popularity_intraday" USING btree ("date");