import { describe,expect,it } from "vitest";
import {
  buildGearSearchName,
  GetGearDisplayName,
} from "~/lib/gear/naming";
import { resolveRegionFromCountryCode } from "~/lib/gear/region";
import type { GearAlias } from "~/types/gear";

const aliases = [
  { region: "US", name: "Rokinon AF 35mm F1.8" },
  { region: "EU", name: "Samyang AF 35mm F1.8" },
  { region: "JP", name: "Samyang AF 35mm F1.8 FE" },
] as GearAlias[];

describe("regional gear naming", () => {
  it("resolves US aliases without changing other regional behavior", () => {
    const item = { name: "Samyang AF 35mm F1.8", regionalAliases: aliases };

    expect(GetGearDisplayName(item, { region: "US" })).toBe(
      "Rokinon AF 35mm F1.8",
    );
    expect(GetGearDisplayName(item, { region: "EU" })).toBe(
      "Samyang AF 35mm F1.8",
    );
    expect(GetGearDisplayName(item, { region: "JP" })).toBe(
      "Samyang AF 35mm F1.8 FE",
    );
    expect(GetGearDisplayName(item, { region: "GLOBAL" })).toBe(
      "Samyang AF 35mm F1.8",
    );
  });

  it("falls back from a missing US alias directly to the canonical name", () => {
    expect(
      GetGearDisplayName(
        {
          name: "Canon EOS Rebel T7i",
          regionalAliases: [
            { region: "GLOBAL", name: "Unexpected global alias" },
            { region: "EU", name: "Canon EOS 800D" },
            { region: "JP", name: "Canon EOS Kiss X9i" },
          ] as GearAlias[],
        },
        { region: "US" },
      ),
    ).toBe("Canon EOS Rebel T7i");
  });

  it("maps US country codes to the US region", () => {
    expect(resolveRegionFromCountryCode("US")).toBe("US");
    expect(resolveRegionFromCountryCode(null)).toBe("GLOBAL");
    expect(resolveRegionFromCountryCode("DE")).toBe("EU");
    expect(resolveRegionFromCountryCode("JP")).toBe("JP");
  });

  it("indexes canonical and brand-independent US names together", () => {
    const searchName = buildGearSearchName({
      name: "Samyang AF 35mm F1.8",
      brandName: "Samyang",
      aliases: ["Rokinon AF 35mm F1.8"],
    });

    expect(searchName).toContain("samyang af 35mm f1 8");
    expect(searchName).toContain("rokinon af 35mm f1 8");
  });
});
