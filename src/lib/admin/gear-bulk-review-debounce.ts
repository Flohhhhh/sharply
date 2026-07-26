export const BULK_GEAR_REVIEW_DEBOUNCE_MS = 500;

export type BulkGearReviewDebouncer = {
  schedule: (rowId: string, review: () => void) => void;
  cancel: (rowId: string) => void;
  clear: () => void;
};

export function createBulkGearReviewDebouncer(
  delayMs = BULK_GEAR_REVIEW_DEBOUNCE_MS,
): BulkGearReviewDebouncer {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const cancel = (rowId: string) => {
    const timer = timers.get(rowId);
    if (timer === undefined) return;
    clearTimeout(timer);
    timers.delete(rowId);
  };

  return {
    schedule(rowId, review) {
      cancel(rowId);
      const timer = setTimeout(() => {
        timers.delete(rowId);
        review();
      }, delayMs);
      timers.set(rowId, timer);
    },
    cancel,
    clear() {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    },
  };
}
