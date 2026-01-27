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
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
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

// --- Enums --- now defined inline to ensure migrations create types before use

// Core app enums
export const userRoleEnum = pgEnum("user_role", [
  // Order represents increasing privilege
  "USER",
  "MODERATOR",
  "EDITOR",
  "ADMIN",
  "SUPERADMIN",
]);
export const gearTypeEnum = pgEnum("gear_type", [
  "CAMERA",
  "ANALOG_CAMERA",
  "LENS",
]);
export const proposalStatusEnum = pgEnum("proposal_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "MERGED",
]);
export const auditActionEnum = pgEnum("audit_action", [
  "GEAR_CREATE",
  "GEAR_RENAME",
  "GEAR_IMAGE_UPLOAD",
  "GEAR_IMAGE_REPLACE",
  "GEAR_IMAGE_REMOVE",
  "GEAR_TOP_VIEW_UPLOAD",
  "GEAR_TOP_VIEW_REPLACE",
  "GEAR_TOP_VIEW_REMOVE",
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

// Badges
export const badgeAwardSourceEnum = pgEnum("badge_award_source", [
  "auto",
  "manual",
]);

// Notifications
export const notificationTypeEnum = pgEnum("notification_type", [
  "gear_spec_approved",
  "badge_awarded",
  "prompt_handle_setup",
]);

// Popularity
export const popularityEventTypeEnum = pgEnum("popularity_event_type", [
  "view",
  "wishlist_add",
  "owner_add",
  "compare_add",
  "review_submit",
  "api_fetch",
]);

export const popularityTimeframeEnum = pgEnum("popularity_timeframe", [
  "7d",
  "30d",
]);

// Date precision for partial dates shown to users
export const datePrecisionEnum = pgEnum("date_precision_enum", [
  "YEAR",
  "MONTH",
  "DAY",
]);

// Camera classification
export const cameraTypeEnum = pgEnum("camera_type_enum", [
  "dslr",
  "mirrorless",
  "slr",
  "action",
  "cinema",
]);

/** 1) Card form factor (aka format/shape) */
export const cardFormFactorEnum = pgEnum("card_form_factor_enum", [
  // Modern / current
  "sd",
  "micro_sd",
  "cfexpress_type_a",
  "cfexpress_type_b",
  "cfexpress_type_c",
  "xqd",
  "cfast",

  // Legacy (still seen on spec sheets)
  "compactflash_type_i",
  "compactflash_type_ii",
  "memory_stick_pro_duo",
  "memory_stick_pro_hg_duo",
  "xd_picture_card",
  "smartmedia",
  "sxs", // Sony SxS (ExpressCard form factor; pro video)
  "p2", // Panasonic P2 (PC Card form factor; pro video)
]);

/** 2) Card bus / electrical interface */
export const cardBusEnum = pgEnum("card_bus_enum", [
  // SD family buses
  "sd_default", // legacy (non-UHS)
  "uhs_i",
  "uhs_ii",
  "uhs_iii",
  "sd_express", // PCIe/NVMe over SD

  // CFexpress (PCIe/NVMe lane configs commonly listed)
  "cfexpress_pcie_gen3x1",
  "cfexpress_pcie_gen3x2",
  "cfexpress_pcie_gen4x1",
  "cfexpress_pcie_gen4x2",

  // XQD
  "xqd_1_0",
  "xqd_2_0",

  // CFast (SATA)
  "cfast_sata_ii",
  "cfast_sata_iii",

  // CompactFlash (PATA/UDMA modes)
  "cf_udma4",
  "cf_udma5",
  "cf_udma6",
  "cf_udma7",

  // Pro video buses
  "sxs_pcie_gen1",
  "sxs_pcie_gen2",
  "p2_pci",
]);

/** 3) Speed / performance rating (non-mobile; no A1/A2) */
export const cardSpeedClassEnum = pgEnum("card_speed_class_enum", [
  // SD Speed Class
  "c2",
  "c4",
  "c6",
  "c10",

  // SD UHS Speed Class
  "u1",
  "u3",

  // SD Video Speed Class
  "v6",
  "v10",
  "v30",
  "v60",
  "v90",

  // Video Performance Guarantee (seen on CF/CFast/CFexpress media)
  "vpg_20",
  "vpg_65",
  "vpg_130",
]);

export const viewfinderTypesEnum = pgEnum("viewfinder_types_enum", [
  "none",
  "optical",
  "electronic",
]);

// Rear display articulation types
export const rearDisplayTypesEnum = pgEnum("rear_display_types_enum", [
  "none", // no rear display
  "fixed", // non-articulating
  "single_axis_tilt", // tilts up/down only
  "dual_axis_tilt", // up/down + side tilt (2-axis)
  "fully_articulated", // side-hinged vari-angle
  "four_axis_tilt_flip", // tilt and flip (sony a9III)
  "other", // other
]);

export const shutterTypesEnum = pgEnum("shutter_types_enum", [
  "mechanical",
  "efc",
  "electronic",
]);

export const sensorStackingTypesEnum = pgEnum("sensor_stacking_types_enum", [
  "unstacked",
  "partially-stacked",
  "fully-stacked",
]);

export const sensorTechTypesEnum = pgEnum("sensor_tech_types_enum", [
  "cmos",
  "ccd",
]);

export const afSubjectCategoriesEnum = pgEnum(
  "camera_af_subject_categories_enum",
  ["people", "animals", "vehicles", "birds", "aircraft"],
);

export const rawBitDepthEnum = pgEnum("raw_bit_depth_enum", [
  "10",
  "12",
  "14",
  "16",
]);

export const mountMaterialEnum = pgEnum("mount_material_enum", [
  "metal",
  "plastic",
]);

export const lensFilterTypesEnum = pgEnum("lens_filter_types_enum", [
  "none",
  "front-screw-on",
  "rear-screw-on",
  "rear-bayonet",
  "rear-gel-slot",
  "rear-drop-in",
  "internal-rotary",
]);

// lens zoom mechanisms
export const lensZoomTypesEnum = pgEnum("lens_zoom_types_enum", [
  "two-ring", // Separate zoom ring + focus ring; the modern standard for most zoom lenses
  "push-pull", // Single sleeve controls zoom by sliding and often rotates for focal length; common on many analog-era zooms
  "power-zoom", // Motor-driven zoom controlled by rocker or ring; found on some video-oriented and compact systems
  "zoom-by-wire", // Electronic zoom response rather than direct mechanical linkage; typical on some modern mirrorless/video lenses
  "collar-zoom", // Zoom controlled by a rotating collar near the mount; shows up on some specialty designs
  "other",
]);

// --- Recommendations (Enums) ---
export const recommendationRatingEnum = pgEnum("rec_rating", [
  "best value",
  "best performance",
  "situational",
  "balanced",
]);
export const recommendationGroupEnum = pgEnum("rec_group", ["prime", "zoom"]);

// Analog Camera Types
export const analogTypesEnum = pgEnum("analog_types_enum", [
  "single-lens-reflex-slr",
  "rangefinder",
  "twin-lens-reflex-tlr",
  "point-and-shoot",
  "large-format",
  "instant-film",
  "disposable",
  "toy",
  "stereo",
  "panoramic",
  "folding",
  "box",
  "pinhole",
  "press",
]);

// Analog Film Formats
export const analogMediumEnum = pgEnum("analog_medium_enum", [
  "35mm",
  "half-frame",
  "panoramic-35mm",
  "aps",
  "110",
  "126-instamatic",
  "828",
  "120",
  "220",
  "127",
  "620",
  "large-format-4x5",
  "large-format-5x7",
  "large-format-8x10",
  "ultra-large-format",
  "sheet-film",
  "metal-plate",
  "glass-plate",
  "experimental-other",
]);

// Analog Film Transport Types
export const filmTransportEnum = pgEnum("film_transport_enum", [
  "not-applicable",
  "manual-lever",
  "manual-knob",
  "manual-other",
  "motorized",
  "other",
]);

// Analog Exposure Modes
export const exposureModesEnum = pgEnum("exposure_modes_enum", [
  "manual",
  "aperture-priority",
  "shutter-priority",
  "program",
  "auto",
  "other",
]);

// Note: This enum was incorrectly named. Use meteringModeEnum instead.
// Keeping for backward compatibility but should not be used.
export const exposureModeEnum = pgEnum("metering_mode_enum", [
  "average",
  "center-weighted",
  "spot",
  "other",
]);

// Analog Metering Display Types
export const meteringDisplayTypeEnum = pgEnum("metering_display_type_enum", [
  "needle-middle",
  "needle-match",
  "led-indicators",
  "led-scale",
  "lcd-viewfinder",
  "lcd-top-panel",
  "none",
  "other",
]);

// Analog Focus Aid Types
export const focusAidEnum = pgEnum("focus_aid_enum", [
  // Plain matte screen only
  "none",
  // Split-image prism
  // Looks like: central circle split into two halves that misalign when out of focus
  "split-prism",
  // Microprism
  // Looks like: shimmering or broken image area (dot or ring) when out of focus
  "microprism",
  // Rangefinder patch
  // Looks like: secondary ghosted image that shifts horizontally; when aligned with main image, subject is in focus
  "rangefinder-patch",
  // Electronic focus confirmation
  // Looks like: single dot, light, or symbol that illuminates when focus is achieved
  "electronic-confirm",
  // Directional electronic focus guidance
  // Looks like: arrows pointing left/right or near/far
  "electronic-directional",
  // Autofocus point highlight
  // Looks like: illuminated AF boxes or brackets in the viewfinder
  "af-point",
]);

// Analog Metering Modes
export const meteringModeEnum = pgEnum("metering_mode_enum", [
  "average",
  "center-weighted",
  "spot",
  "other",
]);

// Analog Shutter Types (practical families)
export const shutterTypeEnum = pgEnum("shutter_type_enum", [
  "focal-plane-cloth", // horizontal-travel, Fabric curtains traverse the film gate; classic mechanical SLR feel
  "focal-plane-metal", // vertical-travel, Metal blades traverse the film gate; often supports higher max speeds
  "focal-plane-electronic", // Electronically controlled focal-plane shutter, Focal-plane curtains exist, but exposure timing depends on electronics/battery
  "leaf", // Leaf shutter (in-lens), Iris-style blades inside the lens; typically enables high flash sync speeds
  "rotary", // Rotary/disc shutter, Rotating disc with a cutout exposes film; rare outside specialty cameras
  "none", // No shutter in the body, Exposure controlled externally (rare / specialty setups)
  "other",
]);

// Analog ISO Setting Methods
export const isoSettingMethodEnum = pgEnum("iso_setting_method_enum", [
  "manual", // Manual ISO dial; photographer sets ISO directly for full control and push/pull flexibility
  "dx-only", // DX-coded film only; camera reads ISO from film canister with no manual override
  "dx-with-override", // DX-coded by default with manual ISO override available
  "fixed", // Fixed ISO assumption; camera meters to a single ISO value
  "other",
]);

// Analog Viewfinder Types
export const analogViewfinderTypesEnum = pgEnum(
  "analog_viewfinder_types_enum",
  [
    "none",
    "pentaprism", // Glass prism hump; bright, upright, laterally correct image (typical SLR experience)
    "pentamirror", // Mirror-based prism housing; upright image but dimmer and lighter than pentaprism
    "waist-level", // Flip-up hood viewed from above; reversed image, common on early SLRs and medium format
    "sports-finder", // Open-frame or wire finder; fast framing without precise focus, often auxiliary
    "rangefinder-style", // Separate optical window not through the lens; framing lines, no TTL viewing
    "ground-glass", // Direct ground-glass viewing at film plane; dim but precise, often with loupe
    "other",
  ],
);

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
  shortName: varchar("short_name", { length: 10 }),
  brandId: varchar("brand_id", { length: 36 }).references(() => brands.id, {
    onDelete: "restrict",
  }),
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
  // Optional scoping for where this genre applies in the catalog UI
  // Values: "camera" and/or "lens"; array may be empty or null to mean "applies broadly"
  appliesTo: text("applies_to").array(),
  createdAt,
  updatedAt,
}));

