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
CREATE TABLE "sharply_wishlists" (
	"user_id" varchar(255) NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sharply_wishlists_user_id_gear_id_pk" PRIMARY KEY("user_id","gear_id")
);
--> statement-breakpoint
ALTER TABLE "sharply_ownerships" ADD CONSTRAINT "sharply_ownerships_user_id_sharply_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sharply_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_ownerships" ADD CONSTRAINT "sharply_ownerships_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_popularity_events" ADD CONSTRAINT "sharply_popularity_events_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_popularity_events" ADD CONSTRAINT "sharply_popularity_events_user_id_sharply_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sharply_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_wishlists" ADD CONSTRAINT "sharply_wishlists_user_id_sharply_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sharply_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sharply_wishlists" ADD CONSTRAINT "sharply_wishlists_gear_id_sharply_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "public"."sharply_gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ownership_gear_idx" ON "sharply_ownerships" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "pop_events_gear_idx" ON "sharply_popularity_events" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "pop_events_gear_type_idx" ON "sharply_popularity_events" USING btree ("gear_id","event_type");--> statement-breakpoint
CREATE INDEX "pop_events_created_idx" ON "sharply_popularity_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "wishlist_gear_idx" ON "sharply_wishlists" USING btree ("gear_id");