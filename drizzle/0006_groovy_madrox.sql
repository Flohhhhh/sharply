CREATE TABLE "app"."image_requests" (
	"user_id" varchar(255) NOT NULL,
	"gear_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "image_requests_user_id_gear_id_pk" PRIMARY KEY("user_id","gear_id")
);
--> statement-breakpoint
ALTER TABLE "app"."image_requests" ADD CONSTRAINT "image_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."image_requests" ADD CONSTRAINT "image_requests_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "image_request_gear_idx" ON "app"."image_requests" USING btree ("gear_id");