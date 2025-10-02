CREATE TYPE "public"."date_precision_enum" AS ENUM('YEAR', 'MONTH', 'DAY');--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "announce_date_precision" date_precision_enum DEFAULT 'DAY';--> statement-breakpoint
ALTER TABLE "app"."gear" ADD COLUMN "release_date_precision" date_precision_enum DEFAULT 'DAY';