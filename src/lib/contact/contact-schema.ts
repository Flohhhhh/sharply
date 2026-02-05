import { z } from "zod";

export const contactReasons = [
  "data-issue",
  "contribute",
  "brand-partnerships",
  "technical-issue",
] as const;

export type ContactReason = (typeof contactReasons)[number];

export const contactReasonLabels: Record<ContactReason, string> = {
  "data-issue": "Data Errors",
  contribute: "Contributors",
  "brand-partnerships": "Brand Partnerships",
  "technical-issue": "Technical Issue",
};

export const CONTACT_MIN_MESSAGE_LENGTH = 20;
export const CONTACT_MIN_SUBMIT_MS = 1500;

const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .refine((value) => !value || isValidUrl(value), {
    message: "Invalid URL",
  });

const optionalCompany = z
  .string()
  .trim()
  .max(120)
  .optional()
  .refine((value) => !value || value.length >= 2, {
    message: "Company name is too short",
  });

export const contactFormSchema = z.object({
  reason: z.enum(contactReasons),
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.string().trim().min(3, "Subject is required").max(120),
  message: z
    .string()
    .trim()
    .min(
      CONTACT_MIN_MESSAGE_LENGTH,
      `Message must be at least ${CONTACT_MIN_MESSAGE_LENGTH} characters`,
    )
    .max(5000),
  referenceUrl: optionalUrl,
  company: optionalCompany,
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export type ContactSubmissionResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string>;
    };
