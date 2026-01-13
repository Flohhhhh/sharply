import "dotenv/config";

import slugify from "slugify";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "../src/server/db";
import {
  afAreaModes,
  brands,
  cameraAfAreaSpecs,
  cameraSpecs,
  gear,
  gearGenres,
  gearMounts,
  genres as genresTable,
  mounts,
  lensSpecs,
  reviewSummaries,
  reviews,
  sensorFormats,
  staffVerdicts,
  useCaseRatings,
  users,
} from "../src/server/db/schema";
import { normalizeSearchName } from "../src/lib/utils";
import {
  AF_AREA_MODES,
  BRANDS,
  GENRES,
  MOUNTS,
  SENSOR_FORMATS,
} from "../src/lib/generated";

type BrandRow = typeof brands.$inferSelect;
type MountRow = typeof mounts.$inferSelect;
type SensorFormatRow = typeof sensorFormats.$inferSelect;
type GenreRow = typeof genresTable.$inferSelect;
type AfAreaModeRow = typeof afAreaModes.$inferSelect;

type SeedContext = {
  brandBySlug: Map<string, BrandRow>;
  brandByConstantId: Map<string, BrandRow>;
  mountsByValue: Map<string, MountRow>;
  sensorFormatsBySlug: Map<string, SensorFormatRow>;
  genresBySlug: Map<string, GenreRow>;
  afAreaModesByKey: Map<string, AfAreaModeRow>;
};

type ReviewSeed = {
  user: {
    name: string;
    email: string;
  };
  review: {
    content: string;
    recommend: boolean | null;
    genres?: string[];
  };
};

type SeedOptions = {
  skipTaxonomy?: boolean;
  skipEditorial?: boolean;
  skipReviews?: boolean;
  confirmSeed?: boolean;
  allowGearOverwrite?: boolean;
};

function parseCliOptions(argv: string[]): SeedOptions {
  const args: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const value = argv[i];
    if (!value?.startsWith("--")) continue;
    const body = value.slice(2);
    if (!body) continue;
    if (body.includes("=")) {
      const [kRaw, raw] = body.split("=", 2);
      const key = kRaw ?? "";
      args[key] = raw ?? "";
    } else {
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[body] = next;
        i++;
      } else {
        args[body] = true;
      }
    }
  }

  const toBool = (input: unknown) => {
    if (input === undefined) return false;
    if (typeof input === "boolean") return input;
    if (typeof input === "number") return input !== 0;
    const normalized = String(input).toLowerCase();
    return ["1", "true", "yes", "y"].includes(normalized);
  };

  return {
    skipTaxonomy: toBool(args["skip-taxonomy"] ?? args["skipTaxonomy"]),
    skipEditorial: toBool(args["skip-editorial"] ?? args["skipEditorial"]),
    skipReviews: toBool(args["skip-reviews"] ?? args["skipReviews"]),
    confirmSeed: toBool(args["confirm-seed"] ?? args["confirmSeed"]),
    allowGearOverwrite: toBool(
      args["allow-gear-overwrite"] ?? args["allowGearOverwrite"],
    ),
  };
}

const log = (message: string, payload?: Record<string, unknown>) => {
  if (payload) {
    console.log(`[seed] ${message}`, payload);
    return;
  }
  console.log(`[seed] ${message}`);
};

const slugifyStrict = (value: string) =>
  slugify(value, { lower: true, strict: true });

const afModeKey = (brandId: string | null, name: string) =>
  `${brandId ?? "unscoped"}::${name.toLowerCase()}`;

async function main() {
  const options = parseCliOptions(process.argv);
  if (!options.confirmSeed) {
    console.error(
      "[seed] Missing --confirm-seed flag. Aborting to prevent accidental production writes.",
    );
    process.exit(1);
  }
  log("starting seed (constants + Nikon Z6 III)", options);
  const context = await seedTaxonomyFromGenerated({
    skipWrites: options.skipTaxonomy,
  });
  await seedNikonZ6III(context, options);
  await seedAdditionalCameras(context, options);
  log("seed complete");
}

