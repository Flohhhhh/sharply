import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "~/auth";
import { fetchNotificationsForUser } from "~/server/notifications/service";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(null, {
        status: 200,
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const notifications = await fetchNotificationsForUser({
      userId,
      limit: 10,
      archivedLimit: 5,
    });

    return NextResponse.json(notifications, {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(null, { status: 200 });
  }
}