// --- AF Area Modes Dictionary ---
// Brand-scoped dictionary of AF area modes. Users can add missing items.
// No brandless default fallback. Duplicates allowed; admins merge later.
export const afAreaModes = appSchema.table(
  "af_area_modes",
  (d) => ({
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    name: varchar("name", { length: 200 }).notNull(),
    // lowercased version of name for LIKE/trigram search
    searchName: text("search_name").notNull(),
    description: varchar("description", { length: 500 }),
    brandId: varchar("brand_id", { length: 36 }).references(() => brands.id, {
      onDelete: "restrict",
    }),
    // Optional synonyms to aid search and de-duplication (array of strings)
    aliases: jsonb("aliases"),
    createdAt,
    updatedAt,
  }),
  (t) => [
    index("af_area_modes_brand_idx").on(t.brandId),
    index("af_area_modes_name_idx").on(t.name),
    index("af_area_modes_search_name_idx").on(t.searchName),
  ],
);

// Admin merge log of AF area modes: records mapping from duplicate to canonical
// Merge table removed: we will perform in-place mutation/soft-deletes for deduplication.

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
    /**
     * @deprecated Legacy single-mount pointer.
     * Use the gear_mounts junction table instead (multi-mount via many-to-many).
     * This column remains temporarily for a short buffer period to support
     * rollout and rollback safety. New code MUST NOT read or write this field.
     * Scheduled for removal after deprecation buffer once all reads/writes
     * have been fully migrated.
     */
    mountId: varchar("mount_id", { length: 36 }).references(() => mounts.id, {
      onDelete: "set null",
    }),
    announcedDate: timestamp("announced_date", { withTimezone: true }),
    announceDatePrecision: datePrecisionEnum("announce_date_precision").default(
      "DAY",
    ),
    releaseDate: timestamp("release_date", { withTimezone: true }),
    releaseDatePrecision: datePrecisionEnum("release_date_precision").default(
      "DAY",
    ),
    msrpNowUsdCents: integer("msrp_now_usd_cents"),
    msrpAtLaunchUsdCents: integer("msrp_at_launch_usd_cents"),
    // Max observed price on MPB (USD cents), optional
    mpbMaxPriceUsdCents: integer("mpb_max_price_usd_cents"),
    thumbnailUrl: text("thumbnail_url"),
    topViewUrl: text("top_view_url"),
    weightGrams: integer("weight_grams"),
    // Physical dimensions
    widthMm: decimal("width_mm", { precision: 6, scale: 2 }),
    heightMm: decimal("height_mm", { precision: 6, scale: 2 }),
    depthMm: decimal("depth_mm", { precision: 6, scale: 2 }),
    linkManufacturer: text("link_manufacturer"),
    linkMpb: text("link_mpb"),
    linkBh: text("link_bh"),
    linkAmazon: text("link_amazon"),
    // Denormalized shortlist of genre slugs for quick reads (authoritative list via join table)
    genres: jsonb("genres"),
    // Unstructured user notes for the gear item (array of strings)
    notes: text("notes").array(),
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