async function seedTaxonomyFromGenerated(opts?: {
  skipWrites?: boolean;
}): Promise<SeedContext> {
  const skipWrites = Boolean(opts?.skipWrites);
  const brandBySlug = new Map<string, BrandRow>();
  const brandByConstantId = new Map<string, BrandRow>();
  for (const brandSeed of BRANDS) {
    const row = {
      id: brandSeed.id,
      name: brandSeed.name,
      slug: brandSeed.slug,
    };
    const existing = await db
      .select()
      .from(brands)
      .where(eq(brands.slug, row.slug))
      .limit(1);
    let record: BrandRow;
    if (skipWrites) {
      if (!existing[0]) {
        throw new Error(
          `Brand ${row.slug} missing while --skip-taxonomy flag is active.`,
        );
      }
      record = existing[0]!;
    } else if (existing[0]) {
      record = existing[0]!;
    } else {
      await db
        .insert(brands)
        .values(row)
        .onConflictDoNothing({ target: brands.slug });
      const [inserted] = await db
        .select()
        .from(brands)
        .where(eq(brands.slug, row.slug))
        .limit(1);
      record = inserted!;
    }
    brandBySlug.set(record.slug, record);
    brandByConstantId.set(brandSeed.id, record);
  }
  log("brands ready", { count: brandBySlug.size });

  const mountsByValue = new Map<string, MountRow>();
  for (const mountSeed of MOUNTS) {
    const mappedBrand =
      mountSeed.brand_id === null
        ? null
        : (brandByConstantId.get(mountSeed.brand_id) ?? null);
    const row = {
      id: mountSeed.id,
      value: mountSeed.value,
      brandId: mappedBrand?.id ?? mountSeed.brand_id ?? null,
      shortName: mountSeed.short_name ?? null,
    };
    const existing = await db
      .select()
      .from(mounts)
      .where(eq(mounts.value, row.value))
      .limit(1);
    let record: MountRow;
    if (skipWrites) {
      if (!existing[0]) {
        throw new Error(
          `Mount ${row.value} missing while --skip-taxonomy flag is active.`,
        );
      }
      record = existing[0]!;
    } else if (existing[0]) {
      record = existing[0]!;
    } else {
      await db
        .insert(mounts)
        .values(row)
        .onConflictDoNothing({ target: mounts.value });
      const [inserted] = await db
        .select()
        .from(mounts)
        .where(eq(mounts.value, row.value))
        .limit(1);
      record = inserted!;
    }
    mountsByValue.set(record.value, record);
  }
  log("mounts ready", { count: mountsByValue.size });

  const sensorFormatsBySlug = new Map<string, SensorFormatRow>();
  for (const format of SENSOR_FORMATS) {
    const row = {
      id: format.id,
      name: format.name,
      slug: format.slug,
      cropFactor: format.crop_factor,
      description: format.description ?? null,
    };
    const existing = await db
      .select()
      .from(sensorFormats)
      .where(eq(sensorFormats.slug, row.slug))
      .limit(1);
    let record: SensorFormatRow;
    if (skipWrites) {
      if (!existing[0]) {
        throw new Error(
          `Sensor format ${row.slug} missing while --skip-taxonomy flag is active.`,
        );
      }
      record = existing[0]!;
    } else if (existing[0]) {
      record = existing[0]!;
    } else {
      await db
        .insert(sensorFormats)
        .values(row)
        .onConflictDoNothing({ target: sensorFormats.slug });
      const [inserted] = await db
        .select()
        .from(sensorFormats)
        .where(eq(sensorFormats.slug, row.slug))
        .limit(1);
      record = inserted!;
    }
    sensorFormatsBySlug.set(record.slug, record);
  }
  log("sensor formats ready", { count: sensorFormatsBySlug.size });

  const genresBySlug = new Map<string, GenreRow>();
  for (const genreSeed of GENRES) {
    const row = {
      id: genreSeed.id,
      name: genreSeed.name,
      slug: genreSeed.slug,
      description: genreSeed.description ?? null,
      appliesTo:
        genreSeed.applies_to && genreSeed.applies_to.length > 0
          ? genreSeed.applies_to
          : null,
    };
    const existing = await db
      .select()
      .from(genresTable)
      .where(eq(genresTable.slug, row.slug))
      .limit(1);
    let record: GenreRow;
    if (skipWrites) {
      if (!existing[0]) {
        throw new Error(
          `Genre ${row.slug} missing while --skip-taxonomy flag is active.`,
        );
      }
      record = existing[0]!;
    } else if (existing[0]) {
      record = existing[0]!;
    } else {
      await db
        .insert(genresTable)
        .values(row)
        .onConflictDoNothing({ target: genresTable.slug });
      const [inserted] = await db
        .select()
        .from(genresTable)
        .where(eq(genresTable.slug, row.slug))
        .limit(1);
      record = inserted!;
    }
    genresBySlug.set(record.slug, record);
  }
  log("genres ready", { count: genresBySlug.size });

  const afAreaModesByKey = new Map<string, AfAreaModeRow>();
  for (const modeSeed of AF_AREA_MODES) {
    const mappedBrand =
      modeSeed.brand_id === null
        ? null
        : (brandByConstantId.get(modeSeed.brand_id) ?? null);
    const row = {
      id: modeSeed.id,
      name: modeSeed.name,
      searchName: (modeSeed.search_name ?? modeSeed.name).toLowerCase(),
      description: modeSeed.description ?? null,
      brandId: mappedBrand?.id ?? modeSeed.brand_id ?? null,
      aliases: Array.isArray(modeSeed.aliases) ? modeSeed.aliases : null,
    };
    let record: AfAreaModeRow | undefined;
    const existing = await db
      .select()
      .from(afAreaModes)
      .where(
        row.brandId
          ? and(
              eq(afAreaModes.name, row.name),
              eq(afAreaModes.brandId, row.brandId),
            )
          : and(eq(afAreaModes.name, row.name), isNull(afAreaModes.brandId)),
      )
      .limit(1);
    if (skipWrites) {
      if (!existing[0]) {
        throw new Error(
          `AF area mode ${row.name} (${row.brandId ?? "unscoped"}) missing while --skip-taxonomy flag is active.`,
        );
      }
      record = existing[0]!;
    } else if (existing[0]) {
      record = existing[0]!;
    } else {
      const [inserted] = await db.insert(afAreaModes).values(row).returning();
      record = inserted!;
    }
    afAreaModesByKey.set(
      afModeKey(record.brandId ?? null, record.name),
      record,
    );
  }
  log("AF area modes ready", { count: afAreaModesByKey.size });

  return {
    brandBySlug,
    brandByConstantId,
    mountsByValue,
    sensorFormatsBySlug,
    genresBySlug,
    afAreaModesByKey,
  };
}

