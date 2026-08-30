CREATE SCHEMA "forum";
--> statement-breakpoint
CREATE TYPE "public"."forum_report_status" AS ENUM('OPEN', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."forum_thread_status" AS ENUM('OPEN', 'LOCKED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "forum"."category" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"description" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum"."post_edit" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"post_id" varchar(36) NOT NULL,
	"edited_by_id" varchar(255) NOT NULL,
	"previous_content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum"."post_gear" (
	"post_id" varchar(36) NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_gear_post_id_gear_id_pk" PRIMARY KEY("post_id","gear_id")
);
--> statement-breakpoint
CREATE TABLE "forum"."post" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"thread_id" varchar(36) NOT NULL,
	"author_user_id" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"edit_count" integer DEFAULT 0 NOT NULL,
	"last_edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum"."report" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"post_id" varchar(36) NOT NULL,
	"reporter_user_id" varchar(255) NOT NULL,
	"reason" varchar(500) NOT NULL,
	"status" "forum_report_status" DEFAULT 'OPEN' NOT NULL,
	"resolved_by_id" varchar(255),
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum"."thread_gear" (
	"thread_id" varchar(36) NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "thread_gear_thread_id_gear_id_pk" PRIMARY KEY("thread_id","gear_id")
);
--> statement-breakpoint
CREATE TABLE "forum"."thread" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"category_id" varchar(36) NOT NULL,
	"title" varchar(240) NOT NULL,
	"slug" varchar(280) NOT NULL,
	"author_user_id" varchar(255) NOT NULL,
	"status" "forum_thread_status" DEFAULT 'OPEN' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"best_answer_post_id" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forum"."category" ADD CONSTRAINT "category_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "app"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."post_edit" ADD CONSTRAINT "post_edit_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "forum"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."post_edit" ADD CONSTRAINT "post_edit_edited_by_id_user_id_fk" FOREIGN KEY ("edited_by_id") REFERENCES "app"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."post_gear" ADD CONSTRAINT "post_gear_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "forum"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."post_gear" ADD CONSTRAINT "post_gear_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."post" ADD CONSTRAINT "post_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "forum"."thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."post" ADD CONSTRAINT "post_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "app"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."report" ADD CONSTRAINT "report_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "forum"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."report" ADD CONSTRAINT "report_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "app"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."report" ADD CONSTRAINT "report_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "app"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."thread_gear" ADD CONSTRAINT "thread_gear_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "forum"."thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."thread_gear" ADD CONSTRAINT "thread_gear_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."thread" ADD CONSTRAINT "thread_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "forum"."category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum"."thread" ADD CONSTRAINT "thread_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "app"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "forum_category_slug_uq" ON "forum"."category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "forum_category_sort_idx" ON "forum"."category" USING btree ("sort_order","name");--> statement-breakpoint
CREATE INDEX "forum_post_edit_post_idx" ON "forum"."post_edit" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "forum_post_gear_gear_idx" ON "forum"."post_gear" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "forum_post_thread_created_idx" ON "forum"."post" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "forum_post_author_idx" ON "forum"."post" USING btree ("author_user_id");--> statement-breakpoint
CREATE INDEX "forum_report_status_created_idx" ON "forum"."report" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "forum_report_post_idx" ON "forum"."report" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "forum_thread_gear_gear_idx" ON "forum"."thread_gear" USING btree ("gear_id");--> statement-breakpoint
CREATE UNIQUE INDEX "forum_thread_slug_uq" ON "forum"."thread" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "forum_thread_category_activity_idx" ON "forum"."thread" USING btree ("category_id","last_activity_at");--> statement-breakpoint
CREATE INDEX "forum_thread_activity_idx" ON "forum"."thread" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "forum_thread_author_idx" ON "forum"."thread" USING btree ("author_user_id");