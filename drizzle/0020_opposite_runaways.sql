CREATE TABLE "app"."invites" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"inviteeName" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"createdById" varchar(255) NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"usedByUserId" varchar(255),
	"usedAt" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."user" ADD COLUMN "invite_id" varchar(36);--> statement-breakpoint
ALTER TABLE "app"."invites" ADD CONSTRAINT "invites_createdById_user_id_fk" FOREIGN KEY ("createdById") REFERENCES "app"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."invites" ADD CONSTRAINT "invites_usedByUserId_user_id_fk" FOREIGN KEY ("usedByUserId") REFERENCES "app"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invites_created_by_idx" ON "app"."invites" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX "invites_is_used_idx" ON "app"."invites" USING btree ("is_used");--> statement-breakpoint
CREATE INDEX "invites_used_by_idx" ON "app"."invites" USING btree ("usedByUserId");