async function seedNikonZ6III(context: SeedContext, options: SeedOptions = {}) {
  const brand = context.brandBySlug.get("nikon");
  if (!brand)
    throw new Error("Nikon brand missing. Run generated constant sync.");

  const zMount = context.mountsByValue.get("z-nikon");
  if (!zMount)
    throw new Error("Mount z-nikon missing. Run generated constant sync.");

  const fullFrame = context.sensorFormatsBySlug.get("full-frame");
  if (!fullFrame) {
    throw new Error(
      "Sensor format full-frame missing. Run generated constant sync.",
    );
  }

  const liveZ6iii = {
    id: "ec11113e-ae24-44cb-871f-4eb763d2d378",
    slug: "nikon-z6iii",
    searchName: "nikon z6iii",
    name: "Nikon Z6III",
    releaseDateIso: "2024-06-24T00:00:00.000Z",
    announcedDateIso: "2024-06-17T00:00:00.000Z",
    msrpNowUsdCents: 239_995,
    msrpAtLaunchUsdCents: 249_995,
    thumbnailUrl:
      "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTn2SorD1z6O32XrPx7o8HylnZ4eJQftjDF6dG0",
    weightGrams: 760,
    widthMm: 138.5,
    heightMm: 101.0,
    depthMm: 74.0,
    mpbMaxPriceUsdCents: 219_900,
    linkManufacturer:
      "https://imaging.nikon.com/imaging/lineup/mirrorless/z6_3/",
    linkMpb: "https://www.mpb.com/en-us/product/nikon-z6-iii",
    linkAmazon:
      "https://www.amazon.com/Nikon-Full-Frame-mirrorless-Internal-Recording/dp/B0D77SL8CY?psc=1",
    genres: ["video", "sports", "wildlife"],
  } as const;

  const gearName = liveZ6iii.name;
  const gearSlug = liveZ6iii.slug || slugifyStrict(gearName);
  const gearGenreSlugs = liveZ6iii.genres;

  const { record: gearRow, mutated: gearMutated } = await upsertGearRow(
    {
      id: liveZ6iii.id,
      slug: gearSlug,
      name: gearName,
      searchName:
        liveZ6iii.searchName || normalizeSearchName(gearName, brand.name),
      gearType: "CAMERA",
      brandId: brand.id,
      mountId: zMount.id,
      announcedDate: new Date(liveZ6iii.announcedDateIso),
      releaseDate: new Date(liveZ6iii.releaseDateIso),
      releaseDatePrecision: "DAY",
      announceDatePrecision: "DAY",
      msrpNowUsdCents: liveZ6iii.msrpNowUsdCents,
      msrpAtLaunchUsdCents: liveZ6iii.msrpAtLaunchUsdCents,
      weightGrams: liveZ6iii.weightGrams,
      widthMm: String(liveZ6iii.widthMm),
      heightMm: String(liveZ6iii.heightMm),
      depthMm: String(liveZ6iii.depthMm),
      mpbMaxPriceUsdCents: liveZ6iii.mpbMaxPriceUsdCents,
      linkManufacturer: liveZ6iii.linkManufacturer,
      linkMpb: liveZ6iii.linkMpb,
      linkAmazon: liveZ6iii.linkAmazon,
      thumbnailUrl: liveZ6iii.thumbnailUrl,
      notes: [],
      genres: gearGenreSlugs,
    },
    options.allowGearOverwrite ?? false,
  );

  if (!gearMutated) {
    log(
      "Gear already exists and --allow-gear-overwrite not set; skipping dependent seeds to avoid destructive changes.",
    );
    return;
  }

  await db.delete(gearMounts).where(eq(gearMounts.gearId, gearRow.id));
  await db
    .insert(gearMounts)
    .values({ gearId: gearRow.id, mountId: zMount.id });

  await db.delete(gearGenres).where(eq(gearGenres.gearId, gearRow.id));
  const genreJoins = gearGenreSlugs
    .map((slug) => context.genresBySlug.get(slug))
    .filter((g): g is GenreRow => Boolean(g))
    .map((genre) => ({
      gearId: gearRow.id,
      genreId: genre.id,
    }));
  if (genreJoins.length) {
    await db.insert(gearGenres).values(genreJoins);
  }

  await db.delete(cameraSpecs).where(eq(cameraSpecs.gearId, gearRow.id));
  const cameraSpecPayload: typeof cameraSpecs.$inferInsert = {
    gearId: gearRow.id,
    sensorFormatId: fullFrame.id,
    resolutionMp: "24.5",
    sensorStackingType: "partially-stacked",
    sensorTechType: "cmos",
    isBackSideIlluminated: true,
    isoMin: 100,
    isoMax: 204800,
    maxRawBitDepth: "14",
    hasIbis: true,
    hasElectronicVibrationReduction: true,
    cipaStabilizationRatingStops: "8.0",
    hasPixelShiftShooting: true,
    cameraType: "mirrorless",
    processorName: "Expeed 7",
    hasWeatherSealing: true,
    focusPoints: 273,
    afSubjectCategories: ["people", "animals", "vehicles", "birds"],
    hasFocusPeaking: true,
    hasFocusBracketing: true,
    shutterSpeedMax: 8000,
    shutterSpeedMin: 30,
    maxFpsRaw: "20",
    maxFpsJpg: "120",
    hasSilentShootingAvailable: true,
    availableShutterTypes: ["mechanical", "electronic"],
    cipaBatteryShotsPerCharge: 390,
    supportedBatteries: ["EN-EL15c"],
    usbPowerDelivery: true,
    usbCharging: true,
    hasLogColorProfile: true,
    has10BitVideo: true,
    hasOpenGateVideo: false,
    hasIntervalometer: true,
    hasSelfTimer: true,
    hasBuiltInFlash: false,
    hasHotShoe: true,
    hasUsbFileTransfer: true,
    rearDisplayType: "dual_axis_tilt",
    rearDisplayResolutionMillionDots: "2.1",
    rearDisplaySizeInches: "3.2",
    hasRearTouchscreen: true,
    viewfinderType: "electronic",
    viewfinderMagnification: "0.8",
    viewfinderResolutionMillionDots: "5.76",
    hasTopDisplay: false,
    extra: {
      burstModes: ["High-Speed Capture 60 fps JPEG", "20 fps RAW"],
      subjectDetection: "People / animals / vehicles with eye detection",
    },
  };
  await db.insert(cameraSpecs).values(cameraSpecPayload);

  const nikonAfModes = [
    "Pinpoint AF",
    "Single Point AF",
    "Dynamic Area AF (Small)",
    "Dynamic Area AF (Large)",
    "Wide Area AF (Small)",
    "Wide Area AF (Large)",
    "Subject Tracking AF",
    "Auto-area AF",
  ];
  await db
    .delete(cameraAfAreaSpecs)
    .where(eq(cameraAfAreaSpecs.gearId, gearRow.id));
  const afRecords = nikonAfModes
    .map((name) => {
      const key = afModeKey(brand.id, name);
      return (
        context.afAreaModesByKey.get(key) ??
        context.afAreaModesByKey.get(afModeKey(null, name))
      );
    })
    .filter((mode): mode is AfAreaModeRow => Boolean(mode))
    .map((mode) => ({ gearId: gearRow.id, afAreaModeId: mode.id }));
  if (afRecords.length) {
    await db.insert(cameraAfAreaSpecs).values(afRecords);
  }

  if (options.skipEditorial) {
    log("skip-editorial flag detected; skipping staff verdict + ratings.");
  } else {
    await seedEditorialData(gearRow.id, context);
  }

  if (options.skipReviews) {
    log("skip-reviews flag detected; skipping sample reviews + summary.");
  } else {
    await seedReviewsAndSummary(gearRow.id, gearRow.name);
  }

  log("Nikon Z6 III seeded", {
    gearId: gearRow.id,
    slug: gearRow.slug,
  });
}

