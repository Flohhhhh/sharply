-- CREATE TYPE "public"."audit_action" AS ENUM('GEAR_CREATE', 'GEAR_EDIT_PROPOSE', 'GEAR_EDIT_APPROVE', 'GEAR_EDIT_REJECT', 'GEAR_EDIT_MERGE');--> statement-breakpoint
-- CREATE TYPE "public"."gear_type" AS ENUM('CAMERA', 'LENS');--> statement-breakpoint
-- CREATE TYPE "public"."proposal_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'MERGED');--> statement-breakpoint
-- CREATE TYPE "public"."review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
-- CREATE TYPE "public"."user_role" AS ENUM('USER', 'EDITOR', 'ADMIN');--> statement-breakpoint
CREATE TABLE "sharply_account" (
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
	CONSTRAINT "sharply_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "sharply_audit_logs" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"action" "audit_action" NOT NULL,
	"actor_user_id" varchar(255) NOT NULL,
	"gear_id" varchar(36),
	"gear_edit_id" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharply_brands" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sharply_brands_name_unique" UNIQUE("name"),
	CONSTRAINT "sharply_brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sharply_camera_specs" (
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
CREATE TABLE "sharply_gear" (
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
	CONSTRAINT "sharply_gear_slug_unique" UNIQUE("slug"),
	CONSTRAINT "sharply_gear_name_unique" UNIQUE("name"),
	CONSTRAINT "sharply_gear_model_number_unique" UNIQUE("model_number")
);
--> statement-breakpoint
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
CREATE TABLE "sharply_gear_genres" (
	"gear_id" varchar(36) NOT NULL,
	"genre_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sharply_gear_genres_gear_id_genre_id_pk" PRIMARY KEY("gear_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "sharply_genres" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"description" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sharply_genres_name_unique" UNIQUE("name"),
	CONSTRAINT "sharply_genres_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sharply_lens_specs" (
	"gear_id" varchar(36) PRIMARY KEY NOT NULL,
	"focal_length_min_mm" integer,
	"focal_length_max_mm" integer,
	"has_stabilization" boolean,
	"extra" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharply_mounts" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"value" varchar(200) NOT NULL,
	"brand_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sharply_mounts_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "sharply_ownerships" (
	"user_id" varchar(255) NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sharply_ownerships_user_id_gear_id_pk" PRIMARY KEY("user_id","gear_id")
);
--> statement-breakpoint
CREATE TABLE "sharply_popularity_events" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"user_id" varchar(255),
	"event_type" varchar(40) NOT NULL,
	"points" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharply_post" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "sharply_post_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(256),
	"createdById" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sharply_reviews" (
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
CREATE TABLE "sharply_sensor_formats" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"crop_factor" numeric(4, 2) NOT NULL,
	"description" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sharply_sensor_formats_name_unique" UNIQUE("name"),
	CONSTRAINT "sharply_sensor_formats_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sharply_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharply_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255),
	"role" "user_role" DEFAULT 'USER' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sharply_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "sharply_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "sharply_wishlists" (
	"user_id" varchar(255) NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sharply_wishlists_user_id_gear_id_pk" PRIMARY KEY("user_id","gear_id")
);
--> statement-breakpoint
ALTER TABLE "sharply_account" ADD CONSTRAINT "sharply_account_userId_sharply_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."sharply_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_audit_logs" ADD CONSTRAINT "sharply_audit_logs_actor_user_id_sharply_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."sharply_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_audit_logs" ADD CONSTRAINT "sharply_audit_logs_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_audit_logs" ADD CONSTRAINT "sharply_audit_logs_gear_edit_id_sharply_gear_edits_id_fk" FOREIGN KEY ("gear_edit_id") REFERENCES "public"."sharply_gear_edits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_camera_specs" ADD CONSTRAINT "sharply_camera_specs_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_camera_specs" ADD CONSTRAINT "sharply_camera_specs_sensor_format_id_sharply_sensor_formats_id_fk" FOREIGN KEY ("sensor_format_id") REFERENCES "public"."sharply_sensor_formats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_gear" ADD CONSTRAINT "sharply_gear_brand_id_sharply_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."sharply_brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_gear" ADD CONSTRAINT "sharply_gear_mount_id_sharply_mounts_id_fk" FOREIGN KEY ("mount_id") REFERENCES "public"."sharply_mounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_gear_edits" ADD CONSTRAINT "sharply_gear_edits_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_gear_edits" ADD CONSTRAINT "sharply_gear_edits_created_by_id_sharply_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."sharply_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_gear_genres" ADD CONSTRAINT "sharply_gear_genres_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_gear_genres" ADD CONSTRAINT "sharply_gear_genres_genre_id_sharply_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."sharply_genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_lens_specs" ADD CONSTRAINT "sharply_lens_specs_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_mounts" ADD CONSTRAINT "sharply_mounts_brand_id_sharply_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."sharply_brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_ownerships" ADD CONSTRAINT "sharply_ownerships_user_id_sharply_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sharply_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_ownerships" ADD CONSTRAINT "sharply_ownerships_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_popularity_events" ADD CONSTRAINT "sharply_popularity_events_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_popularity_events" ADD CONSTRAINT "sharply_popularity_events_user_id_sharply_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sharply_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_post" ADD CONSTRAINT "sharply_post_createdById_sharply_user_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."sharply_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_reviews" ADD CONSTRAINT "sharply_reviews_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_reviews" ADD CONSTRAINT "sharply_reviews_created_by_id_sharply_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."sharply_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_session" ADD CONSTRAINT "sharply_session_userId_sharply_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."sharply_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_wishlists" ADD CONSTRAINT "sharply_wishlists_user_id_sharply_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sharply_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_wishlists" ADD CONSTRAINT "sharply_wishlists_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "sharply_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "sharply_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "sharply_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "sharply_audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_gear_idx" ON "sharply_audit_logs" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "audit_edit_idx" ON "sharply_audit_logs" USING btree ("gear_edit_id");--> statement-breakpoint
CREATE INDEX "camera_specs_sensor_idx" ON "sharply_camera_specs" USING btree ("sensor_format_id");--> statement-breakpoint
CREATE INDEX "gear_search_idx" ON "sharply_gear" USING btree ("search_name");--> statement-breakpoint
CREATE INDEX "gear_type_brand_idx" ON "sharply_gear" USING btree ("gear_type","brand_id");--> statement-breakpoint
CREATE INDEX "gear_brand_mount_idx" ON "sharply_gear" USING btree ("brand_id","mount_id");--> statement-breakpoint
CREATE INDEX "gear_edits_status_idx" ON "sharply_gear_edits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gear_edits_gear_idx" ON "sharply_gear_edits" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_edits_created_by_idx" ON "sharply_gear_edits" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "gear_genres_gear_idx" ON "sharply_gear_genres" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_genres_genre_idx" ON "sharply_gear_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "lens_specs_focal_idx" ON "sharply_lens_specs" USING btree ("focal_length_min_mm","focal_length_max_mm");--> statement-breakpoint
CREATE INDEX "ownership_gear_idx" ON "sharply_ownerships" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "pop_events_gear_idx" ON "sharply_popularity_events" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "pop_events_gear_type_idx" ON "sharply_popularity_events" USING btree ("gear_id","event_type");--> statement-breakpoint
CREATE INDEX "pop_events_created_idx" ON "sharply_popularity_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "created_by_idx" ON "sharply_post" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX "name_idx" ON "sharply_post" USING btree ("name");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "sharply_reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reviews_gear_idx" ON "sharply_reviews" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "reviews_created_by_idx" ON "sharply_reviews" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "t_user_id_idx" ON "sharply_session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "wishlist_gear_idx" ON "sharply_wishlists" USING btree ("gear_id");