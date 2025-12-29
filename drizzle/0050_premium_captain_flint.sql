CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint

CREATE TABLE "app"."auth_accounts" (
    "id" text PRIMARY KEY NOT NULL,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "user_id" text NOT NULL,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" timestamp,
    "refresh_token_expires_at" timestamp,
    "scope" text,
    "password" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp NOT NULL
);
--> statement-breakpoint

-- accounts migrations
INSERT INTO "app"."auth_accounts" (
  "id",
  "account_id",
  "provider_id",
  "user_id",
  "access_token",
  "refresh_token",
  "id_token",
  "access_token_expires_at",
  "refresh_token_expires_at",
  "scope",
  "password",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text AS "id",
  "providerAccountId"     AS "account_id",
  "provider"              AS "provider_id",
  "userId"                AS "user_id",
  "access_token",
  "refresh_token",
  "id_token",
  CASE
    WHEN "expires_at" IS NOT NULL
    THEN to_timestamp("expires_at")
    ELSE NULL
  END                     AS "access_token_expires_at",
  NULL                    AS "refresh_token_expires_at",
  "scope",
  NULL                    AS "password",
  now()                   AS "created_at",
  now()                   AS "updated_at"
FROM "app"."account";
--> statement-breakpoint

CREATE TABLE "app"."auth_sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "expires_at" timestamp NOT NULL,
    "token" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "user_id" text NOT NULL,
    CONSTRAINT "auth_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "app"."auth_verifications" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- user adjustments
-- Step 1: add a temp boolean column
ALTER TABLE "app"."user" ADD COLUMN "emailVerified_bool" boolean NOT NULL DEFAULT false;--> statement-breakpoint
-- Step 2: copy semantics from old timestamp column
UPDATE "app"."user" SET "emailVerified_bool" = true WHERE "emailVerified" IS NOT NULL;--> statement-breakpoint
-- Step 3: drop the old timestamp column
ALTER TABLE "app"."user" DROP COLUMN "emailVerified";--> statement-breakpoint
-- Step 4: rename boolean column to emailVerified
ALTER TABLE "app"."user" RENAME COLUMN "emailVerified_bool" TO "emailVerified";--> statement-breakpoint
-- Step 5: add updated_at column
ALTER TABLE "app"."user" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint

-- foreign key constraints
ALTER TABLE "app"."auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_accounts_userId_idx" ON "app"."auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_userId_idx" ON "app"."auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_verifications_identifier_idx" ON "app"."auth_verifications" USING btree ("identifier");