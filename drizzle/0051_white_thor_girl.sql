CREATE TABLE "app"."passkeys" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(255) NOT NULL,
	"public_key" text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" varchar(100),
	"backed_up" boolean DEFAULT false NOT NULL,
	"transports" text,
	"aaguid" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."passkeys" ADD CONSTRAINT "passkeys_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "passkeys_user_idx" ON "app"."passkeys" USING btree ("user_id");