// Many-to-many: Gear x Mounts (new table for multi-mount support, e.g., Sigma lenses)
// Note: gear.mountId is kept for backward compatibility and will contain the "primary" mount
export const gearMounts = appSchema.table(
  "gear_mounts",
  (d) => ({
    gearId: d
      .varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    mountId: d
      .varchar("mount_id", { length: 36 })
      .notNull()
      .references(() => mounts.id, { onDelete: "restrict" }),
    createdAt,
  }),
  (t) => [
    primaryKey({ columns: [t.gearId, t.mountId] }),
    index("gear_mounts_gear_idx").on(t.gearId),
    index("gear_mounts_mount_idx").on(t.mountId),
  ],
);

// Raw sample artifacts that can be attached to gear via a junction table.
export const rawSamples = appSchema.table(
  "raw_samples",
  (d) => ({
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    fileUrl: text("file_url").notNull(),
    originalFilename: varchar("original_filename", { length: 255 }),
    contentType: varchar("content_type", { length: 120 }),
    sizeBytes: integer("size_bytes"),
    uploadedByUserId: varchar("uploaded_by_user_id", { length: 255 }),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  }),
  (t) => [
    index("raw_samples_file_url_idx").on(t.fileUrl),
    index("raw_samples_user_idx").on(t.uploadedByUserId),
  ],
);

