import { describe, expect, it, vi } from "vitest";

import {
  appendImageUploadFeedback,
  reportImageUploadFeedback,
  type ImageUploadFeedback,
} from "~/lib/gear/image-upload-feedback";

describe("image upload feedback", () => {
  it("keeps feedback from multiple upload stages", () => {
    const review: ImageUploadFeedback = {
      id: "review",
      message: "Review passed",
      variant: "default",
    };
    const save: ImageUploadFeedback = {
      id: "save",
      message: "Saved",
      variant: "default",
    };

    expect(appendImageUploadFeedback([review], save)).toEqual([review, save]);
  });

  it("replaces a prior result from the same stage", () => {
    const first: ImageUploadFeedback = {
      id: "review",
      message: "Reviewing",
      variant: "default",
    };
    const replacement: ImageUploadFeedback = {
      id: "review",
      message: "Review passed",
      variant: "default",
    };

    expect(appendImageUploadFeedback([first], replacement)).toEqual([
      replacement,
    ]);
  });

  it("only stores callout feedback when explicitly requested", () => {
    const setFeedback = vi.fn();

    reportImageUploadFeedback({
      setFeedback,
      feedback: {
        id: "success",
        message: "Saved",
        variant: "default",
      },
    });

    expect(setFeedback).not.toHaveBeenCalled();
  });
});
