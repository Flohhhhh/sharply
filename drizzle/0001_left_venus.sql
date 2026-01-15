DROP INDEX "app"."fixed_lens_specs_focal_idx";--> statement-breakpoint
DROP INDEX "app"."rec_brand_slug";--> statement-breakpoint
DROP INDEX "app"."rec_items_chart_idx";--> statement-breakpoint
DROP INDEX "app"."rec_items_gear_idx";--> statement-breakpoint
DROP INDEX "app"."audit_action_idx";--> statement-breakpoint
DROP INDEX "app"."audit_actor_idx";--> statement-breakpoint
DROP INDEX "app"."audit_created_idx";--> statement-breakpoint
DROP INDEX "app"."audit_edit_idx";--> statement-breakpoint
DROP INDEX "app"."audit_gear_idx";--> statement-breakpoint
DROP INDEX "app"."gear_brand_mount_idx";--> statement-breakpoint
DROP INDEX "app"."gear_search_idx";--> statement-breakpoint
DROP INDEX "app"."gear_type_brand_idx";--> statement-breakpoint
DROP INDEX "app"."gear_edits_created_by_idx";--> statement-breakpoint
DROP INDEX "app"."gear_edits_gear_idx";--> statement-breakpoint
DROP INDEX "app"."gear_edits_status_idx";--> statement-breakpoint
DROP INDEX "app"."reviews_created_by_idx";--> statement-breakpoint
DROP INDEX "app"."reviews_gear_idx";--> statement-breakpoint
DROP INDEX "app"."reviews_status_idx";--> statement-breakpoint
DROP INDEX "app"."staff_verdicts_author_idx";--> statement-breakpoint
DROP INDEX "app"."gpl_gear_idx";--> statement-breakpoint
DROP INDEX "app"."pop_events_created_idx";--> statement-breakpoint
DROP INDEX "app"."pop_events_gear_idx";--> statement-breakpoint
DROP INDEX "app"."pop_events_gear_type_idx";--> statement-breakpoint
DROP INDEX "app"."pop_events_gear_visitor_created_idx";--> statement-breakpoint
DROP INDEX "app"."pop_events_visitor_idx";--> statement-breakpoint
DROP INDEX "app"."rollup_runs_created_idx";--> statement-breakpoint
DROP INDEX "app"."badge_awards_log_awarded_idx";--> statement-breakpoint
DROP INDEX "app"."badge_awards_log_badge_idx";--> statement-breakpoint
DROP INDEX "app"."badge_awards_log_user_idx";--> statement-breakpoint
DROP INDEX "app"."camera_specs_sensor_idx";--> statement-breakpoint
DROP INDEX "app"."uniq_camera_card_slot";--> statement-breakpoint
DROP INDEX "app"."af_area_modes_brand_idx";--> statement-breakpoint
DROP INDEX "app"."af_area_modes_name_idx";--> statement-breakpoint
DROP INDEX "app"."af_area_modes_search_name_idx";--> statement-breakpoint
DROP INDEX "app"."review_summaries_updated_idx";--> statement-breakpoint
DROP INDEX "app"."invites_created_by_idx";--> statement-breakpoint
DROP INDEX "app"."invites_is_used_idx";--> statement-breakpoint
DROP INDEX "app"."invites_used_by_idx";--> statement-breakpoint
DROP INDEX "app"."lens_specs_focal_idx";--> statement-breakpoint
DROP INDEX "app"."raw_samples_file_url_idx";--> statement-breakpoint
DROP INDEX "app"."raw_samples_user_idx";--> statement-breakpoint
DROP INDEX "app"."camera_video_modes_gear_idx";--> statement-breakpoint
DROP INDEX "app"."notifications_user_archived_idx";--> statement-breakpoint
DROP INDEX "app"."notifications_user_created_idx";--> statement-breakpoint
DROP INDEX "app"."notifications_user_unread_idx";--> statement-breakpoint
DROP INDEX "app"."analog_camera_specs_gear_idx";--> statement-breakpoint
DROP INDEX "app"."auth_verifications_identifier_idx";--> statement-breakpoint
DROP INDEX "app"."auth_accounts_userId_idx";--> statement-breakpoint
DROP INDEX "app"."auth_sessions_userId_idx";--> statement-breakpoint
DROP INDEX "app"."passkeys_user_idx";--> statement-breakpoint
DROP INDEX "app"."gear_genres_gear_idx";--> statement-breakpoint
DROP INDEX "app"."gear_genres_genre_idx";--> statement-breakpoint
DROP INDEX "app"."ownership_gear_idx";--> statement-breakpoint
DROP INDEX "app"."wishlist_gear_idx";--> statement-breakpoint
DROP INDEX "app"."gear_raw_samples_gear_idx";--> statement-breakpoint
DROP INDEX "app"."gear_raw_samples_sample_idx";--> statement-breakpoint
DROP INDEX "app"."gear_mounts_gear_idx";--> statement-breakpoint
DROP INDEX "app"."gear_mounts_mount_idx";--> statement-breakpoint
DROP INDEX "app"."gear_alternatives_gear_a_idx";--> statement-breakpoint
DROP INDEX "app"."gear_alternatives_gear_b_idx";--> statement-breakpoint
DROP INDEX "app"."camera_af_area_specs_af_area_mode_idx";--> statement-breakpoint
DROP INDEX "app"."camera_af_area_specs_gear_idx";--> statement-breakpoint
DROP INDEX "app"."pair_counts_count_idx";--> statement-breakpoint
DROP INDEX "app"."pair_counts_gear_a_idx";--> statement-breakpoint
DROP INDEX "app"."pair_counts_gear_b_idx";--> statement-breakpoint
DROP INDEX "app"."ucr_gear_idx";--> statement-breakpoint
DROP INDEX "app"."ucr_genre_idx";--> statement-breakpoint
DROP INDEX "app"."gpd_date_idx";--> statement-breakpoint
DROP INDEX "app"."gpd_gear_idx";--> statement-breakpoint
DROP INDEX "app"."gpw_timeframe_idx";--> statement-breakpoint
DROP INDEX "app"."gpi_date_idx";--> statement-breakpoint
DROP INDEX "app"."gpi_gear_idx";--> statement-breakpoint
ALTER TABLE "app"."recommendation_charts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."recommendation_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."audit_logs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."gear" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."gear_edits" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."sensor_formats" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."brands" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."mounts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."reviews" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."genres" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."popularity_events" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."rollup_runs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."badge_awards_log" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."af_area_modes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."invites" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."raw_samples" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."notifications" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
ALTER TABLE "app"."passkeys" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;--> statement-breakpoint
CREATE INDEX "fixed_lens_specs_focal_idx" ON "app"."fixed_lens_specs" USING btree ("focal_length_min_mm","focal_length_max_mm");--> statement-breakpoint
CREATE UNIQUE INDEX "rec_brand_slug" ON "app"."recommendation_charts" USING btree ("brand","slug");--> statement-breakpoint
CREATE INDEX "rec_items_chart_idx" ON "app"."recommendation_items" USING btree ("chart_id");--> statement-breakpoint
CREATE INDEX "rec_items_gear_idx" ON "app"."recommendation_items" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "app"."audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "app"."audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "app"."audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_edit_idx" ON "app"."audit_logs" USING btree ("gear_edit_id");--> statement-breakpoint
CREATE INDEX "audit_gear_idx" ON "app"."audit_logs" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_brand_mount_idx" ON "app"."gear" USING btree ("brand_id","mount_id");--> statement-breakpoint
CREATE INDEX "gear_search_idx" ON "app"."gear" USING btree ("search_name");--> statement-breakpoint
CREATE INDEX "gear_type_brand_idx" ON "app"."gear" USING btree ("gear_type","brand_id");--> statement-breakpoint
CREATE INDEX "gear_edits_created_by_idx" ON "app"."gear_edits" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "gear_edits_gear_idx" ON "app"."gear_edits" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_edits_status_idx" ON "app"."gear_edits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reviews_created_by_idx" ON "app"."reviews" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "reviews_gear_idx" ON "app"."reviews" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "app"."reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staff_verdicts_author_idx" ON "app"."staff_verdicts" USING btree ("author_user_id");--> statement-breakpoint
CREATE INDEX "gpl_gear_idx" ON "app"."gear_popularity_lifetime" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "pop_events_created_idx" ON "app"."popularity_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pop_events_gear_idx" ON "app"."popularity_events" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "pop_events_gear_type_idx" ON "app"."popularity_events" USING btree ("gear_id","event_type");--> statement-breakpoint
CREATE INDEX "pop_events_gear_visitor_created_idx" ON "app"."popularity_events" USING btree ("gear_id","visitor_id","created_at");--> statement-breakpoint
CREATE INDEX "pop_events_visitor_idx" ON "app"."popularity_events" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "rollup_runs_created_idx" ON "app"."rollup_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "badge_awards_log_awarded_idx" ON "app"."badge_awards_log" USING btree ("awardedAt");--> statement-breakpoint
CREATE INDEX "badge_awards_log_badge_idx" ON "app"."badge_awards_log" USING btree ("badgeKey");--> statement-breakpoint
CREATE INDEX "badge_awards_log_user_idx" ON "app"."badge_awards_log" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "camera_specs_sensor_idx" ON "app"."camera_specs" USING btree ("sensor_format_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_camera_card_slot" ON "app"."camera_card_slots" USING btree ("gear_id","slot_index");--> statement-breakpoint
CREATE INDEX "af_area_modes_brand_idx" ON "app"."af_area_modes" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "af_area_modes_name_idx" ON "app"."af_area_modes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "af_area_modes_search_name_idx" ON "app"."af_area_modes" USING btree ("search_name");--> statement-breakpoint
CREATE INDEX "review_summaries_updated_idx" ON "app"."review_summaries" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "invites_created_by_idx" ON "app"."invites" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX "invites_is_used_idx" ON "app"."invites" USING btree ("is_used");--> statement-breakpoint
CREATE INDEX "invites_used_by_idx" ON "app"."invites" USING btree ("usedByUserId");--> statement-breakpoint
CREATE INDEX "lens_specs_focal_idx" ON "app"."lens_specs" USING btree ("focal_length_min_mm","focal_length_max_mm");--> statement-breakpoint
CREATE INDEX "raw_samples_file_url_idx" ON "app"."raw_samples" USING btree ("file_url");--> statement-breakpoint
CREATE INDEX "raw_samples_user_idx" ON "app"."raw_samples" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "camera_video_modes_gear_idx" ON "app"."camera_video_modes" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "notifications_user_archived_idx" ON "app"."notifications" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "app"."notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "app"."notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "analog_camera_specs_gear_idx" ON "app"."analog_camera_specs" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "auth_verifications_identifier_idx" ON "app"."auth_verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "auth_accounts_userId_idx" ON "app"."auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_userId_idx" ON "app"."auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkeys_user_idx" ON "app"."passkeys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gear_genres_gear_idx" ON "app"."gear_genres" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_genres_genre_idx" ON "app"."gear_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "ownership_gear_idx" ON "app"."ownerships" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "wishlist_gear_idx" ON "app"."wishlists" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_raw_samples_gear_idx" ON "app"."gear_raw_samples" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_raw_samples_sample_idx" ON "app"."gear_raw_samples" USING btree ("raw_sample_id");--> statement-breakpoint
CREATE INDEX "gear_mounts_gear_idx" ON "app"."gear_mounts" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gear_mounts_mount_idx" ON "app"."gear_mounts" USING btree ("mount_id");--> statement-breakpoint
CREATE INDEX "gear_alternatives_gear_a_idx" ON "app"."gear_alternatives" USING btree ("gear_a_id");--> statement-breakpoint
CREATE INDEX "gear_alternatives_gear_b_idx" ON "app"."gear_alternatives" USING btree ("gear_b_id");--> statement-breakpoint
CREATE INDEX "camera_af_area_specs_af_area_mode_idx" ON "app"."camera_af_area_specs" USING btree ("af_area_mode_id");--> statement-breakpoint
CREATE INDEX "camera_af_area_specs_gear_idx" ON "app"."camera_af_area_specs" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "pair_counts_count_idx" ON "app"."compare_pair_counts" USING btree ("count");--> statement-breakpoint
CREATE INDEX "pair_counts_gear_a_idx" ON "app"."compare_pair_counts" USING btree ("gear_a_id");--> statement-breakpoint
CREATE INDEX "pair_counts_gear_b_idx" ON "app"."compare_pair_counts" USING btree ("gear_b_id");--> statement-breakpoint
CREATE INDEX "ucr_gear_idx" ON "app"."use_case_ratings" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "ucr_genre_idx" ON "app"."use_case_ratings" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "gpd_date_idx" ON "app"."gear_popularity_daily" USING btree ("date");--> statement-breakpoint
CREATE INDEX "gpd_gear_idx" ON "app"."gear_popularity_daily" USING btree ("gear_id");--> statement-breakpoint
CREATE INDEX "gpw_timeframe_idx" ON "app"."gear_popularity_windows" USING btree ("timeframe");--> statement-breakpoint
CREATE INDEX "gpi_date_idx" ON "app"."gear_popularity_intraday" USING btree ("date");--> statement-breakpoint
CREATE INDEX "gpi_gear_idx" ON "app"."gear_popularity_intraday" USING btree ("gear_id");