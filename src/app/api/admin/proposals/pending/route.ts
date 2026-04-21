import { NextResponse } from "next/server";
import { fetchPendingProposalGroups } from "~/server/admin/proposals/service";

export async function GET() {
  try {
    const groups = await fetchPendingProposalGroups();
    return NextResponse.json({ groups });
  } catch (e: any) {
    const status = (e)?.status ?? 500;
    const message = (e)?.message ?? "Failed to load pending proposals";
    console.error(e);
    return NextResponse.json({ error: message }, { status });
  }
}
