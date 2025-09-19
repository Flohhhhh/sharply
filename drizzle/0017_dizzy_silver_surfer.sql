CREATE TABLE "app"."review_summaries" (
	"gear_id" varchar(36) PRIMARY KEY NOT NULL,
	"summary_text" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."review_summaries" ADD CONSTRAINT "review_summaries_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_summaries_updated_idx" ON "app"."review_summaries" USING btree ("updated_at");