// Junction table linking gear items to raw samples.
export const gearRawSamples = appSchema.table(
  "gear_raw_samples",
  (d) => ({
    gearId: d
      .varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    rawSampleId: d
      .varchar("raw_sample_id", { length: 36 })
      .notNull()
      .references(() => rawSamples.id, { onDelete: "cascade" }),
    createdAt,
  }),
  (t) => [
    primaryKey({ columns: [t.gearId, t.rawSampleId] }),
    index("gear_raw_samples_gear_idx").on(t.gearId),
    index("gear_raw_samples_sample_idx").on(t.rawSampleId),
  ],
);

// --- Gear Specification Tables ---
export const cameraSpecs = appSchema.table(
  "camera_specs",
  (d) => ({
    gearId: varchar("gear_id", { length: 36 })
      .primaryKey()
      .references(() => gear.id, { onDelete: "cascade" }),
    // sensor
    sensorFormatId: varchar("sensor_format_id", { length: 36 }).references(
      () => sensorFormats.id,
      { onDelete: "set null" },
    ),
    resolutionMp: decimal("resolution_mp", { precision: 6, scale: 2 }),
    sensorStackingType: sensorStackingTypesEnum("sensor_stacking_type"),
    sensorTechType: sensorTechTypesEnum("sensor_tech_type"),
    isBackSideIlluminated: boolean("is_back_side_illuminated"),
    isoMin: integer("iso_min"),
    isoMax: integer("iso_max"),
    sensorReadoutSpeedMs: decimal("sensor_readout_speed_ms", {
      precision: 4,
      scale: 1,
    }), // we will provide a checkbox for global shutter which sets this to 0ms
    maxRawBitDepth: rawBitDepthEnum("max_raw_bit_depth"),
    hasIbis: boolean("has_ibis"),
    hasElectronicVibrationReduction: boolean(
      "has_electronic_vibration_reduction",
    ),
    cipaStabilizationRatingStops: decimal("cipa_stabilization_rating_stops", {
      precision: 4,
      scale: 1,
    }),
    hasPixelShiftShooting: boolean("has_pixel_shift_shooting"),
    hasAntiAliasingFilter: boolean("has_anti_aliasing_filter"),
    precaptureSupportLevel: integer("precapture_support_level"),
    // hardware
    cameraType: cameraTypeEnum("camera_type"),
    processorName: varchar("processor_name", { length: 200 }),
    hasWeatherSealing: boolean("has_weather_sealing"),
    // focus
    focusPoints: integer("focus_points"),
    afSubjectCategories: afSubjectCategoriesEnum(
      "af_subject_categories",
    ).array(),
    hasFocusPeaking: boolean("has_focus_peaking"),
    hasFocusBracketing: boolean("has_focus_bracketing"),
    // shutter
    shutterSpeedMax: integer("shutter_speed_max"),
    shutterSpeedMin: integer("shutter_speed_min"),
    maxFpsRaw: decimal("max_fps_raw", { precision: 4, scale: 1 }),
    maxFpsJpg: decimal("max_fps_jpg", { precision: 4, scale: 1 }),
    maxFpsByShutter: jsonb("max_fps_by_shutter"),
    flashSyncSpeed: integer("flash_sync_speed"),
    hasSilentShootingAvailable: boolean("has_silent_shooting_available"),
    availableShutterTypes: shutterTypesEnum("available_shutter_types").array(),
    // battery
    internalStorageGb: decimal("internal_storage_gb", {
      precision: 6,
      scale: 1,
    }),
    cipaBatteryShotsPerCharge: integer("cipa_battery_shots_per_charge"),
    supportedBatteries: text("supported_batteries").array(),
    usbPowerDelivery: boolean("usb_power_delivery"),
    usbCharging: boolean("usb_charging"),
    // video
    hasLogColorProfile: boolean("has_log_color_profile"),
    has10BitVideo: boolean("has_10_bit_video"),
    has12BitVideo: boolean("has_12_bit_video"),
    hasOpenGateVideo: boolean("has_open_gate_video"),
    supportsExternalRecording: boolean("supports_external_recording"),
    supportsRecordToDrive: boolean("supports_record_to_drive"),
    // misc
    hasIntervalometer: boolean("has_intervalometer"),
    hasSelfTimer: boolean("has_self_timer"),
    hasBuiltInFlash: boolean("has_built_in_flash"),
    hasHotShoe: boolean("has_hot_shoe"),
    hasUsbFileTransfer: boolean("has_usb_file_transfer"),
    // displays & viewfinder
    rearDisplayType: rearDisplayTypesEnum("rear_display_type"),
    rearDisplayResolutionMillionDots: decimal(
      "rear_display_resolution_million_dots",
      { precision: 6, scale: 2 },
    ),
    rearDisplaySizeInches: decimal("rear_display_size_inches", {
      precision: 4,
      scale: 2,
    }),
    hasRearTouchscreen: boolean("has_rear_touchscreen"),
    viewfinderType: viewfinderTypesEnum("viewfinder_type"),
    viewfinderMagnification: decimal("viewfinder_magnification", {
      precision: 4,
      scale: 2,
    }),
    viewfinderResolutionMillionDots: decimal(
      "viewfinder_resolution_million_dots",
      { precision: 6, scale: 2 },
    ),
    hasTopDisplay: boolean("has_top_display"),
    extra: jsonb("extra"),
    createdAt,
    updatedAt,
  }),
  // 1:1 already enforced by PK=gearId; index format if you like
  (t) => [index("camera_specs_sensor_idx").on(t.sensorFormatId)],
);

