import { describe, expect, it } from "vitest";
import {
  buildTagPageMetadata,
  resolveTagPageMetadata,
} from "~/lib/tags/tag-page-metadata";

describe("buildTagPageMetadata", () => {
  it("prioritizes editorial page copy over fallback tag fields", () => {
    const metadata = buildTagPageMetadata(
      "wildlife",
      {
        name: "Wildlife",
        pageTitle: "Wildlife photography gear",
        pageContent: "  Curated gear\nfor photographing wildlife.  ",
        description: "Short tag description.",
      },
      "Browse photography gear tagged Wildlife.",
    );

    expect(metadata.title).toBe("Wildlife photography gear");
    expect(metadata.description).toBe(
      "Curated gear for photographing wildlife.",
    );
    expect(metadata.openGraph).toMatchObject({
      title: "Wildlife photography gear",
      description: "Curated gear for photographing wildlife.",
    });
  });

  it("falls back to the tag name and localized summary", () => {
    const metadata = buildTagPageMetadata(
      "wildlife",
      {
        name: "Wildlife",
        pageTitle: null,
        pageContent: null,
        description: null,
      },
      "Browse photography gear tagged Wildlife.",
    );

    expect(metadata.title).toBe("Wildlife");
    expect(metadata.description).toBe(
      "Browse photography gear tagged Wildlife.",
    );
  });

  it("normalizes the editor preview values before saving", () => {
    expect(
      resolveTagPageMetadata(
        {
          name: " Wildlife ",
          pageTitle: "  Wildlife photography gear  ",
          pageContent: " ",
          description: "  Gear for animal photography.  ",
        },
        "Browse photography gear tagged Wildlife.",
      ),
    ).toEqual({
      title: "Wildlife photography gear",
      description: "Gear for animal photography.",
    });
  });
});
