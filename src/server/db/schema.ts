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
import { POPULARITY_POINTS, type PopularityEventType } from "~/lib/constants";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `sharply_${name}`);

// --- Enums ---
export const userRoleEnum = pgEnum("user_role", ["USER", "EDITOR", "ADMIN"]);
export const gearTypeEnum = pgEnum("gear_type", ["CAMERA", "LENS"]);
export const proposalStatusEnum = pgEnum("proposal_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "MERGED",
]);
export const auditActionEnum = pgEnum("audit_action", [
  "GEAR_CREATE",
  "GEAR_EDIT_PROPOSE",
  "GEAR_EDIT_APPROVE",
  "GEAR_EDIT_REJECT",
  "GEAR_EDIT_MERGE",
]);
export const reviewStatusEnum = pgEnum("review_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

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
  cropFactor: decimal("crop_factor", { precision: 4, scale: 2 }).notNull(),
  description: varchar("description", { length: 500 }),
  createdAt,
  updatedAt,
}));

// --- Genres (Use-cases) ---
export const genres = createTable("genres", (d) => ({
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  name: varchar("name", { length: 200 }).notNull().unique(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
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
    name: varchar("name", { length: 240 }).notNull().unique(),
    modelNumber: varchar("model_number", { length: 240 }).unique(), // optional model number for de-duplication and display
    gearType: gearTypeEnum("gear_type").notNull(),
    brandId: varchar("brand_id", { length: 36 })
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    mountId: varchar("mount_id", { length: 36 }).references(() => mounts.id, {
      onDelete: "set null",
    }),
    releaseDate: timestamp("release_date", { withTimezone: true }),
    msrpUsdCents: integer("msrp_usd_cents"),
    thumbnailUrl: text("thumbnail_url"),
    weightGrams: integer("weight_grams"),
    linkManufacturer: text("link_manufacturer"),
    linkMpb: text("link_mpb"),
    linkAmazon: text("link_amazon"),
    // Denormalized shortlist of genre slugs for quick reads (authoritative list via join table)
    genres: jsonb("genres"),
    createdAt,
    updatedAt,
  }),
  (t) => [
    index("gear_search_idx").on(t.searchName),
    index("gear_type_brand_idx").on(t.gearType, t.brandId),
    index("gear_brand_mount_idx").on(t.brandId, t.mountId),
  ],
);

// Many-to-many: Gear x Genres
export const gearGenres = createTable(
  "gear_genres",
  (d) => ({
    gearId: d
      .varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    genreId: d
      .varchar("genre_id", { length: 36 })
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
    createdAt,
  }),
  (t) => [
    primaryKey({ columns: [t.gearId, t.genreId] }),
    index("gear_genres_gear_idx").on(t.gearId),
    index("gear_genres_genre_idx").on(t.genreId),
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

// --- Gear Edits ---
export const gearEdits = createTable(
  "gear_edits",
  (d) => ({
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    gearId: varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    createdById: varchar("created_by_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: proposalStatusEnum("status").notNull().default("PENDING"),
    // payload: proposed diffs for core + subtype; keep it compact
    payload: jsonb("payload").notNull(), // { core?: {...}, camera?: {...}, lens?: {...} }
    note: text("note"),
    createdAt,
    updatedAt,
  }),
  (t) => [
    index("gear_edits_status_idx").on(t.status),
    index("gear_edits_gear_idx").on(t.gearId),
    index("gear_edits_created_by_idx").on(t.createdById),
  ],
);

// --- Audit Logs ---
export const auditLogs = createTable(
  "audit_logs",
  (d) => ({
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    action: auditActionEnum("action").notNull(),
    actorUserId: varchar("actor_user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    gearId: varchar("gear_id", { length: 36 }).references(() => gear.id, {
      onDelete: "set null",
    }),
    gearEditId: varchar("gear_edit_id", { length: 36 }).references(
      () => gearEdits.id,
      { onDelete: "set null" },
    ),
    createdAt,
  }),
  (t) => [
    index("audit_created_idx").on(t.createdAt),
    index("audit_action_idx").on(t.action),
    index("audit_actor_idx").on(t.actorUserId),
    index("audit_gear_idx").on(t.gearId),
    index("audit_edit_idx").on(t.gearEditId),
  ],
);

// --- Personal Reviews ---
export const reviews = createTable(
  "reviews",
  (d) => ({
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    gearId: varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    createdById: varchar("created_by_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: reviewStatusEnum("status").notNull().default("PENDING"),
    // Review metadata
    genres: jsonb("genres"),
    recommend: boolean("recommend"),
    content: text("content").notNull(),
    createdAt,
    updatedAt,
  }),
  (t) => [
    index("reviews_status_idx").on(t.status),
    index("reviews_gear_idx").on(t.gearId),
    index("reviews_created_by_idx").on(t.createdById),
  ],
);

// --- Gear Relations ---
export const gearRelations = relations(gear, ({ one, many }) => ({
  cameraSpecs: one(cameraSpecs, {
    fields: [gear.id],
    references: [cameraSpecs.gearId],
  }),
  lensSpecs: one(lensSpecs, {
    fields: [gear.id],
    references: [lensSpecs.gearId],
  }),
  edits: many(gearEdits),
  reviews: many(reviews),
  genres: many(gearGenres),
}));

export const gearEditsRelations = relations(gearEdits, ({ one }) => ({
  gear: one(gear, {
    fields: [gearEdits.gearId],
    references: [gear.id],
  }),
  createdBy: one(users, {
    fields: [gearEdits.createdById],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  gear: one(gear, {
    fields: [reviews.gearId],
    references: [gear.id],
  }),
  createdBy: one(users, {
    fields: [reviews.createdById],
    references: [users.id],
  }),
}));

export const gearGenresRelations = relations(gearGenres, ({ one }) => ({
  gear: one(gear, { fields: [gearGenres.gearId], references: [gear.id] }),
  genre: one(genres, { fields: [gearGenres.genreId], references: [genres.id] }),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  gearLinks: many(gearGenres),
}));

// --- Interactions ---
export const wishlists = createTable(
  "wishlists",
  (d) => ({
    userId: d
      .varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gearId: d
      .varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    createdAt,
  }),
  (t) => [
    primaryKey({ columns: [t.userId, t.gearId] }),
    index("wishlist_gear_idx").on(t.gearId),
  ],
);

export const ownerships = createTable(
  "ownerships",
  (d) => ({
    userId: d
      .varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gearId: d
      .varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    createdAt,
  }),
  (t) => [
    primaryKey({ columns: [t.userId, t.gearId] }),
    index("ownership_gear_idx").on(t.gearId),
  ],
);

// Popularity events table
export const popularityEvents = createTable(
  "popularity_events",
  (d) => ({
    id: d
      .varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    gearId: d
      .varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    userId: d
      .varchar("user_id", { length: 255 })
      .references(() => users.id, { onDelete: "set null" }),
    eventType: d.varchar("event_type", { length: 40 }).notNull(), // 'wishlist', 'ownership', 'compare', 'review', 'share'
    points: d.integer("points").notNull(),
    createdAt,
  }),
  (t) => [
    index("pop_events_gear_idx").on(t.gearId),
    index("pop_events_gear_type_idx").on(t.gearId, t.eventType),
    index("pop_events_created_idx").on(t.createdAt),
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
  role: userRoleEnum("role").notNull().default("USER"),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  gearEdits: many(gearEdits),
  reviews: many(reviews),
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