export const cameraVideoModes = appSchema.table(
  "camera_video_modes",
  (d) => ({
    id: uuid("id").defaultRandom().primaryKey(),
    gearId: varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    resolutionKey: varchar("resolution_key", { length: 64 }).notNull(),
    resolutionLabel: varchar("resolution_label", { length: 120 }).notNull(),
    resolutionHorizontal: integer("resolution_horizontal"),
    resolutionVertical: integer("resolution_vertical"),
    fps: integer("fps").notNull(),
    codecLabel: varchar("codec_label", { length: 120 }).notNull(),
    bitDepth: integer("bit_depth").notNull(),
    cropFactor: boolean("crop_factor").notNull().default(false),
    notes: text("notes"),
    createdAt,
    updatedAt,
  }),
  (t) => [index("camera_video_modes_gear_idx").on(t.gearId)],
);

// --- Camera AF Area Specs ---
// Which AF area modes are assigned to which camera (gear_type = CAMERA)
export const cameraAfAreaSpecs = appSchema.table(
  "camera_af_area_specs",
  (d) => ({
    gearId: varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    afAreaModeId: varchar("af_area_mode_id", { length: 36 })
      .notNull()
      .references(() => afAreaModes.id, { onDelete: "restrict" }),
    createdAt,
    updatedAt,
  }),
  (t) => [
    primaryKey({ columns: [t.gearId, t.afAreaModeId] }),
    index("camera_af_area_specs_af_area_mode_idx").on(t.afAreaModeId),
    index("camera_af_area_specs_gear_idx").on(t.gearId),
  ],
);

export const cameraCardSlots = appSchema.table(
  "camera_card_slots",
  (d) => ({
    id: uuid("id").defaultRandom().primaryKey(),
    // Replace `cameras` with your actual cameras table
    gearId: uuid("gear_id").notNull(),
    slotIndex: integer("slot_index").notNull(), // 1,2,...
    supportedFormFactors: cardFormFactorEnum("supported_form_factors")
      .array()
      .notNull(),
    supportedBuses: cardBusEnum("supported_buses").array().notNull(),
    supportedSpeedClasses: cardSpeedClassEnum(
      "supported_speed_classes",
    ).array(), // optional
    notes: text("notes"),
    createdAt,
    updatedAt,
  }),
  (t) => [uniqueIndex("uniq_camera_card_slot").on(t.gearId, t.slotIndex)],
);

// Analog Camera Specs
export const analogCameraSpecs = appSchema.table(
  "analog_camera_specs",
  (d) => ({
    gearId: varchar("gear_id", { length: 36 })
      .primaryKey()
      .references(() => gear.id, { onDelete: "cascade" }),
    cameraType: analogTypesEnum("camera_type"), // list of analog camera types
    // film/capture medium
    captureMedium: analogMediumEnum("capture_medium"), //list of film types, or other capture medium
    filmTransportType: filmTransportEnum("film_transport_type"), // list of film transport types
    hasAutoFilmAdvance: boolean("has_auto_film_advance"), //weather the film advanced automatically after each shot
    hasOptionalMotorizedDrive: boolean("has_optional_motorized_drive"), //weather the camera has an optional motorized drive for the film advance
    // viewfinder
    viewfinderType: analogViewfinderTypesEnum("viewfinder_type"),
    // exposure & shutter
    shutterType: shutterTypeEnum("shutter_type"),
    shutterSpeedMax: integer("shutter_speed_max"), // in seconds
    shutterSpeedMin: integer("shutter_speed_min"), // in fractions of a second (1/1000)
    flashSyncSpeed: integer("flash_sync_speed"), // in fractions of a second (1/250)
    hasBulbMode: boolean("has_bulb_mode"),
    hasMetering: boolean("has_metering"),
    meteringModes: meteringModeEnum("metering_modes").array(),
    exposureModes: exposureModesEnum("exposure_modes").array(),
    meteringDisplayTypes: meteringDisplayTypeEnum(
      "metering_display_types",
    ).array(),
    hasExposureCompensation: boolean("has_exposure_compensation"),
    isoSettingMethod: isoSettingMethodEnum("iso_setting_method"),
    isoMin: integer("iso_min"),
    isoMax: integer("iso_max"),
    // focus
    hasAutoFocus: boolean("has_auto_focus"),
    focusAidTypes: focusAidEnum("focus_aid_types").array(),
    // electronics
    requiresBatteryForShutter: boolean("requires_battery_for_shutter"),
    requiresBatteryForMetering: boolean("requires_battery_for_metering"),
    supportedBatteries: text("supported_batteries").array(),
    hasContinuousDrive: boolean("has_continuous_drive"),
    maxContinuousFps: integer("max_continuous_fps"),
    hasHotShoe: boolean("has_hot_shoe"),
    hasSelfTimer: boolean("has_self_timer"),
    hasIntervalometer: boolean("has_intervalometer"),
    // meta
    createdAt,
    updatedAt,
  }),
  (t) => [index("analog_camera_specs_gear_idx").on(t.gearId)],
);

