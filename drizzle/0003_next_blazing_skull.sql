ALTER TABLE "sharply_mounts" RENAME COLUMN "slug" TO "value";--> statement-breakpoint
ALTER TABLE "sharply_mounts" DROP CONSTRAINT "sharply_mounts_name_unique";--> statement-breakpoint
ALTER TABLE "sharply_mounts" DROP CONSTRAINT "sharply_mounts_slug_unique";--> statement-breakpoint
ALTER TABLE "sharply_mounts" ADD COLUMN "brand_id" varchar(24) NOT NULL;--> statement-breakpoint
ALTER TABLE "sharply_mounts" ADD CONSTRAINT "sharply_mounts_brand_id_sharply_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."sharply_brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_mounts" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "sharply_mounts" ADD CONSTRAINT "sharply_mounts_value_unique" UNIQUE("value");