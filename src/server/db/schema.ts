/* eslint-disable @typescript-eslint/no-unused-vars */

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
  pgSchema,
  date as dateCol,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";
// Popularity event enum will be defined below for strong typing in DB

export const appSchema = pgSchema("app");

// Create the pg_trgm extension for similarity functions
export const createExtensions = sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
// export const createTable = pgTableCreator((name) => `sharply_${name}`);

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
  // Reviews
  "REVIEW_APPROVE",
  "REVIEW_REJECT",
]);
export const reviewStatusEnum = pgEnum("review_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

// --- Badges Enums ---
export const badgeAwardSourceEnum = pgEnum("badge_award_source", [
  "auto",
  "manual",
]);

// --- Popularity Enums ---
export const popularityEventTypeEnum = pgEnum("popularity_event_type", [
  "view",
  "wishlist_add",
  "owner_add",
  "compare_add",
  "review_submit",
  "api_fetch",
]);

// --- Base helpers ---
const createdAt = timestamp("created_at", { withTimezone: true })
  .defaultNow()
  .notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .defaultNow()
  .notNull();

// --- Taxonomy tables ---
export const brands = appSchema.table("brands", (d) => ({
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  name: varchar("name", { length: 200 }).notNull().unique(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  createdAt,
  updatedAt,
}));

export const mounts = appSchema.table("mounts", (d) => ({
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

export const sensorFormats = appSchema.table("sensor_formats", (d) => ({
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
export const genres = appSchema.table("genres", (d) => ({
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
export const gear = appSchema.table(
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
export const gearGenres = appSchema.table(
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
export const cameraSpecs = appSchema.table(
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
export const lensSpecs = appSchema.table(
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
export const gearEdits = appSchema.table(
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
export const auditLogs = appSchema.table(
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
export const reviews = appSchema.table(
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

// --- Editorial: Use-case Ratings ---
export const useCaseRatings = appSchema.table(
  "use_case_ratings",
  (d) => ({
    gearId: d
      .varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    genreId: d
      .varchar("genre_id", { length: 36 })
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
    score: d.integer("score").notNull(), // 0-10
    note: d.text("note"),
    createdAt,
    updatedAt,
  }),
  (t) => [
    primaryKey({ columns: [t.gearId, t.genreId] }),
    index("ucr_gear_idx").on(t.gearId),
    index("ucr_genre_idx").on(t.genreId),
  ],
);

// --- Editorial: Staff Verdicts ---
export const staffVerdicts = appSchema.table(
  "staff_verdicts",
  (d) => ({
    gearId: d
      .varchar("gear_id", { length: 36 })
      .primaryKey()
      .references(() => gear.id, { onDelete: "cascade" }),
    content: d.text("content"), // optional
    pros: d.jsonb("pros"), // string[]
    cons: d.jsonb("cons"), // string[]
    whoFor: d.text("who_for"),
    notFor: d.text("not_for"),
    alternatives: d.jsonb("alternatives"), // string[]
    authorUserId: d
      .varchar("author_user_id", { length: 255 })
      .references(() => users.id, { onDelete: "set null" }),
    createdAt,
    updatedAt,
  }),
  (t) => [index("staff_verdicts_author_idx").on(t.authorUserId)],
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
  useCaseRatings: many(useCaseRatings),
  staffVerdict: one(staffVerdicts, {
    fields: [gear.id],
    references: [staffVerdicts.gearId],
  }),
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

// --- Editorial Relations ---
export const useCaseRatingsRelations = relations(useCaseRatings, ({ one }) => ({
  gear: one(gear, { fields: [useCaseRatings.gearId], references: [gear.id] }),
  genre: one(genres, {
    fields: [useCaseRatings.genreId],
    references: [genres.id],
  }),
}));

export const staffVerdictsRelations = relations(staffVerdicts, ({ one }) => ({
  gear: one(gear, { fields: [staffVerdicts.gearId], references: [gear.id] }),
  author: one(users, {
    fields: [staffVerdicts.authorUserId],
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
export const wishlists = appSchema.table(
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

export const ownerships = appSchema.table(
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
export const popularityEvents = appSchema.table(
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
    visitorId: d.varchar("visitor_id", { length: 64 }),
    eventType: popularityEventTypeEnum("event_type").notNull(),
    createdAt,
  }),
  (t) => [
    index("pop_events_gear_idx").on(t.gearId),
    index("pop_events_gear_type_idx").on(t.gearId, t.eventType),
    index("pop_events_created_idx").on(t.createdAt),
    index("pop_events_visitor_idx").on(t.visitorId),
    index("pop_events_gear_visitor_created_idx").on(
      t.gearId,
      t.visitorId,
      t.createdAt,
    ),
  ],
);

// --- Popularity Rollup Tables ---
export const gearPopularityDaily = appSchema.table(
  "gear_popularity_daily",
  (d) => ({
    date: dateCol("date").notNull(),
    gearId: d
      .varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    views: integer("views").notNull().default(0),
    wishlistAdds: integer("wishlist_adds").notNull().default(0),
    ownerAdds: integer("owner_adds").notNull().default(0),
    compareAdds: integer("compare_adds").notNull().default(0),
    reviewSubmits: integer("review_submits").notNull().default(0),
    apiFetches: integer("api_fetches").notNull().default(0),
    updatedAt,
  }),
  (t) => [
    primaryKey({ columns: [t.date, t.gearId] }),
    index("gpd_gear_idx").on(t.gearId),
    index("gpd_date_idx").on(t.date),
  ],
);

export const popularityTimeframeEnum = pgEnum("popularity_timeframe", [
  "7d",
  "30d",
]);

export const gearPopularityWindows = appSchema.table(
  "gear_popularity_windows",
  (d) => ({
    gearId: d
      .varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    timeframe: popularityTimeframeEnum("timeframe").notNull(),
    asOfDate: dateCol("as_of_date").notNull(),
    viewsSum: integer("views_sum").notNull().default(0),
    wishlistAddsSum: integer("wishlist_adds_sum").notNull().default(0),
    ownerAddsSum: integer("owner_adds_sum").notNull().default(0),
    compareAddsSum: integer("compare_adds_sum").notNull().default(0),
    reviewSubmitsSum: integer("review_submits_sum").notNull().default(0),
    apiFetchesSum: integer("api_fetches_sum").notNull().default(0),
    updatedAt,
  }),
  (t) => [
    primaryKey({ columns: [t.gearId, t.timeframe] }),
    index("gpw_timeframe_idx").on(t.timeframe),
  ],
);

export const gearPopularityLifetime = appSchema.table(
  "gear_popularity_lifetime",
  (d) => ({
    gearId: d
      .varchar("gear_id", { length: 36 })
      .primaryKey()
      .references(() => gear.id, { onDelete: "cascade" }),
    viewsLifetime: integer("views_lifetime").notNull().default(0),
    wishlistLifetimeAdds: integer("wishlist_lifetime_adds")
      .notNull()
      .default(0),
    ownerLifetimeAdds: integer("owner_lifetime_adds").notNull().default(0),
    compareLifetimeAdds: integer("compare_lifetime_adds").notNull().default(0),
    reviewLifetimeSubmits: integer("review_lifetime_submits")
      .notNull()
      .default(0),
    apiFetchLifetime: integer("api_fetch_lifetime").notNull().default(0),
    updatedAt,
  }),
  (t) => [index("gpl_gear_idx").on(t.gearId)],
);

// Rollup run history
export const rollupRuns = appSchema.table(
  "rollup_runs",
  (d) => ({
    id: d
      .varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    asOfDate: dateCol("as_of_date").notNull(),
    correctedDate: dateCol("corrected_date").notNull(),
    dailyRows: integer("daily_rows").notNull().default(0),
    lateArrivals: integer("late_arrivals").notNull().default(0),
    windowsRows: integer("windows_rows").notNull().default(0),
    lifetimeTotalRows: integer("lifetime_total_rows").notNull().default(0),
    durationMs: integer("duration_ms").notNull().default(0),
    success: boolean("success").notNull().default(false),
    error: text("error"),
    createdAt,
  }),
  (t) => [index("rollup_runs_created_idx").on(t.createdAt)],
);

// DEFAULT //

// export const posts = appSchema.table(
//   "post",
//   (d) => ({
//     id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
//     name: d.varchar({ length: 256 }),
//     createdById: d
//       .varchar({ length: 255 })
//       .notNull()
//       .references(() => users.id),
//     createdAt: d
//       .timestamp({ withTimezone: true })
//       .default(sql`CURRENT_TIMESTAMP`)
//       .notNull(),
//     updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
//   }),
//   (t) => [
//     index("created_by_idx").on(t.createdById),
//     index("name_idx").on(t.name),
//   ],
// );

export const users = appSchema.table("user", (d) => ({
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

export const accounts = appSchema.table(
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

export const sessions = appSchema.table(
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

export const verificationTokens = appSchema.table(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// --- Badges Storage (minimal) ---
export const userBadges = appSchema.table(
  "user_badges",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    badgeKey: d.varchar({ length: 200 }).notNull(),
    awardedAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    source: badgeAwardSourceEnum("source").notNull().default("auto"),
    context: jsonb("context"),
    sortOverride: integer("sort_override"),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.badgeKey] })],
);

// Optional: append-only award log for audit/analytics
export const badgeAwardsLog = appSchema.table(
  "badge_awards_log",
  (d) => ({
    id: d
      .varchar({ length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: d
      .varchar({ length: 255 })
      .references(() => users.id, { onDelete: "set null" }),
    badgeKey: d.varchar({ length: 200 }).notNull(),
    eventType: d.varchar({ length: 100 }).notNull(),
    source: badgeAwardSourceEnum("source").notNull().default("auto"),
    context: jsonb("context"),
    awardedAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("badge_awards_log_user_idx").on(t.userId),
    index("badge_awards_log_awarded_idx").on(t.awardedAt),
    index("badge_awards_log_badge_idx").on(t.badgeKey),
  ],
);
