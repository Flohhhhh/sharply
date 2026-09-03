import { sql } from "@payloadcms/db-postgres";
import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."learn_pages" ADD COLUMN "read_next_id" integer;
  ALTER TABLE "payload"."_learn_pages_v" ADD COLUMN "version_read_next_id" integer;
  ALTER TABLE "payload"."learn_pages" ADD CONSTRAINT "learn_pages_read_next_id_learn_pages_id_fk" FOREIGN KEY ("read_next_id") REFERENCES "payload"."learn_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_learn_pages_v" ADD CONSTRAINT "_learn_pages_v_version_read_next_id_learn_pages_id_fk" FOREIGN KEY ("version_read_next_id") REFERENCES "payload"."learn_pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "learn_pages_read_next_idx" ON "payload"."learn_pages" USING btree ("read_next_id");
  CREATE INDEX "_learn_pages_v_version_version_read_next_idx" ON "payload"."_learn_pages_v" USING btree ("version_read_next_id");`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."learn_pages" DROP CONSTRAINT "learn_pages_read_next_id_learn_pages_id_fk";
  
  ALTER TABLE "payload"."_learn_pages_v" DROP CONSTRAINT "_learn_pages_v_version_read_next_id_learn_pages_id_fk";
  
  DROP INDEX "payload"."learn_pages_read_next_idx";
  DROP INDEX "payload"."_learn_pages_v_version_version_read_next_idx";
  ALTER TABLE "payload"."learn_pages" DROP COLUMN "read_next_id";
  ALTER TABLE "payload"."_learn_pages_v" DROP COLUMN "version_read_next_id";`);
}
