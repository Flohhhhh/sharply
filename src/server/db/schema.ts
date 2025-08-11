import { relations, sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  pgTableCreator,
  primaryKey,
  timestamp,
  text,
  varchar,
  decimal,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `sharply_${name}`);

// --- Enums ---
export const gearTypeEnum = pgEnum("gear_type", ["CAMERA", "LENS"]);

// --- Base helpers ---
const createdAt = timestamp("created_at", { withTimezone: true })
  .defaultNow()
  .notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .defaultNow()
  .notNull();

// --- Taxonomy tables ---
export const brands = createTable("brands", (d) => ({
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  name: varchar("name", { length: 200 }).notNull().unique(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  createdAt,
  updatedAt,
}));

export const mounts = createTable("mounts", (d) => ({
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  value: varchar("value", { length: 200 }).notNull().unique(),
  brandId: varchar("brand_id", { length: 36 })
    .notNull()
    .references(() => brands.id, { onDelete: "restrict" }),
  createdAt,
  updatedAt,
}));

export const sensorFormats = createTable("sensor_formats", (d) => ({
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  name: varchar("name", { length: 200 }).notNull().unique(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  createdAt,
  updatedAt,
}));

// --- Gear core ---
export const gear = createTable(
  "gear",
  (d) => ({
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    slug: varchar("slug", { length: 220 }).notNull().unique(),
    searchName: text("search_name").notNull(), // lowercased for LIKE/trigram later
    name: varchar("name", { length: 240 }).notNull(),
    gearType: gearTypeEnum("gear_type").notNull(),
    brandId: varchar("brand_id", { length: 36 })
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    mountId: varchar("mount_id", { length: 36 }).references(() => mounts.id, {
      onDelete: "set null",
    }),
    sensorFormatId: varchar("sensor_format_id", { length: 36 }).references(
      () => sensorFormats.id,
      { onDelete: "set null" },
    ),
    releaseDate: timestamp("release_date", { withTimezone: true }),
    msrpUsdCents: integer("msrp_usd_cents"),
    thumbnailUrl: text("thumbnail_url"),
    createdAt,
    updatedAt,
  }),
  (t) => [
    index("gear_search_idx").on(t.searchName),
    index("gear_type_brand_idx").on(t.gearType, t.brandId),
    index("gear_brand_mount_idx").on(t.brandId, t.mountId),
  ],
);

// --- Gear Specification Tables ---
export const cameraSpecs = createTable(
  "camera_specs",
  (d) => ({
    gearId: varchar("gear_id", { length: 36 })
      .primaryKey()
      .references(() => gear.id, { onDelete: "cascade" }),
    sensorFormatId: varchar("sensor_format_id", { length: 36 }).references(
      () => sensorFormats.id,
      { onDelete: "set null" },
    ),
    resolutionMp: decimal("resolution_mp", { precision: 6, scale: 2 }),
    isoMin: integer("iso_min"),
    isoMax: integer("iso_max"),
    maxFpsRaw: integer("max_fps_raw"),
    maxFpsJpg: integer("max_fps_jpg"),
    extra: jsonb("extra"),
    createdAt,
    updatedAt,
  }),
  // 1:1 already enforced by PK=gearId; index format if you like
  (t) => [index("camera_specs_sensor_idx").on(t.sensorFormatId)],
);

// Lenses
export const lensSpecs = createTable(
  "lens_specs",
  (d) => ({
    gearId: varchar("gear_id", { length: 36 })
      .primaryKey()
      .references(() => gear.id, { onDelete: "cascade" }),
    focalLengthMinMm: integer("focal_length_min_mm"),
    focalLengthMaxMm: integer("focal_length_max_mm"),
    hasStabilization: boolean("has_stabilization"),
    extra: jsonb("extra"),
    createdAt,
    updatedAt,
  }),
  (t) => [
    index("lens_specs_focal_idx").on(t.focalLengthMinMm, t.focalLengthMaxMm),
  ],
);

// DEFAULT //

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// --- Gear Relations ---
export const gearRelations = relations(gear, ({ one }) => ({
  cameraSpecs: one(cameraSpecs, {
    fields: [gear.id],
    references: [cameraSpecs.gearId],
  }),
  lensSpecs: one(lensSpecs, {
    fields: [gear.id],
    references: [lensSpecs.gearId],
  }),
}));
