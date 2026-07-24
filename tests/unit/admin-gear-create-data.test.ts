import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  selectResults: [] as unknown[][],
  insertValues: [] as Array<{ table: unknown; payload: unknown }>,
}));

function createSelectBuilder(result: unknown[]) {
  const builder = {
    from: vi.fn(() => builder),
    where: vi.fn(() => builder),
    limit: vi.fn(() => Promise.resolve(result)),
    then: (
      resolve: (value: unknown[]) => unknown,
      reject?: (error: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

const dbMocks = vi.hoisted(() => ({
  select: vi.fn(() => {
    const result = dbState.selectResults.shift() ?? [];
    return createSelectBuilder(result);
  }),
  transaction: vi.fn(async (callback: (tx: unknown) => unknown) => {
    const tx = {
      insert: vi.fn((table: unknown) => ({
        values: vi.fn((payload: unknown) => {
          dbState.insertValues.push({ table, payload });
          return {
            returning: vi.fn(() =>
              Promise.resolve([{ id: "gear-1", slug: "nikon-z-60mm-f-2-8" }]),
            ),
          };
        }),
      })),
    };
    return callback(tx);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/db", () => ({
  db: dbMocks,
}));

import { createGearData } from "~/server/admin/gear/data";

describe("createGearData bulk import initial values", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.selectResults = [];
    dbState.insertValues = [];
  });

  it("writes multiple mounts and initial lens specs in the creation transaction", async () => {
    dbState.selectResults = [
      [{ id: "brand-nikon", name: "Nikon" }],
      [{ id: "mount-z" }, { id: "mount-e" }],
      [],
    ];

    const result = await createGearData({
      name: "Nikon Nikkor Z 60mm f/2.8",
      brandId: "brand-nikon",
      gearType: "LENS",
      mountIds: ["mount-z", "mount-e"],
      initialCore: {
        releaseDate: "2024-01-02",
        msrpNowUsdCents: 99995,
        weightGrams: 630,
        notes: ["Imported from CSV"],
      },
      initialLensSpecs: {
        isPrime: true,
        focalLengthMinMm: 60,
        focalLengthMaxMm: 60,
        maxApertureWide: 2.8,
        hasAutofocus: true,
      },
    });

    expect(result).toEqual({ id: "gear-1", slug: "nikon-z-60mm-f-2-8" });
    expect(dbState.insertValues[0]?.payload).toMatchObject({
      name: "Nikon Nikkor Z 60mm f/2.8",
      brandId: "brand-nikon",
      mountId: "mount-z",
      msrpNowUsdCents: 99995,
      weightGrams: 630,
      notes: ["Imported from CSV"],
    });
    expect(dbState.insertValues[1]?.payload).toEqual([
      { gearId: "gear-1", mountId: "mount-z" },
      { gearId: "gear-1", mountId: "mount-e" },
    ]);
    expect(dbState.insertValues[2]?.payload).toMatchObject({
      gearId: "gear-1",
      isPrime: true,
      focalLengthMinMm: 60,
      focalLengthMaxMm: 60,
      maxApertureWide: 2.8,
      hasAutofocus: true,
    });
  });
});
