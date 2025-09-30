CREATE TABLE "app"."gear_mounts" (
	"gear_id" varchar(36) NOT NULL,
	"mount_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gear_mounts_gear_id_mount_id_pk" PRIMARY KEY("gear_id","mount_id")
);
--> statement-breakpoint
ALTER TABLE "app"."gear_mounts" ADD CONSTRAINT "gear_mounts_gear_id_gear_id_fk" FOREIGN KEY ("gear_id") REFERENCES "app"."gear"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."gear_mounts" ADD CONSTRAINT "gear_mounts_mount_id_mounts_id_fk" FOREIGN KEY ("mount_id") REFERENCES "app"."mounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gear_mounts_gear_idx" ON "app"."gear_mounts" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_mounts_mount_idx" ON "app"."gear_mounts" USING btree ("mount_id");