export type GearImageReviewRejectedResult = {
  review: { status: "rejected"; reason: string };
};

export function isGearImageReviewRejectedError(error: unknown): error is {
  code: "GEAR_IMAGE_REVIEW_REJECTED";
  message?: string;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "GEAR_IMAGE_REVIEW_REJECTED"
  );
}

export function reviewRejectionResult(error: {
  message?: string;
}): GearImageReviewRejectedResult {
  const prefix = "GEAR_IMAGE_REVIEW_REJECTED:";
  return {
    review: {
      status: "rejected",
      reason: error.message?.startsWith(prefix)
        ? error.message.slice(prefix.length)
        : "REVIEW_REJECTED",
    },
  };
}

export function isGearImageReviewRejectedResult(
  value: unknown,
): value is GearImageReviewRejectedResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "review" in value &&
    typeof value.review === "object" &&
    value.review !== null &&
    "status" in value.review &&
    value.review.status === "rejected" &&
    "reason" in value.review &&
    typeof value.review.reason === "string"
  );
}
