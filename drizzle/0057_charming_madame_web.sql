CREATE TABLE "app"."gear_alternatives" (
	"gear_a_id" varchar(36) NOT NULL,
	"gear_b_id" varchar(36) NOT NULL,
	"is_competitor" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gear_alternatives_gear_a_id_gear_b_id_pk" PRIMARY KEY("gear_a_id","gear_b_id")
);
--> statement-breakpoint
ALTER TABLE "app"."gear_alternatives" ADD CONSTRAINT "gear_alternatives_gear_a_id_gear_id_fk" FOREIGN KEY ("gear_a_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_alternatives" ADD CONSTRAINT "gear_alternatives_gear_b_id_gear_id_fk" FOREIGN KEY ("gear_b_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gear_alternatives_gear_a_idx" ON "app"."gear_alternatives" USING btree ("gear_a_id");--> statement-breakpoint
CREATE INDEX "gear_alternatives_gear_b_idx" ON "app"."gear_alternatives" USING btree ("gear_b_id");