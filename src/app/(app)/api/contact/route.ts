import { NextResponse } from "next/server";

import {
  contactFormSchema,
  type ContactSubmissionResult,
} from "~/lib/contact/contact-schema";
import { submitContactMessage } from "~/server/contact/service";

type ContactRequestBody = Record<string, unknown>;

function buildFieldErrors(
  error: ReturnType<typeof contactFormSchema.safeParse>,
) {
  if (error.success) return undefined;
  const fieldErrors: Record<string, string> = {};
  const flattened = error.error.flatten().fieldErrors;
  for (const [key, value] of Object.entries(flattened)) {
    if (value && value.length > 0) {
      fieldErrors[key] = value[0] ?? "Invalid value";
    }
  }
  return fieldErrors;
}

export async function POST(request: Request) {
  let body: ContactRequestBody | null = null;
  try {
    body = (await request.json()) as ContactRequestBody;
  } catch (error) {
    body = null;
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json<ContactSubmissionResult>(
      {
        ok: false,
        message: "Invalid request payload.",
      },
      { status: 400 },
    );
  }

  const { honeypot, startedAt, ...payload } = body;
  const parsed = contactFormSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json<ContactSubmissionResult>(
      {
        ok: false,
        message: "Please correct the highlighted fields and try again.",
        fieldErrors: buildFieldErrors(parsed),
      },
      { status: 400 },
    );
  }

  const startedAtNumber =
    typeof startedAt === "number"
      ? startedAt
      : typeof startedAt === "string"
        ? Number(startedAt)
        : null;

  const result = await submitContactMessage(parsed.data, {
    honeypot: typeof honeypot === "string" ? honeypot : null,
    startedAt: Number.isFinite(startedAtNumber ?? NaN) ? startedAtNumber : null,
    route: "/contact",
  });

  return NextResponse.json<ContactSubmissionResult>(result, {
    status: result.ok ? 200 : 400,
  });
}