type CameraFixture = {
  key: string;
  brandSlug: string;
  mountValue: string;
  data: Omit<typeof gear.$inferInsert, "brandId" | "mountId"> & {
    genres?: string[];
  };
  specs?: Partial<typeof cameraSpecs.$inferInsert>;
};

type LensFixture = {
  key: string;
  brandSlug: string;
  mountValue: string;
  data: Omit<typeof gear.$inferInsert, "brandId" | "mountId"> & {
    genres?: string[];
  };
  lensSpecs?: Partial<typeof lensSpecs.$inferInsert>;
};

async function seedAdditionalCameras(
  context: SeedContext,
  options: SeedOptions,
) {
  const fixtures: CameraFixture[] = [
    {
      key: "canon-eos-r6-mark-iii",
      brandSlug: "canon",
      mountValue: "rf-canon",
      data: {
        id: "63db1ed1-374e-475b-a6fd-297a54c07ebc",
        slug: "canon-eos-r6-mark-iii",
        name: "Canon EOS R6 Mark III",
        searchName: "canon eos r6 mark iii",
        gearType: "CAMERA",
        announcedDate: new Date("2025-11-06T00:00:00.000Z"),
        releaseDate: new Date("2025-11-25T00:00:00.000Z"),
        announceDatePrecision: "DAY",
        releaseDatePrecision: "DAY",
        msrpNowUsdCents: 279900,
        msrpAtLaunchUsdCents: 279900,
        thumbnailUrl:
          "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTnmI55Kb8NBfTn68UzcGl7jKdovRxmIyCpLMVq",
        weightGrams: 699,
        widthMm: "138.4",
        heightMm: "98.4",
        depthMm: "88.4",
        linkManufacturer: "https://www.usa.canon.com/shop/p/eos-r6-mark-iii",
        linkMpb: null,
        linkAmazon: null,
        genres: ["weddings", "video", "events"],
        notes: [
          "LP-E6N and LP-E6NH batteries are supported but with performance limitations.",
        ],
      },
      specs: {
        sensorFormatId: context.sensorFormatsBySlug.get("full-frame")?.id,
        resolutionMp: "24.2",
        isoMin: 100,
        isoMax: 102400,
        maxFpsRaw: "12",
        maxFpsJpg: "40",
        hasIbis: true,
        hasLogColorProfile: true,
        cameraType: "mirrorless",
        hasRearTouchscreen: true,
        rearDisplayType: "fully_articulated",
        usbCharging: true,
        hasWeatherSealing: true,
        availableShutterTypes: ["mechanical", "electronic"],
      },
    },
    {
      key: "nikon-zr",
      brandSlug: "nikon",
      mountValue: "z-nikon",
      data: {
        id: "0dbea6f8-d5f3-4cc2-9f8b-a638f0bc11f1",
        slug: "nikon-zr",
        name: "Nikon Zr",
        searchName: "nikon zr",
        gearType: "CAMERA",
        announcedDate: new Date("2025-09-10T00:00:00.000Z"),
        releaseDate: new Date("2025-10-03T00:00:00.000Z"),
        announceDatePrecision: "DAY",
        releaseDatePrecision: "DAY",
        msrpNowUsdCents: 219995,
        msrpAtLaunchUsdCents: 219995,
        thumbnailUrl:
          "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTniGQCYXd0sEY4jOWCMLxAhc2V3foDgvXF9SKp",
        weightGrams: 630,
        widthMm: "133",
        heightMm: "80.5",
        depthMm: "48.7",
        linkManufacturer: "https://www.nikonusa.com/p/zr/2006/overview",
        linkMpb: "https://www.mpb.com/en-us/product/nikon-zr",
        linkAmazon: null,
        genres: ["video", "travel", "weddings"],
        notes: [
          "9.4ms sensor readout speed in 6k25 video recording, 6.3ms in 4k120 (Source: Cined)",
          "5.4k video replaces 6k video for less-than-raw codecs",
        ],
      },
      specs: {
        sensorFormatId: context.sensorFormatsBySlug.get("full-frame")?.id,
        resolutionMp: "30.3",
        isoMin: 64,
        isoMax: 204800,
        maxFpsRaw: "15",
        maxFpsJpg: "60",
        hasIbis: true,
        hasLogColorProfile: true,
        has10BitVideo: true,
        cameraType: "mirrorless",
        hasRearTouchscreen: true,
        rearDisplayType: "dual_axis_tilt",
        usbCharging: true,
        hasWeatherSealing: true,
        availableShutterTypes: ["mechanical", "electronic"],
      },
    },
  ];

  for (const fixture of fixtures) {
    const brand = context.brandBySlug.get(fixture.brandSlug);
    if (!brand) {
      log(`Skipping ${fixture.key}; brand ${fixture.brandSlug} missing.`);
      continue;
    }
    const mount = context.mountsByValue.get(fixture.mountValue);
    if (!mount) {
      log(`Skipping ${fixture.key}; mount ${fixture.mountValue} missing.`);
      continue;
    }

    const gearInput: typeof gear.$inferInsert = {
      ...fixture.data,
      brandId: brand.id,
      mountId: mount.id,
    };

    const { record: gearRow, mutated } = await upsertGearRow(
      gearInput,
      options.allowGearOverwrite ?? false,
    );

    if (!mutated) {
      log(
        `Fixture ${fixture.key} already present; rerun with --allow-gear-overwrite to refresh.`,
      );
      continue;
    }

    // Ensure mount relationship
    await db
      .insert(gearMounts)
      .values({ gearId: gearRow.id, mountId: mount.id })
      .onConflictDoNothing({ target: [gearMounts.gearId, gearMounts.mountId] });

    // Ensure genre relationships
    const genreSlugs = fixture.data.genres ?? [];
    if (genreSlugs.length) {
      const rows = genreSlugs
        .map((slug) => context.genresBySlug.get(slug))
        .filter((g): g is GenreRow => Boolean(g))
        .map((genre) => ({ gearId: gearRow.id, genreId: genre.id }));
      if (rows.length) {
        await db
          .insert(gearGenres)
          .values(rows)
          .onConflictDoNothing({
            target: [gearGenres.gearId, gearGenres.genreId],
          });
      }
    }

    if (fixture.specs) {
      await db
        .insert(cameraSpecs)
        .values({
          gearId: gearRow.id,
          ...fixture.specs,
        })
        .onConflictDoNothing({ target: cameraSpecs.gearId });
    }

    log(`Seeded fixture ${fixture.key}`, { gearId: gearRow.id });
  }

  const lensFixtures: LensFixture[] = [
    {
      key: "nikon-af-s-dx-35mm-f18",
      brandSlug: "nikon",
      mountValue: "f-nikon",
      data: {
        id: "1b98e69a-8ea3-496a-882f-b39b2563058a",
        slug: "nikon-af-s-dx-nikkor-35mm-f-1-8g",
        name: "Nikon AF-S DX NIKKOR 35mm f/1.8G",
        searchName: "nikon af-s dx nikkor 35mm f/1.8g",
        gearType: "LENS",
        announcedDate: new Date("2009-02-01T00:00:00.000Z"),
        announceDatePrecision: "MONTH",
        releaseDate: null,
        releaseDatePrecision: "DAY",
        msrpNowUsdCents: 24995,
        msrpAtLaunchUsdCents: null,
        thumbnailUrl:
          "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTn689D2vFpyoO0kbELQneSjX5xBv3H7sKI6quh",
        weightGrams: 200,
        widthMm: "70",
        heightMm: "70",
        depthMm: "52.5",
        linkManufacturer:
          "https://www.nikonusa.com/p/af-s-dx-nikkor-35mm-f18g/2183/overview",
        linkMpb:
          "https://www.mpb.com/en-us/product/nikon-af-s-dx-nikkor-35mm-f-1-8g",
        linkAmazon: null,
        genres: ["street", "video", "events"],
        notes: [],
      },
      lensSpecs: {
        isPrime: true,
        focalLengthMinMm: 35,
        focalLengthMaxMm: 35,
        maxApertureWide: "1.8",
        minApertureWide: "16",
        hasAutofocus: true,
        hasStabilization: false,
        frontFilterThreadSizeMm: 52,
      },
    },
    {
      key: "nikon-af-s-50mm-f18",
      brandSlug: "nikon",
      mountValue: "f-nikon",
      data: {
        id: "571e9a3f-8ca0-472c-b9b4-8c43acbef4a9",
        slug: "nikon-af-s-nikkor-50mm-f-1-8g",
        name: "Nikon AF-S NIKKOR 50mm f/1.8G",
        searchName: "nikon af-s nikkor 50mm f/1.8g",
        gearType: "LENS",
        announcedDate: null,
        releaseDate: null,
        announceDatePrecision: "DAY",
        releaseDatePrecision: "DAY",
        msrpNowUsdCents: 26995,
        thumbnailUrl:
          "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTn8umDG3oIBeFGP6HCUDoAXSKYlv9mWg7bOu2J",
        weightGrams: 185,
        widthMm: "72.1",
        heightMm: "72.1",
        depthMm: "52.4",
        linkManufacturer:
          "https://www.nikonusa.com/p/af-s-nikkor-50mm-f18g/2199/overview",
        linkMpb:
          "https://www.mpb.com/en-us/product/nikon-af-s-nikkor-50mm-f-1-8g",
        linkAmazon: null,
        genres: ["street", "portraits"],
        notes: [],
      },
      lensSpecs: {
        isPrime: true,
        focalLengthMinMm: 50,
        focalLengthMaxMm: 50,
        maxApertureWide: "1.8",
        minApertureWide: "16",
        hasAutofocus: true,
        hasStabilization: false,
        frontFilterThreadSizeMm: 58,
      },
    },
  ];

  for (const fixture of lensFixtures) {
    const brand = context.brandBySlug.get(fixture.brandSlug);
    if (!brand) continue;
    const mount = context.mountsByValue.get(fixture.mountValue);
    if (!mount) continue;

    const gearInput: typeof gear.$inferInsert = {
      ...fixture.data,
      brandId: brand.id,
      mountId: mount.id,
    };

    const { record: gearRow, mutated } = await upsertGearRow(
      gearInput,
      options.allowGearOverwrite ?? false,
    );

    if (!mutated) {
      log(
        `Fixture ${fixture.key} already present; rerun with --allow-gear-overwrite to refresh.`,
      );
      continue;
    }

    await db
      .insert(gearMounts)
      .values({ gearId: gearRow.id, mountId: mount.id })
      .onConflictDoNothing({ target: [gearMounts.gearId, gearMounts.mountId] });

    const genreSlugs = fixture.data.genres ?? [];
    if (genreSlugs.length) {
      const rows = genreSlugs
        .map((slug) => context.genresBySlug.get(slug))
        .filter((g): g is GenreRow => Boolean(g))
        .map((genre) => ({ gearId: gearRow.id, genreId: genre.id }));
      if (rows.length) {
        await db
          .insert(gearGenres)
          .values(rows)
          .onConflictDoNothing({
            target: [gearGenres.gearId, gearGenres.genreId],
          });
      }
    }

    if (fixture.lensSpecs) {
      await db
        .insert(lensSpecs)
        .values({
          gearId: gearRow.id,
          ...fixture.lensSpecs,
        })
        .onConflictDoNothing({ target: lensSpecs.gearId });
    }

    log(`Seeded lens fixture ${fixture.key}`, { gearId: gearRow.id });
  }
}

