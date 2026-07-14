CREATE TABLE "app"."developer_api_keys" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"key_prefix" varchar(48) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoked_by_user_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "developer_api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "app"."developer_api_rate_limit_buckets" (
	"api_key_id" varchar(36) NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "developer_api_rate_limit_buckets_api_key_id_window_start_pk" PRIMARY KEY("api_key_id","window_start")
);
--> statement-breakpoint
CREATE TABLE "app"."developer_api_usage_daily" (
	"api_key_id" varchar(36) NOT NULL,
	"usage_date" date NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"search_requests" integer DEFAULT 0 NOT NULL,
	"suggestion_requests" integer DEFAULT 0 NOT NULL,
	"gear_requests" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "developer_api_usage_daily_api_key_id_usage_date_pk" PRIMARY KEY("api_key_id","usage_date")
);
--> statement-breakpoint
ALTER TABLE "app"."user" ADD COLUMN "developer_access_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."developer_api_keys" ADD CONSTRAINT "developer_api_keys_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."developer_api_keys" ADD CONSTRAINT "developer_api_keys_revoked_by_user_id_user_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "app"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."developer_api_rate_limit_buckets" ADD CONSTRAINT "developer_api_rate_limit_buckets_api_key_id_developer_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "app"."developer_api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."developer_api_usage_daily" ADD CONSTRAINT "developer_api_usage_daily_api_key_id_developer_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "app"."developer_api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "developer_api_keys_user_active_idx" ON "app"."developer_api_keys" USING btree ("user_id","revoked_at");--> statement-breakpoint
CREATE INDEX "developer_api_keys_last_used_idx" ON "app"."developer_api_keys" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "developer_api_rate_limit_buckets_window_idx" ON "app"."developer_api_rate_limit_buckets" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "developer_api_usage_daily_date_idx" ON "app"."developer_api_usage_daily" USING btree ("usage_date");