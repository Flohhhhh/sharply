CREATE TABLE "app"."rollup_runs" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"as_of_date" date NOT NULL,
	"corrected_date" date NOT NULL,
	"daily_rows" integer DEFAULT 0 NOT NULL,
	"late_arrivals" integer DEFAULT 0 NOT NULL,
	"windows_rows" integer DEFAULT 0 NOT NULL,
	"lifetime_total_rows" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rollup_runs_created_idx" ON "app"."rollup_runs" USING btree ("created_at");