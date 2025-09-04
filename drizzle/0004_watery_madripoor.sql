ALTER TABLE "app"."popularity_events" ADD COLUMN "visitor_id" varchar(64);--> statement-breakpoint
CREATE INDEX "pop_events_visitor_idx" ON "app"."popularity_events" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "pop_events_gear_visitor_created_idx" ON "app"."popularity_events" USING btree ("gear_id","visitor_id","created_at");