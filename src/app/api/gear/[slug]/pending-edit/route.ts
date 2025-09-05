import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { fetchPendingEditId } from "~/server/gear/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ pendingEditId: null });
    }

    const { slug } = await params;
    const id = await fetchPendingEditId(slug);
    return NextResponse.json({ pendingEditId: id });
  } catch (error) {
    return NextResponse.json({ pendingEditId: null });
  }
}