async function upsertGearRow(
  values: typeof gear.$inferInsert,
  allowOverwrite: boolean,
): Promise<{ record: typeof gear.$inferSelect; mutated: boolean }> {
  const existing = await db
    .select()
    .from(gear)
    .where(eq(gear.slug, values.slug))
    .limit(1);
  if (existing[0]) {
    if (!allowOverwrite) {
      return { record: existing[0]!, mutated: false };
    }
    const [updated] = await db
      .update(gear)
      .set({ ...values })
      .where(eq(gear.id, existing[0]!.id))
      .returning();
    return { record: updated ?? { ...existing[0]!, ...values }, mutated: true };
  }
  const insertQuery = db
    .insert(gear)
    .values(values)
    .onConflictDoNothing({ target: gear.slug })
    .returning();
  const [inserted] = await insertQuery;
  if (inserted) {
    return { record: inserted, mutated: true };
  }
  const [fetched] = await db
    .select()
    .from(gear)
    .where(eq(gear.slug, values.slug))
    .limit(1);
  return { record: fetched!, mutated: false };
}

async function seedEditorialData(gearId: string, context: SeedContext) {
  const ratingSeeds = [
    {
      genre: "sports",
      score: 9,
      note: "Excellent AF tracking and 20 fps RAW bursts make it a reliable sideline camera.",
    },
    {
      genre: "wildlife",
      score: 9,
      note: "Silent shooting, subject recognition, and long battery life keep up with wildlife trips.",
    },
    {
      genre: "landscape",
      score: 8,
      note: "Great dynamic range and pixel-shift composites provide flexible landscape output.",
    },
    {
      genre: "portraits",
      score: 7,
      note: "Color science is pleasing though single card slot limits redundancy.",
    },
  ];

  await db.delete(useCaseRatings).where(eq(useCaseRatings.gearId, gearId));
  const ratingRows = ratingSeeds
    .map((seed) => {
      const genreRow = context.genresBySlug.get(seed.genre);
      if (!genreRow) {
        log("missing genre for use-case rating; skipping", {
          slug: seed.genre,
        });
        return null;
      }
      return {
        gearId,
        genreId: genreRow.id,
        score: seed.score,
        note: seed.note,
      };
    })
    .filter(
      (
        row,
      ): row is {
        gearId: string;
        genreId: string;
        score: number;
        note: string;
      } => Boolean(row),
    );
  if (ratingRows.length) {
    await db.insert(useCaseRatings).values(ratingRows);
  }

  const verdictContent = {
    content: `The Nikon Z6 III represents a major leap for Nikon's mid-range mirrorless line. Its stacked 24.5MP sensor delivers clean files, fast readout speeds, and excellent autofocus coverage that rivals flagship bodies.

With subject detection improvements, dual CFexpress/SD card slots, and 6K oversampled video, it is a true hybrid camera that can move from photo to video work without compromise.`,
    pros: [
      "20 fps RAW and 60 fps JPEG capture modes",
      "Reliable subject detection across people, vehicles, and wildlife",
      "Robust weather sealing and deep grip",
      "Internal 10-bit N-Log and HLG video profiles",
      "Pixel-shift for 60MP composites",
    ],
    cons: [
      "Buffer clears slower when using SD slot only",
      "No fully articulating display (dual-axis tilt only)",
      "Menu system still dense for newcomers",
    ],
    whoFor:
      "Photographers who split time between action, wildlife, and documentary projects while needing strong video tools.",
    notFor:
      "Users who demand 8K video workflows or prefer the simplicity of a single exposure mode dial.",
    alternatives: [
      "Sony A7 IV – more mature lens ecosystem and 4K60 across the lineup",
      "Canon R6 Mark II – faster burst with a deeper buffer for sports",
      "Nikon Z7 II – higher resolution for landscape-first shooters",
    ],
  };

  await db
    .insert(staffVerdicts)
    .values({
      gearId,
      content: verdictContent.content,
      pros: verdictContent.pros,
      cons: verdictContent.cons,
      whoFor: verdictContent.whoFor,
      notFor: verdictContent.notFor,
      alternatives: verdictContent.alternatives,
    })
    .onConflictDoUpdate({
      target: staffVerdicts.gearId,
      set: {
        content: verdictContent.content,
        pros: verdictContent.pros,
        cons: verdictContent.cons,
        whoFor: verdictContent.whoFor,
        notFor: verdictContent.notFor,
        alternatives: verdictContent.alternatives,
        updatedAt: new Date(),
      },
    });
}

