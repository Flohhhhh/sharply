export type ChangeRequestFieldPolicy = {
  /** Allows trusted auto-approval to replace an existing non-empty value. */
  allowAutoApprovalOverwrite?: boolean;
};

const CHANGE_REQUEST_FIELD_POLICIES: Record<string, ChangeRequestFieldPolicy> =
  {
    "core.releaseDatePrecision": {
      allowAutoApprovalOverwrite: true,
    },
    "core.announceDatePrecision": {
      allowAutoApprovalOverwrite: true,
    },
  };

export function allowsAutoApprovalOverwrite(
  sectionKey: string,
  fieldKey: string,
): boolean {
  return Boolean(
    CHANGE_REQUEST_FIELD_POLICIES[`${sectionKey}.${fieldKey}`]
      ?.allowAutoApprovalOverwrite,
  );
}
