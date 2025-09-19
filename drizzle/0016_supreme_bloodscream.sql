CREATE TABLE "app"."compare_pair_counts" (
	"pair_key" varchar(500) NOT NULL,
	"gear_a_id" varchar(36) NOT NULL,
	"gear_b_id" varchar(36) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compare_pair_counts_gear_a_id_gear_b_id_pk" PRIMARY KEY("gear_a_id","gear_b_id")
);
--> statement-breakpoint
ALTER TABLE "app"."compare_pair_counts" ADD CONSTRAINT "compare_pair_counts_gear_a_id_gear_id_fk" FOREIGN KEY ("gear_a_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."compare_pair_counts" ADD CONSTRAINT "compare_pair_counts_gear_b_id_gear_id_fk" FOREIGN KEY ("gear_b_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pair_counts_gear_a_idx" ON "app"."compare_pair_counts" USING btree ("gear_a_id");--> statement-breakpoint
CREATE INDEX "pair_counts_gear_b_idx" ON "app"."compare_pair_counts" USING btree ("gear_b_id");--> statement-breakpoint
CREATE INDEX "pair_counts_count_idx" ON "app"."compare_pair_counts" USING btree ("count");