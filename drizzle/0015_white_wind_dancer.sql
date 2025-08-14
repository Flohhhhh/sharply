ALTER TABLE "sharply_gear" ADD COLUMN "model_number" varchar(240);--> statement-breakpoint
ALTER TABLE "sharply_gear" ADD CONSTRAINT "sharply_gear_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "sharply_gear" ADD CONSTRAINT "sharply_gear_model_number_unique" UNIQUE("model_number");