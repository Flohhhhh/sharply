import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  getGearEditSuccessPath,
  handleGearEditSubmissionSuccess,
} from "~/app/[locale]/(pages)/gear/_components/edit-gear/edit-gear-navigation";

describe("gear edit submission navigation", () => {
  it("closes back to the gear page after an auto-approved edit", () => {
    const closeToGear = vi.fn();
    const navigateToSuccess = vi.fn();

    handleGearEditSubmissionSuccess({
      result: { autoApproved: true, proposalId: "proposal-1" },
      closeToGear,
      navigateToSuccess,
    });

    expect(closeToGear).toHaveBeenCalledOnce();
    expect(navigateToSuccess).not.toHaveBeenCalled();
  });

  it("navigates to the submitted change request after a pending edit", () => {
    const closeToGear = vi.fn();
    const navigateToSuccess = vi.fn();

    handleGearEditSubmissionSuccess({
      result: { autoApproved: false, proposalId: "proposal 1" },
      closeToGear,
      navigateToSuccess,
    });

    expect(closeToGear).not.toHaveBeenCalled();
    expect(navigateToSuccess).toHaveBeenCalledWith(
      "/edit-success?id=proposal+1",
    );
  });

  it("omits an empty proposal id from the success URL", () => {
    expect(getGearEditSuccessPath()).toBe("/edit-success");
  });
});

describe("gear edit parallel route", () => {
  it("provides null defaults for inactive and unmatched edit slots", () => {
    const routeRoot = path.join(
      process.cwd(),
      "src/app/[locale]/(pages)/gear/[slug]/@edit",
    );
    const defaultRoute = fs.readFileSync(
      path.join(routeRoot, "default.tsx"),
      "utf8",
    );
    const catchAllRoute = fs.readFileSync(
      path.join(routeRoot, "[...catchAll]/page.tsx"),
      "utf8",
    );

    expect(defaultRoute).toMatch(/return null/);
    expect(catchAllRoute).toMatch(/return null/);
  });
});
