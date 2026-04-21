import { describe,expect,it } from "vitest";

import {
  getLanguageMarketOptionForLocale,
  resolveLocaleFromCountryCode,
} from "~/lib/locale/locales";

describe("locale market detection", () => {
  it("resolves dedicated MPB countries to their own markets", () => {
    expect(resolveLocaleFromCountryCode("DE").id).toBe("de");
    expect(resolveLocaleFromCountryCode("FR").id).toBe("fr");
    expect(resolveLocaleFromCountryCode("ES").id).toBe("es");
    expect(resolveLocaleFromCountryCode("IT").id).toBe("it");
    expect(resolveLocaleFromCountryCode("GB").id).toBe("uk");
  });

  it("resolves Malaysia and Japan to their dedicated locale options", () => {
    expect(resolveLocaleFromCountryCode("MY").id).toBe("my");
    expect(resolveLocaleFromCountryCode("JP").id).toBe("jp");
  });

  it("resolves other European countries to the generic Europe market", () => {
    expect(resolveLocaleFromCountryCode("NL").id).toBe("eu");
    expect(resolveLocaleFromCountryCode("BE").id).toBe("eu");
    expect(resolveLocaleFromCountryCode("AT").id).toBe("eu");
    expect(resolveLocaleFromCountryCode("SE").id).toBe("eu");
  });

  it("maps english plus the europe market to the europe english option", () => {
    expect(getLanguageMarketOptionForLocale("en", "eu").id).toBe("en-eu");
  });

  it("maps Malay plus Malaysia to the Malaysia language-market option", () => {
    expect(getLanguageMarketOptionForLocale("ms", "my").id).toBe("ms-my");
  });
});
