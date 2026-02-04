CREATE TYPE "public"."gear_region" AS ENUM('GLOBAL', 'EU', 'JP');--> statement-breakpoint
ALTER TYPE "public"."focus_aid_enum" ADD VALUE 'rangefinder-patch' BEFORE 'electronic-confirm';--> statement-breakpoint
CREATE TABLE "app"."gear_aliases" (
	"gear_id" varchar(36) NOT NULL,
	"region" "gear_region" NOT NULL,
	"name" varchar(240) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gear_aliases_gear_id_region_pk" PRIMARY KEY("gear_id","region")
);
--> statement-breakpoint
ALTER TABLE "app"."gear_aliases" ADD CONSTRAINT "gear_aliases_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gear_aliases_gear_idx" ON "app"."gear_aliases" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_aliases_region_idx" ON "app"."gear_aliases" USING btree ("region");