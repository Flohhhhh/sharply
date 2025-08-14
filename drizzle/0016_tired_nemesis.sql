CREATE TYPE "public"."audit_action" AS ENUM('GEAR_CREATE', 'GEAR_EDIT_PROPOSE', 'GEAR_EDIT_APPROVE', 'GEAR_EDIT_REJECT', 'GEAR_EDIT_MERGE');--> statement-breakpoint
CREATE TABLE "sharply_audit_logs" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"action" "audit_action" NOT NULL,
	"actor_user_id" varchar(255) NOT NULL,
	"gear_id" varchar(36),
	"gear_edit_id" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sharply_audit_logs" ADD CONSTRAINT "sharply_audit_logs_actor_user_id_sharply_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."sharply_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_audit_logs" ADD CONSTRAINT "sharply_audit_logs_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_audit_logs" ADD CONSTRAINT "sharply_audit_logs_gear_edit_id_sharply_gear_edits_id_fk" FOREIGN KEY ("gear_edit_id") REFERENCES "public"."sharply_gear_edits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "sharply_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "sharply_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "sharply_audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_gear_idx" ON "sharply_audit_logs" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "audit_edit_idx" ON "sharply_audit_logs" USING btree ("gear_edit_id");