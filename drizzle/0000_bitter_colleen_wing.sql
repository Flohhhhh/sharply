CREATE SCHEMA "app";
--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('GEAR_CREATE', 'GEAR_EDIT_PROPOSE', 'GEAR_EDIT_APPROVE', 'GEAR_EDIT_REJECT', 'GEAR_EDIT_MERGE');--> statement-breakpoint
CREATE TYPE "public"."gear_type" AS ENUM('CAMERA', 'LENS');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'MERGED');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'EDITOR', 'ADMIN');--> statement-breakpoint
CREATE TABLE "app"."account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "app"."audit_logs" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"action" "audit_action" NOT NULL,
	"actor_user_id" varchar(255) NOT NULL,
	"gear_id" varchar(36),
	"gear_edit_id" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."brands" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_name_unique" UNIQUE("name"),
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "app"."camera_specs" (
	"gear_id" varchar(36) PRIMARY KEY NOT NULL,
	"sensor_format_id" varchar(36),
	"resolution_mp" numeric(6, 2),
	"iso_min" integer,
	"iso_max" integer,
	"max_fps_raw" integer,
	"max_fps_jpg" integer,
	"extra" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."gear" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"slug" varchar(220) NOT NULL,
	"search_name" text NOT NULL,
	"name" varchar(240) NOT NULL,
	"model_number" varchar(240),
	"gear_type" "gear_type" NOT NULL,
	"brand_id" varchar(36) NOT NULL,
	"mount_id" varchar(36),
	"release_date" timestamp with time zone,
	"msrp_usd_cents" integer,
	"thumbnail_url" text,
	"weight_grams" integer,
	"link_manufacturer" text,
	"link_mpb" text,
	"link_amazon" text,
	"genres" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gear_slug_unique" UNIQUE("slug"),
	CONSTRAINT "gear_name_unique" UNIQUE("name"),
	CONSTRAINT "gear_model_number_unique" UNIQUE("model_number")
);
--> statement-breakpoint
CREATE TABLE "app"."gear_edits" (
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
CREATE TABLE "app"."gear_genres" (
	"gear_id" varchar(36) NOT NULL,
	"genre_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gear_genres_gear_id_genre_id_pk" PRIMARY KEY("gear_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "app"."genres" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"description" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name"),
	CONSTRAINT "genres_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "app"."lens_specs" (
	"gear_id" varchar(36) PRIMARY KEY NOT NULL,
	"focal_length_min_mm" integer,
	"focal_length_max_mm" integer,
	"has_stabilization" boolean,
	"extra" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."mounts" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"value" varchar(200) NOT NULL,
	"brand_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mounts_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "app"."ownerships" (
	"user_id" varchar(255) NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ownerships_user_id_gear_id_pk" PRIMARY KEY("user_id","gear_id")
);
--> statement-breakpoint
CREATE TABLE "app"."popularity_events" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"user_id" varchar(255),
	"event_type" varchar(48) NOT NULL,
	"points" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."post" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "app"."post_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(256),
	"createdById" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app"."reviews" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"created_by_id" varchar(255) NOT NULL,
	"status" "review_status" DEFAULT 'PENDING' NOT NULL,
	"genres" jsonb,
	"recommend" boolean,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."sensor_formats" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"crop_factor" numeric(4, 2) NOT NULL,
	"description" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sensor_formats_name_unique" UNIQUE("name"),
	CONSTRAINT "sensor_formats_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "app"."session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."staff_verdicts" (
	"gear_id" varchar(36) PRIMARY KEY NOT NULL,
	"content" text,
	"pros" jsonb,
	"cons" jsonb,
	"who_for" text,
	"not_for" text,
	"alternatives" jsonb,
	"author_user_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."use_case_ratings" (
	"gear_id" varchar(36) NOT NULL,
	"genre_id" varchar(36) NOT NULL,
	"score" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "use_case_ratings_gear_id_genre_id_pk" PRIMARY KEY("gear_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "app"."user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255),
	"role" "user_role" DEFAULT 'USER' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "app"."wishlists" (
	"user_id" varchar(255) NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlists_user_id_gear_id_pk" PRIMARY KEY("user_id","gear_id")
);
--> statement-breakpoint
ALTER TABLE "app"."account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "app"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "app"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."audit_logs" ADD CONSTRAINT "audit_logs_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."audit_logs" ADD CONSTRAINT "audit_logs_gear_edit_id_gear_edits_id_fk" FOREIGN KEY ("gear_edit_id") REFERENCES "app"."gear_edits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD CONSTRAINT "camera_specs_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."camera_specs" ADD CONSTRAINT "camera_specs_sensor_format_id_sensor_formats_id_fk" FOREIGN KEY ("sensor_format_id") REFERENCES "app"."sensor_formats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear" ADD CONSTRAINT "gear_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "app"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear" ADD CONSTRAINT "gear_mount_id_mounts_id_fk" FOREIGN KEY ("mount_id") REFERENCES "app"."mounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_edits" ADD CONSTRAINT "gear_edits_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_edits" ADD CONSTRAINT "gear_edits_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_genres" ADD CONSTRAINT "gear_genres_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_genres" ADD CONSTRAINT "gear_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "app"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."lens_specs" ADD CONSTRAINT "lens_specs_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."mounts" ADD CONSTRAINT "mounts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "app"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."ownerships" ADD CONSTRAINT "ownerships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."ownerships" ADD CONSTRAINT "ownerships_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."popularity_events" ADD CONSTRAINT "popularity_events_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."popularity_events" ADD CONSTRAINT "popularity_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."post" ADD CONSTRAINT "post_createdById_user_id_fk" FOREIGN KEY ("createdById") REFERENCES "app"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reviews" ADD CONSTRAINT "reviews_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reviews" ADD CONSTRAINT "reviews_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "app"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."staff_verdicts" ADD CONSTRAINT "staff_verdicts_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."staff_verdicts" ADD CONSTRAINT "staff_verdicts_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "app"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."use_case_ratings" ADD CONSTRAINT "use_case_ratings_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."use_case_ratings" ADD CONSTRAINT "use_case_ratings_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "app"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."wishlists" ADD CONSTRAINT "wishlists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."wishlists" ADD CONSTRAINT "wishlists_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "app"."account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "app"."audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "app"."audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "app"."audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_gear_idx" ON "app"."audit_logs" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "audit_edit_idx" ON "app"."audit_logs" USING btree ("gear_edit_id");--> statement-breakpoint
CREATE INDEX "camera_specs_sensor_idx" ON "app"."camera_specs" USING btree ("sensor_format_id");--> statement-breakpoint
CREATE INDEX "gear_search_idx" ON "app"."gear" USING btree ("search_name");--> statement-breakpoint
CREATE INDEX "gear_type_brand_idx" ON "app"."gear" USING btree ("gear_type","brand_id");--> statement-breakpoint
CREATE INDEX "gear_brand_mount_idx" ON "app"."gear" USING btree ("brand_id","mount_id");--> statement-breakpoint
CREATE INDEX "gear_edits_status_idx" ON "app"."gear_edits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gear_edits_gear_idx" ON "app"."gear_edits" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_edits_created_by_idx" ON "app"."gear_edits" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "gear_genres_gear_idx" ON "app"."gear_genres" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_genres_genre_idx" ON "app"."gear_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "lens_specs_focal_idx" ON "app"."lens_specs" USING btree ("focal_length_min_mm","focal_length_max_mm");--> statement-breakpoint
CREATE INDEX "ownership_gear_idx" ON "app"."ownerships" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "pop_events_gear_idx" ON "app"."popularity_events" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "pop_events_gear_type_idx" ON "app"."popularity_events" USING btree ("gear_id","event_type");--> statement-breakpoint
CREATE INDEX "pop_events_created_idx" ON "app"."popularity_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "created_by_idx" ON "app"."post" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX "name_idx" ON "app"."post" USING btree ("name");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "app"."reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reviews_gear_idx" ON "app"."reviews" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "reviews_created_by_idx" ON "app"."reviews" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "t_user_id_idx" ON "app"."session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "staff_verdicts_author_idx" ON "app"."staff_verdicts" USING btree ("author_user_id");--> statement-breakpoint
CREATE INDEX "ucr_gear_idx" ON "app"."use_case_ratings" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "ucr_genre_idx" ON "app"."use_case_ratings" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "wishlist_gear_idx" ON "app"."wishlists" USING btree ("gear_id");