// Lenses
export const lensSpecs = appSchema.table(
  "lens_specs",
  (d) => ({
    gearId: varchar("gear_id", { length: 36 })
      .primaryKey()
      .references(() => gear.id, { onDelete: "cascade" }),
    // focal length
    isPrime: boolean("is_prime"),
    focalLengthMinMm: decimal("focal_length_min_mm", {
      precision: 5,
      scale: 1,
      mode: "number",
    }),
    focalLengthMaxMm: decimal("focal_length_max_mm", {
      precision: 5,
      scale: 1,
      mode: "number",
    }),
    imageCircleSizeId: varchar("image_circle_size_id", {
      length: 36,
    }).references(() => sensorFormats.id, { onDelete: "set null" }),
    // aperture
    maxApertureWide: decimal("max_aperture_wide", { precision: 4, scale: 2 }),
    maxApertureTele: decimal("max_aperture_tele", { precision: 4, scale: 2 }), // nullable
    minApertureWide: decimal("min_aperture_wide", { precision: 4, scale: 2 }),
    minApertureTele: decimal("min_aperture_tele", { precision: 4, scale: 2 }), // nullable
    //apertureProfileJson: jsonb("aperture_profile_json"), // could be used to accurately show how the aperture changes across the focal length range
    // stabilization
    hasStabilization: boolean("has_stabilization"),
    cipaStabilizationRatingStops: decimal("cipa_stabilization_rating_stops", {
      precision: 4,
      scale: 1,
    }),
    hasStabilizationSwitch: boolean("has_stabilization_switch"),
    // focus
    hasAutofocus: boolean("has_autofocus"),
    isMacro: boolean("is_macro"),
    magnification: decimal("magnification", { precision: 4, scale: 2 }),
    minimumFocusDistanceMm: integer("minimum_focus_distance_mm"), // TODO: display this using mapping as feet/meters
    hasFocusRing: boolean("has_focus_ring"),
    focusMotorType: text("focus_motor_type"), //TODO: may want to make a relation for this eventually, brands have proprietary names for different types
    focusThrowDegrees: integer("focus_throw_degrees"),
    hasAfMfSwitch: boolean("has_af_mf_switch"),
    hasFocusLimiter: boolean("has_focus_limiter"),
    hasFocusRecallButton: boolean("has_focus_recall_button"),
    // optics
    numberElements: integer("number_elements"),
    numberElementGroups: integer("number_element_groups"),
    hasDiffractiveOptics: boolean("has_diffractive_optics"), // also known as phase fresnel elements
    // build or features
    lensZoomType: lensZoomTypesEnum("lens_zoom_type"),
    numberDiaphragmBlades: integer("number_diaphragm_blades"),
    hasRoundedDiaphragmBlades: boolean("has_rounded_diaphragm_blades"),
    hasInternalZoom: boolean("has_internal_zoom"),
    hasInternalFocus: boolean("has_internal_focus"),
    frontElementRotates: boolean("front_element_rotates"),
    mountMaterial: mountMaterialEnum("mount_material"),
    hasWeatherSealing: boolean("has_weather_sealing"),
    hasApertureRing: boolean("has_aperture_ring"),
    numberCustomControlRings: integer("number_custom_control_rings"),
    numberFunctionButtons: integer("number_function_buttons"),
    acceptsFilterTypes: lensFilterTypesEnum("accepts_filter_types").array(),
    frontFilterThreadSizeMm: integer("front_filter_thread_size_mm"),
    rearFilterThreadSizeMm: integer("rear_filter_thread_size_mm"),
    dropInFilterSizeMm: integer("drop_in_filter_size_mm"),
    hasBuiltInTeleconverter: boolean("has_built_in_teleconverter"),
    hasLensHood: boolean("has_lens_hood"),
    hasTripodCollar: boolean("has_tripod_collar"),
    extra: jsonb("extra"),
    createdAt,
    updatedAt,
  }),
  (t) => [
    index("lens_specs_focal_idx").on(t.focalLengthMinMm, t.focalLengthMaxMm),
  ],
);

