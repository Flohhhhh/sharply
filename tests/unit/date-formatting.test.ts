import { describe,expect,it } from "vitest";
import {
  formatDate,
  formatDateInputValue,
  formatDateWithPrecision,
  formatRelativeDate,
  parseDateLike,
} from "~/lib/format/date";

describe("parseDateLike", () => {
  it("accepts Date, epoch numbers, and ISO strings", () => {
    const sourceDate = new Date("2026-04-21T15:30:45.000Z");

    expect(parseDateLike(sourceDate)?.toISOString()).toBe(
      "2026-04-21T15:30:45.000Z",
    );
    expect(parseDateLike(sourceDate)).not.toBe(sourceDate);
    expect(parseDateLike(sourceDate.getTime())?.toISOString()).toBe(
      "2026-04-21T15:30:45.000Z",
    );
    expect(parseDateLike("2026-04-21T15:30:45.000Z")?.toISOString()).toBe(
      "2026-04-21T15:30:45.000Z",
    );
  });

  it("parses year-only and year-month strings at UTC midnight", () => {
    expect(parseDateLike("2026")?.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z",
    );
    expect(parseDateLike("2026-04")?.toISOString()).toBe(
      "2026-04-01T00:00:00.000Z",
    );
    expect(parseDateLike("2026-04-21")?.toISOString()).toBe(
      "2026-04-21T00:00:00.000Z",
    );
  });

  it("rejects invalid input", () => {
    expect(parseDateLike(undefined)).toBeNull();
    expect(parseDateLike(null)).toBeNull();
    expect(parseDateLike("")).toBeNull();
    expect(parseDateLike("2026-13")).toBeNull();
    expect(parseDateLike("2026-02-31")).toBeNull();
    expect(parseDateLike("not-a-date")).toBeNull();
  });
});

describe("formatDate", () => {
  const locale = "en-US";
  const value = "2026-04-21T15:30:45.000Z";

  it("formats each supported preset", () => {
    expect(formatDate(value, { locale, preset: "date-short" })).toBe("4/21/2026");
    expect(formatDate(value, { locale, preset: "date-medium" })).toBe(
      "Apr 21, 2026",
    );
    expect(formatDate(value, { locale, preset: "date-long" })).toBe(
      "April 21, 2026",
    );
    expect(formatDate(value, { locale, preset: "month-year-short" })).toBe(
      "Apr 2026",
    );
    expect(formatDate(value, { locale, preset: "month-year-long" })).toBe(
      "April 2026",
    );
    expect(formatDate(value, { locale, preset: "year" })).toBe("2026");
  });

  it("uses UTC by default and supports local time-zone formatting", () => {
    expect(formatDate(value, { locale, preset: "datetime-short" })).toContain(
      "3:30 PM",
    );
    expect(
      formatDate(value, {
        locale,
        preset: "datetime-short",
        timeZone: "local",
      }),
    ).not.toBe("");
  });

  it("returns the fallback for invalid inputs", () => {
    expect(
      formatDate("bad", {
        locale,
        preset: "date-long",
        fallback: "—",
      }),
    ).toBe("—");
  });
});

describe("formatDateWithPrecision", () => {
  const locale = "en-US";
  const value = "2026-04-21";

  it("formats full variants by precision", () => {
    expect(
      formatDateWithPrecision(value, {
        locale,
        precision: "YEAR",
      }),
    ).toBe("2026");
    expect(
      formatDateWithPrecision(value, {
        locale,
        precision: "MONTH",
      }),
    ).toBe("April 2026");
    expect(
      formatDateWithPrecision(value, {
        locale,
        precision: "DAY",
      }),
    ).toBe("April 21, 2026");
  });

  it("supports month-year variants and short month names", () => {
    expect(
      formatDateWithPrecision(value, {
        locale,
        precision: "DAY",
        variant: "month-year",
      }),
    ).toBe("April 2026");
    expect(
      formatDateWithPrecision(value, {
        locale,
        precision: "MONTH",
        monthStyle: "short",
      }),
    ).toBe("Apr 2026");
    expect(
      formatDateWithPrecision(value, {
        locale,
        precision: "DAY",
        monthStyle: "short",
      }),
    ).toBe("Apr 21, 2026");
  });
});

