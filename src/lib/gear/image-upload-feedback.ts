import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

export const IMAGE_UPLOAD_FEEDBACK_TOAST_DURATION_MS = 15_000;

export type ImageUploadFeedback = {
  id: string;
  message: string;
  variant: "default" | "destructive";
  callout?: boolean;
  toast?: boolean;
};

export function appendImageUploadFeedback(
  current: ImageUploadFeedback[],
  feedback: ImageUploadFeedback,
) {
  return [...current.filter((item) => item.id !== feedback.id), feedback];
}

/**
 * Report feedback from any client-side upload stage. Use callouts only for
 * warnings and errors; progress and success belong in progress UI or toasts.
 */
export function reportImageUploadFeedback(params: {
  setFeedback: Dispatch<SetStateAction<ImageUploadFeedback[]>>;
  feedback: ImageUploadFeedback;
}) {
  const { feedback, setFeedback } = params;
  if (feedback.callout) {
    setFeedback((current) => appendImageUploadFeedback(current, feedback));
  }

  if (!feedback.toast) return;
  const toastOptions = { duration: IMAGE_UPLOAD_FEEDBACK_TOAST_DURATION_MS };
  if (feedback.variant === "destructive") {
    toast.error(feedback.message, toastOptions);
  } else {
    toast.success(feedback.message, toastOptions);
  }
}
