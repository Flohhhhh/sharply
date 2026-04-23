import { describe,expect,it } from "vitest";
import { MOUNTS } from "~/lib/generated";
import {
  buildGearSpecsSections,
  buildEditSidebarSections,
  type SpecTranslator,
} from "~/lib/specs/registry";
import type { GearItem } from "~/types/gear";

function createTranslator(
  messages: Record<string, string>,
): SpecTranslator {
  const translator = ((key: string) => messages[key] ?? key) as SpecTranslator;
  translator.has = (key: string) => key in messages;
  return translator;
}

function createGearItem(overrides: Partial<GearItem>): GearItem {
  return {
    id: "gear-1",
    slug: "gear-1",
    name: "Gear 1",
    brandId: null,
    gearType: "CAMERA",
    mountId: null,
    mountIds: null,
    announcedDate: null,
    announceDatePrecision: null,
    releaseDate: null,
    releaseDatePrecision: null,
    regionalAliases: null,
    cameraSpecs: null,
    analogCameraSpecs: null,
    lensSpecs: null,
    fixedLensSpecs: null,
    cameraCardSlots: null,
    videoModes: null,
    rawSamples: null,
    ...overrides,
  } as GearItem;
}

describe("spec registry i18n", () => {
  it("localizes section titles, field labels, and shared registry values", () => {
    const translator = createTranslator({
      "specRegistry.sections.camera-sensor-shutter.title": "Sensor und Verschluss",
      "specRegistry.sections.camera-sensor-shutter.fields.hasIbis.label":
        "Hat IBIS",
      "specRegistry.shared.yes": "Ja",
    });

    const item = createGearItem({
      gearType: "CAMERA",
      cameraSpecs: {
        cameraType: "mirrorless",
        hasIbis: true,
      } as GearItem["cameraSpecs"],
    });

    const sections = buildGearSpecsSections(item, {
      locale: "de",
      t: translator,
    });
    const sensorSection = sections.find(
      (section) => section.id === "camera-sensor-shutter",
    );

    expect(sensorSection?.title).toBe("Sensor und Verschluss");
    expect(
      sensorSection?.data.find((row) => row.key === "hasIbis"),
    ).toMatchObject({
      key: "hasIbis",
      label: "Hat IBIS",
      value: "Ja",
      searchTerms: expect.arrayContaining(["Has IBIS"]),
    });
  });

  it("falls back to inline English when translation keys are missing", () => {
    const item = createGearItem({
      gearType: "CAMERA",
      announcedDate: new Date("2020-01-02T00:00:00.000Z"),
      announceDatePrecision: "DAY",
    });

    const sections = buildGearSpecsSections(item, {
      locale: "fr",
      t: createTranslator({}),
    });
    const coreSection = sections.find((section) => section.id === "core");

    expect(coreSection?.title).toBe("Basic Information");
    expect(coreSection?.data.find((row) => row.key === "announcedDate")?.label).toBe(
      "Announced Date",
    );
  });

  it("uses the plural mount translation key when a lens has multiple mounts", () => {
    const [firstMount, secondMount] = MOUNTS;
    const translator = createTranslator({
      "specRegistry.sections.core.title": "Informations de base",
      "specRegistry.sections.core.fields.mounts.labelPlural": "Montures",
    });
    const item = createGearItem({
      gearType: "LENS",
      mountIds: [firstMount!.id, secondMount!.id],
    });

    const sections = buildGearSpecsSections(item, {
      locale: "fr",
      t: translator,
    });
    const coreSection = sections.find((section) => section.id === "core");
    const mountRow = coreSection?.data.find((row) => row.key === "mounts");

    expect(coreSection?.title).toBe("Informations de base");
    expect(mountRow?.label).toBe("Montures");
    expect(mountRow?.searchTerms).toEqual(
      expect.arrayContaining(["Mounts", "lens mount", "camera mount"]),
    );
  });

  it("localizes edit sidebar labels with the same fallback behavior", () => {
    const translator = createTranslator({
      "specRegistry.sections.core.title": "Grundinformationen",
      "specRegistry.sections.core.fields.announcedDate.label":
        "Ankündigungsdatum",
    });
    const item = createGearItem({
      announcedDate: new Date("2020-01-02T00:00:00.000Z"),
      announceDatePrecision: "DAY",
    });

    const sections = buildEditSidebarSections(item, {
      locale: "de",
      t: translator,
    });
    const coreSection = sections.find((section) => section.id === "core");

    expect(coreSection?.title).toBe("Grundinformationen");
    expect(coreSection?.fields.find((field) => field.key === "announcedDate"))
      .toMatchObject({
        label: "Ankündigungsdatum",
        targetId: "announced-date",
      });
  });
});
