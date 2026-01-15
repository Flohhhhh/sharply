CREATE TABLE "app"."gear_raw_samples" (
	"gear_id" varchar(36) NOT NULL,
	"raw_sample_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gear_raw_samples_gear_id_raw_sample_id_pk" PRIMARY KEY("gear_id","raw_sample_id")
);
--> statement-breakpoint
CREATE TABLE "app"."raw_samples" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"file_url" text NOT NULL,
	"original_filename" varchar(255),
	"content_type" varchar(120),
	"size_bytes" integer,
	"uploaded_by_user_id" varchar(255),
	"upload_thing_file_id" varchar(255),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."gear_raw_samples" ADD CONSTRAINT "gear_raw_samples_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_raw_samples" ADD CONSTRAINT "gear_raw_samples_raw_sample_id_raw_samples_id_fk" FOREIGN KEY ("raw_sample_id") REFERENCES "app"."raw_samples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gear_raw_samples_gear_idx" ON "app"."gear_raw_samples" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_raw_samples_sample_idx" ON "app"."gear_raw_samples" USING btree ("raw_sample_id");--> statement-breakpoint
CREATE INDEX "raw_samples_file_url_idx" ON "app"."raw_samples" USING btree ("file_url");--> statement-breakpoint
CREATE INDEX "raw_samples_user_idx" ON "app"."raw_samples" USING btree ("uploaded_by_user_id");