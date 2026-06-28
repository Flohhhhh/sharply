import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/[locale]/(pages)/gear/_components/video/video-matrix-modal.tsx",
  ),
  "utf8",
);

describe("VideoMatrixModal scrolling layout", () => {
  it("uses a dedicated scroll viewport and a content-width table for wide matrices", () => {
    expect(source).toContain(
      '<DialogContent className="min-w-0 max-w-6xl sm:max-w-5xl">',
    );
    expect(source).toContain('<div className="min-w-0 space-y-6 text-sm">');
    expect(source).toContain('<div className="max-w-full min-w-0">');
    expect(source).toContain(
      '<div className="max-h-[60vh] max-w-full overflow-x-auto overflow-y-auto rounded-md border">',
    );
    expect(source).toContain('<table className="w-max min-w-full border-collapse text-sm">');
    expect(source).toContain('className="bg-background text-muted-foreground sticky top-0 z-20 min-w-[140px] px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase"');
    expect(source).toContain('className="min-w-[140px] px-2 py-2 align-top"');
  });

  it("keeps the key column pinned and leaves the legend outside the scroll viewport", () => {
    expect(source).toContain(
      'className="bg-background text-muted-foreground sticky top-0 left-0 z-30 border-r px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase shadow-[10px_0_18px_-16px_rgba(0,0,0,0.9)]"',
    );
    expect(source).toContain(
      'className="bg-background text-muted-foreground sticky left-0 z-10 border-r px-3 py-1.5 text-xs font-semibold shadow-[10px_0_18px_-16px_rgba(0,0,0,0.9)]"',
    );

    const scrollIndex = source.indexOf(
      '<div className="max-h-[60vh] max-w-full overflow-x-auto overflow-y-auto rounded-md border">',
    );
    const legendIndex = source.indexOf('<div className="text-foreground">Legend</div>');

    expect(scrollIndex).toBeGreaterThan(-1);
    expect(legendIndex).toBeGreaterThan(scrollIndex);
  });
});
