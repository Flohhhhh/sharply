-- Convert JSONB -> text[] without USING subquery
ALTER TABLE "app"."camera_specs" ADD COLUMN "supported_batteries_tmp" text[];

UPDATE "app"."camera_specs"
SET "supported_batteries_tmp" = CASE
  WHEN supported_batteries IS NULL THEN NULL
  WHEN jsonb_typeof(supported_batteries) = 'array' THEN (
    SELECT COALESCE(array_agg(e), ARRAY[]::text[])
    FROM jsonb_array_elements_text(supported_batteries) AS e
  )
  WHEN jsonb_typeof(supported_batteries) = 'string' THEN ARRAY[supported_batteries::text]
  ELSE NULL
END;

ALTER TABLE "app"."camera_specs" DROP COLUMN "supported_batteries";
ALTER TABLE "app"."camera_specs" RENAME COLUMN "supported_batteries_tmp" TO "supported_batteries";