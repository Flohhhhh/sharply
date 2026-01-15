ALTER TABLE "app"."user_badges" DROP CONSTRAINT "user_badges_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "app"."user_badges" ADD CONSTRAINT "user_badges_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "app"."user"("id") ON DELETE cascade ON UPDATE no action;