describe("formatRelativeDate", () => {
  const locale = "en-US";
  const now = "2026-04-21T12:00:00.000Z";

  it("returns calendar-style labels for recent dates with long auto output", () => {
    expect(
      formatRelativeDate("2026-04-21T11:59:57.000Z", {
        locale,
        now,
        justNowLabel: "just now",
      }),
    ).toBe("just now");
    expect(formatRelativeDate("2026-04-21T11:15:00.000Z", { locale, now })).toBe(
      "today",
    );
    expect(formatRelativeDate("2026-04-21T08:00:00.000Z", { locale, now })).toBe(
      "today",
    );
    expect(formatRelativeDate("2026-04-20T12:00:00.000Z", { locale, now })).toBe(
      "yesterday",
    );
    expect(formatRelativeDate("2026-04-18T12:00:00.000Z", { locale, now })).toBe(
      "3 days ago",
    );
    expect(formatRelativeDate("2026-04-13T12:00:00.000Z", { locale, now })).toBe(
      "last week",
    );
    expect(formatRelativeDate("2026-03-10T12:00:00.000Z", { locale, now })).toBe(
      "last month",
    );
  });

  it("keeps threshold-based relative units when numeric is forced", () => {
    expect(
      formatRelativeDate("2026-04-21T11:59:15.000Z", {
        locale,
        now,
        numeric: "always",
      }),
    ).toBe("45 seconds ago");
    expect(
      formatRelativeDate("2026-04-21T11:15:00.000Z", {
        locale,
        now,
        numeric: "always",
      }),
    ).toBe("45 minutes ago");
    expect(
      formatRelativeDate("2026-04-21T08:00:00.000Z", {
        locale,
        now,
        numeric: "always",
      }),
    ).toBe("4 hours ago");
    expect(
      formatRelativeDate("2026-04-20T12:00:00.000Z", {
        locale,
        now,
        numeric: "always",
      }),
    ).toBe("1 day ago");
    expect(
      formatRelativeDate("2026-02-21T12:00:00.000Z", {
        locale,
        now,
        numeric: "always",
      }),
    ).toBe("2 months ago");
    expect(formatRelativeDate("2024-04-21T12:00:00.000Z", { locale, now })).toBe(
      "2 years ago",
    );
  });

  it("supports short style output", () => {
    expect(
      formatRelativeDate("2026-04-21T10:00:00.000Z", {
        locale,
        now,
        style: "short",
      }),
    ).toBe("2 hr. ago");
  });

  it("capitalizes relative output when requested", () => {
    expect(
      formatRelativeDate("2026-04-21T11:15:00.000Z", {
        locale,
        now,
        capitalize: true,
      }),
    ).toBe("Today");
    expect(
      formatRelativeDate("2026-04-18T12:00:00.000Z", {
        locale,
        now,
        capitalize: true,
      }),
    ).toBe("3 days ago");
    expect(
      formatRelativeDate("2026-04-21T11:59:57.000Z", {
        locale,
        now,
        justNowLabel: "just now",
        capitalize: true,
      }),
    ).toBe("Just now");
  });
});

describe("formatDateInputValue", () => {
  it("converts supported inputs to YYYY-MM-DD", () => {
    expect(formatDateInputValue("2026")).toBe("2026-01-01");
    expect(formatDateInputValue("2026-04")).toBe("2026-04-01");
    expect(formatDateInputValue("2026-04-21")).toBe("2026-04-21");
    expect(formatDateInputValue("2026-04-21T15:30:45.000Z")).toBe(
      "2026-04-21",
    );
  });

  it("returns the fallback for invalid inputs", () => {
    expect(formatDateInputValue("bad", { fallback: "—" })).toBe("—");
  });
});