// Fixed-lens specs (for cameras with integrated lenses)
export const fixedLensSpecs = appSchema.table(
  "fixed_lens_specs",
  (d) => ({
    gearId: varchar("gear_id", { length: 36 })
      .primaryKey()
      .references(() => gear.id, { onDelete: "cascade" }),
    // focal length
    isPrime: boolean("is_prime"),
    focalLengthMinMm: decimal("focal_length_min_mm", {
      precision: 5,
      scale: 1,
      mode: "number",
    }),
    focalLengthMaxMm: decimal("focal_length_max_mm", {
      precision: 5,
      scale: 1,
      mode: "number",
    }),
    imageCircleSizeId: varchar("image_circle_size_id", {
      length: 36,
    }).references(() => sensorFormats.id, { onDelete: "set null" }),
    // aperture
    maxApertureWide: decimal("max_aperture_wide", { precision: 4, scale: 2 }),
    maxApertureTele: decimal("max_aperture_tele", { precision: 4, scale: 2 }),
    minApertureWide: decimal("min_aperture_wide", { precision: 4, scale: 2 }),
    minApertureTele: decimal("min_aperture_tele", { precision: 4, scale: 2 }),
    // focus & build (simplified)
    hasAutofocus: boolean("has_autofocus"),
    minimumFocusDistanceMm: integer("minimum_focus_distance_mm"),
    frontElementRotates: boolean("front_element_rotates"),
    frontFilterThreadSizeMm: integer("front_filter_thread_size_mm"),
    hasLensHood: boolean("has_lens_hood"),
    createdAt,
    updatedAt,
  }),
  (t) => [
    index("fixed_lens_specs_focal_idx").on(
      t.focalLengthMinMm,
      t.focalLengthMaxMm,
    ),
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

// --- AI Review Summaries (one row per gear) ---
export const reviewSummaries = appSchema.table(
  "review_summaries",
  (d) => ({
    gearId: d
      .varchar("gear_id", { length: 36 })
      .primaryKey()
      .references(() => gear.id, { onDelete: "cascade" }),
    summaryText: d.text("summary_text"),
    updatedAt,
  }),
  (t) => [index("review_summaries_updated_idx").on(t.updatedAt)],
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
  analogCameraSpecs: one(analogCameraSpecs, {
    fields: [gear.id],
    references: [analogCameraSpecs.gearId],
  }),
  lensSpecs: one(lensSpecs, {
    fields: [gear.id],
    references: [lensSpecs.gearId],
  }),
  fixedLensSpecs: one(fixedLensSpecs, {
    fields: [gear.id],
    references: [fixedLensSpecs.gearId],
  }),
  edits: many(gearEdits),
  reviews: many(reviews),
  genres: many(gearGenres),
  mounts: many(gearMounts),
  useCaseRatings: many(useCaseRatings),
  staffVerdict: one(staffVerdicts, {
    fields: [gear.id],
    references: [staffVerdicts.gearId],
  }),
  rawSamples: many(gearRawSamples),
}));

export const gearMountsRelations = relations(gearMounts, ({ one }) => ({
  gear: one(gear, {
    fields: [gearMounts.gearId],
    references: [gear.id],
  }),
  mount: one(mounts, {
    fields: [gearMounts.mountId],
    references: [mounts.id],
  }),
}));

export const gearRawSamplesRelations = relations(gearRawSamples, ({ one }) => ({
  gear: one(gear, {
    fields: [gearRawSamples.gearId],
    references: [gear.id],
  }),
  rawSample: one(rawSamples, {
    fields: [gearRawSamples.rawSampleId],
    references: [rawSamples.id],
  }),
}));

