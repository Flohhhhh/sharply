CREATE TYPE "public"."rec_group" AS ENUM('prime', 'zoom');--> statement-breakpoint
CREATE TYPE "public"."rec_rating" AS ENUM('best value', 'best performance', 'situational', 'balanced');--> statement-breakpoint
CREATE TABLE "app"."recommendation_charts" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"brand" varchar(120) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" varchar(800),
	"updated_date" date NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."recommendation_items" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"chart_id" varchar(36) NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"rating" "rec_rating" NOT NULL,
	"note" text,
	"group_override" "rec_group",
	"custom_column" varchar(120),
	"price_min_override" integer,
	"price_max_override" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."recommendation_items" ADD CONSTRAINT "recommendation_items_chart_id_recommendation_charts_id_fk" FOREIGN KEY ("chart_id") REFERENCES "app"."recommendation_charts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."recommendation_items" ADD CONSTRAINT "recommendation_items_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rec_brand_slug" ON "app"."recommendation_charts" USING btree ("brand","slug");--> statement-breakpoint
CREATE INDEX "rec_items_chart_idx" ON "app"."recommendation_items" USING btree ("chart_id");--> statement-breakpoint
CREATE INDEX "rec_items_gear_idx" ON "app"."recommendation_items" USING btree ("gear_id");