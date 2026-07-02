/**
 * Trusted contributor auto-approval only runs when the client does not force
 * manual review. Contributors do not see the Auto-Submit toggle, so the UI
 * default must remain opt-in for immediate apply across roles.
 */
export function getInitialAutoSubmitValue(
  autoSubmit?: boolean,
): boolean {
  return typeof autoSubmit === "boolean" ? autoSubmit : true;
}
