import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => {
    const messages: Record<string, string> = {
      "instructionManual.title": "Resources",
      "instructionManual.fieldLabel": "Instruction manual",
      "instructionManual.description": "Official manuals and reference links.",
      "instructionManual.openCta": "Open",
    };

    return (key: string) => messages[key] ?? key;
  }),
}));

import { InstructionManualSection } from "~/app/[locale]/(pages)/gear/_components/instruction-manual-section";

describe("InstructionManualSection", () => {
  it("renders nothing when no instruction manual link is available", async () => {
    const html = renderToStaticMarkup(
      (await InstructionManualSection({ linkInstructionManual: null })) ?? null,
    );

    expect(html).toBe("");
  });

  it("renders the section and CTA when a manual link exists", async () => {
    const html = renderToStaticMarkup(
      (await InstructionManualSection({
        linkInstructionManual: "https://example.com/manual.pdf",
      })) ?? null,
    );

    expect(html).toContain("Resources");
    expect(html).toContain("Instruction manual");
    expect(html).toContain("Open");
    expect(html).toContain('href="https://example.com/manual.pdf"');
    expect(html).toContain('id="instruction-manual"');
  });
});