export const rawSamplesRelations = relations(rawSamples, ({ many }) => ({
  gearAssociations: many(gearRawSamples),
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

// Relations declared AFTER table declarations below

// --- Recommendations ---
export const recommendationCharts = appSchema.table(
  "recommendation_charts",
  (d) => ({
    id: d
      .varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    brand: d.varchar("brand", { length: 120 }).notNull(),
    slug: d.varchar("slug", { length: 200 }).notNull(),
    title: d.varchar("title", { length: 300 }).notNull(),
    description: d.varchar("description", { length: 800 }),
    updatedDate: dateCol("updated_date").notNull(),
    isPublished: d.boolean("is_published").notNull().default(true),
    createdAt,
    updatedAt,
  }),
  (t) => [uniqueIndex("rec_brand_slug").on(t.brand, t.slug)],
);

export const recommendationItems = appSchema.table(
  "recommendation_items",
  (d) => ({
    id: d
      .varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    chartId: d
      .varchar("chart_id", { length: 36 })
      .notNull()
      .references(() => recommendationCharts.id, { onDelete: "cascade" }),
    gearId: d
      .varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "restrict" }),
    rating: recommendationRatingEnum("rating").notNull(),
    note: d.text("note"),
    // Optional overrides controlling grouping
    groupOverride: recommendationGroupEnum("group_override"),
    customColumn: d.varchar("custom_column", { length: 120 }),
    // Per-item price range override (display only)
    priceMinOverride: d.integer("price_min_override"),
    priceMaxOverride: d.integer("price_max_override"),
    createdAt,
    updatedAt,
  }),
  (t) => [
    index("rec_items_chart_idx").on(t.chartId),
    index("rec_items_gear_idx").on(t.gearId),
  ],
);

// --- Recommendation Relations ---
export const recommendationChartsRelations = relations(
  recommendationCharts,
  ({ many }) => ({
    items: many(recommendationItems),
  }),
);

export const recommendationItemsRelations = relations(
  recommendationItems,
  ({ one }) => ({
    chart: one(recommendationCharts, {
      fields: [recommendationItems.chartId],
      references: [recommendationCharts.id],
    }),
    gear: one(gear, {
      fields: [recommendationItems.gearId],
      references: [gear.id],
    }),
  }),
);

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

export const imageRequests = appSchema.table(
  "image_requests",
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
    index("image_request_gear_idx").on(t.gearId),
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

// Live intraday counters (UTC date scoped, reset nightly by rollup)
export const gearPopularityIntraday = appSchema.table(
  "gear_popularity_intraday",
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
    createdAt,
    updatedAt,
  }),
  (t) => [
    primaryKey({ columns: [t.date, t.gearId] }),
    index("gpi_gear_idx").on(t.gearId),
    index("gpi_date_idx").on(t.date),
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

// popularityTimeframeEnum imported

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

// --- Compare Pair Counters (minimal) ---
export const comparePairCounts = appSchema.table(
  "compare_pair_counts",
  (d) => ({
    // Denormalized convenience key derived from sorted slugs (e.g., "slugA|slugB").
    // Not used for uniqueness; updated with current slugs on increment.
    pairKey: d.varchar("pair_key", { length: 500 }).notNull(),
    // Canonical pair ordering by gear ids; used for uniqueness and upsert target
    gearAId: d
      .varchar("gear_a_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    gearBId: d
      .varchar("gear_b_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    count: d.integer("count").notNull().default(0),
    updatedAt,
  }),
  (t) => [
    primaryKey({ columns: [t.gearAId, t.gearBId] }),
    index("pair_counts_gear_a_idx").on(t.gearAId),
    index("pair_counts_gear_b_idx").on(t.gearBId),
    index("pair_counts_count_idx").on(t.count),
  ],
);

// --- Gear Alternatives (symmetric pairs with competitor flag) ---
export const gearAlternatives = appSchema.table(
  "gear_alternatives",
  (d) => ({
    // Canonical pair ordering: gearAId < gearBId (lexicographically)
    gearAId: d
      .varchar("gear_a_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    gearBId: d
      .varchar("gear_b_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    isCompetitor: d.boolean("is_competitor").notNull().default(false),
    createdAt,
  }),
  (t) => [
    primaryKey({ columns: [t.gearAId, t.gearBId] }),
    index("gear_alternatives_gear_a_idx").on(t.gearAId),
    index("gear_alternatives_gear_b_idx").on(t.gearBId),
  ],
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

export const notifications = appSchema.table(
  "notifications",
  (d) => ({
    id: d
      .varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: d
      .varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    linkUrl: text("link_url"),
    sourceType: varchar("source_type", { length: 100 }),
    sourceId: varchar("source_id", { length: 100 }),
    metadata: jsonb("metadata"),
    readAt: timestamp("read_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
  (t) => [
    index("notifications_user_created_idx").on(t.userId, t.createdAt),
    index("notifications_user_unread_idx").on(t.userId, t.readAt),
    index("notifications_user_archived_idx").on(t.userId, t.archivedAt),
  ],
);

export const passkeys = appSchema.table(
  "passkeys",
  (d) => ({
    id: d
      .varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    name: d.varchar("name", { length: 255 }).notNull(),
    publicKey: d.text("public_key").notNull(),
    userId: d
      .varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialID: d.text("credential_id").notNull(),
    counter: d.integer("counter").notNull().default(0),
    deviceType: d.varchar("device_type", { length: 100 }),
    backedUp: d.boolean("backed_up").notNull().default(false),
    transports: d.text("transports"),
    aaguid: d.varchar("aaguid", { length: 255 }),
    createdAt,
  }),
  (t) => [index("passkeys_user_idx").on(t.userId)],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

// --- Badges Storage (minimal) ---
export const userBadges = appSchema.table(
  "user_badges",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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

// --- Invites ---
export const invites = appSchema.table(
  "invites",
  (d) => ({
    id: d
      .varchar({ length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    inviteeName: d.varchar({ length: 255 }).notNull(),
    role: userRoleEnum("role").notNull().default("USER"),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    isUsed: d.boolean("is_used").notNull().default(false),
    usedByUserId: d
      .varchar({ length: 255 })
      .references(() => users.id, { onDelete: "set null" }),
    usedAt: d.timestamp({ mode: "date", withTimezone: true }),
    createdAt,
    updatedAt,
  }),
  (t) => [
    index("invites_created_by_idx").on(t.createdById),
    index("invites_is_used_idx").on(t.isUsed),
    index("invites_used_by_idx").on(t.usedByUserId),
  ],
);

// -- AUTH SCHEMA --

export const users = appSchema.table("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  handle: d.varchar({ length: 50 }).unique(),
  email: d.varchar({ length: 255 }).notNull(),
  // changed from timestamp to boolean
  emailVerified: d.boolean().notNull().default(false),
  image: d.varchar({ length: 255 }),
  role: userRoleEnum("role").notNull().default("USER"),
  // Sequential public member number, first user is 1, second is 2, etc.
  memberNumber: integer("member_number")
    .generatedByDefaultAsIdentity()
    .notNull()
    .unique(),
  // Invite used to join (if applicable). Stored for audit, no FK to avoid cycle.
  inviteId: varchar("invite_id", { length: 36 }),
  // Social links (array of {label: string, url: string, icon?: string})
  socialLinks: jsonb("social_links"),
  createdAt,
  updatedAt: d
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
}));

export const usersRelations = relations(users, ({ many }) => ({
  gearEdits: many(gearEdits),
  reviews: many(reviews),
  notifications: many(notifications),
  passkeys: many(passkeys),
}));

// Export the user type for use throughout the application
export type User = typeof users.$inferSelect;

export const authSessions = appSchema.table(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("auth_sessions_userId_idx").on(table.userId)],
);

export const authAccounts = appSchema.table(
  "auth_accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("auth_accounts_userId_idx").on(table.userId)],
);

export const authVerifications = appSchema.table(
  "auth_verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("auth_verifications_identifier_idx").on(table.identifier)],
);

export const authUsersRelations = relations(users, ({ many }) => ({
  sessions: many(authSessions),
  accounts: many(authAccounts),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  users: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const authAccountsRelations = relations(authAccounts, ({ one }) => ({
  users: one(users, {
    fields: [authAccounts.userId],
    references: [users.id],
  }),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, { fields: [passkeys.userId], references: [users.id] }),
}));
