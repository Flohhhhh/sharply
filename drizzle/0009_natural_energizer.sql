CREATE TABLE "app"."shared_lists" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"list_id" varchar(36) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"public_id" varchar(20) NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unpublished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."user_list_items" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"list_id" varchar(36) NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."user_lists" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(140) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."shared_lists" ADD CONSTRAINT "shared_lists_list_id_user_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "app"."user_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user_list_items" ADD CONSTRAINT "user_list_items_list_id_user_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "app"."user_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user_list_items" ADD CONSTRAINT "user_list_items_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user_lists" ADD CONSTRAINT "user_lists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shared_lists_list_uq" ON "app"."shared_lists" USING btree ("list_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shared_lists_public_id_uq" ON "app"."shared_lists" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "shared_lists_slug_idx" ON "app"."shared_lists" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "user_list_items_list_gear_uq" ON "app"."user_list_items" USING btree ("list_id","gear_id");--> statement-breakpoint
CREATE INDEX "user_list_items_list_position_idx" ON "app"."user_list_items" USING btree ("list_id","position");--> statement-breakpoint
CREATE INDEX "user_list_items_gear_idx" ON "app"."user_list_items" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "user_lists_user_idx" ON "app"."user_lists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_lists_user_created_idx" ON "app"."user_lists" USING btree ("user_id","created_at");