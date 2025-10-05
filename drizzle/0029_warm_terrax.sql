CREATE TABLE "app"."fixed_lens_specs" (
	"gear_id" varchar(36) PRIMARY KEY NOT NULL,
	"is_prime" boolean,
	"focal_length_min_mm" integer,
	"focal_length_max_mm" integer,
	"max_aperture_wide" numeric(4, 2),
	"max_aperture_tele" numeric(4, 2),
	"min_aperture_wide" numeric(4, 2),
	"min_aperture_tele" numeric(4, 2),
	"has_autofocus" boolean,
	"minimum_focus_distance_mm" integer,
	"front_element_rotates" boolean,
	"front_filter_thread_size_mm" integer,
	"has_lens_hood" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."fixed_lens_specs" ADD CONSTRAINT "fixed_lens_specs_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fixed_lens_specs_focal_idx" ON "app"."fixed_lens_specs" USING btree ("focal_length_min_mm","focal_length_max_mm");