async function seedReviewsAndSummary(gearId: string, gearName: string) {
  const reviewSeeds: ReviewSeed[] = [
    {
      user: {
        name: "Sharply Seed Reviewer",
        email: "seed.reviewer+1@sharply.dev",
      },
      review: {
        content:
          "I took the Z6 III to Yellowstone for a week and the combo of subject tracking plus the lightweight Z 400/4.5 made wildlife work effortless. The new tilt screen is handy for low angles, and high ISO files are clean through 12800.",
        recommend: true,
        genres: ["wildlife", "travel"],
      },
    },
    {
      user: {
        name: "Sharply Hybrid Shooter",
        email: "seed.reviewer+2@sharply.dev",
      },
      review: {
        content:
          "As a wedding + doc shooter I appreciate the internal 10-bit profiles and ability to switch between 6K oversampled and 4K60. Buffer slows a bit in RAW bursts when you rely on SD cards, but overall it feels like a mini Z8.",
        recommend: true,
        genres: ["weddings", "video"],
      },
    },
  ];

  for (const seed of reviewSeeds) {
    const user = await ensureUser(seed.user);
    await db
      .delete(reviews)
      .where(and(eq(reviews.gearId, gearId), eq(reviews.createdById, user.id)));

    await db.insert(reviews).values({
      gearId,
      createdById: user.id,
      status: "APPROVED",
      content: seed.review.content,
      recommend: seed.review.recommend,
      genres: seed.review.genres ?? null,
    });
  }

  const summaryText = `Across the first wave of field reports, Nikon's Z6 III earns praise for dependable autofocus, strong low-light files, and hybrid-friendly video specs. Reviewers highlight its 20 fps RAW bursts, subject tracking that keeps up with erratic wildlife, and 6K oversampled video with internal 10-bit recording. The dual card slots (CFexpress Type B + SD) provide flexibility, though the buffer slows when limited to SD media. Overall it balances speed, image quality, and ergonomics in a body that travels lighter than the Z8.`;

  await db
    .insert(reviewSummaries)
    .values({
      gearId,
      summaryText,
    })
    .onConflictDoUpdate({
      target: reviewSummaries.gearId,
      set: { summaryText, updatedAt: new Date() },
    });
}

async function ensureUser(userSeed: ReviewSeed["user"]) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, userSeed.email))
    .limit(1);
  if (existing[0]) {
    if (existing[0]!.name !== userSeed.name) {
      const [updated] = await db
        .update(users)
        .set({ name: userSeed.name })
        .where(eq(users.id, existing[0]!.id))
        .returning();
      return updated ?? existing[0]!;
    }
    return existing[0]!;
  }
  const [inserted] = await db
    .insert(users)
    .values({
      name: userSeed.name,
      email: userSeed.email,
      role: "EDITOR",
    })
    .returning();
  return inserted!;
}

main().catch((error) => {
  console.error("[seed] failed", error);
  process.exit(1);
});
