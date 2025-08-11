CREATE TYPE "public"."proposal_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'MERGED');--> statement-breakpoint
CREATE TABLE "sharply_gear_edits" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"created_by_id" varchar(255) NOT NULL,
	"status" "proposal_status" DEFAULT 'PENDING' NOT NULL,
	"payload" jsonb NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sharply_gear_edits" ADD CONSTRAINT "sharply_gear_edits_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_gear_edits" ADD CONSTRAINT "sharply_gear_edits_created_by_id_sharply_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."sharply_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gear_edits_status_idx" ON "sharply_gear_edits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gear_edits_gear_idx" ON "sharply_gear_edits" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_edits_created_by_idx" ON "sharply_gear_edits" USING btree ("created_by_id");