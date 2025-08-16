CREATE TYPE "public"."user_role" AS ENUM('USER', 'EDITOR', 'ADMIN');--> statement-breakpoint
ALTER TABLE "sharply_user" ADD COLUMN "role" "user_role" DEFAULT 'USER' NOT NULL;