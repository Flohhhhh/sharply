import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { gear, gearEdits } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "~/server/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    console.log("[edits POST] start", { slug });
    const session = await auth();
    if (!session?.user?.id) {
      console.warn("[edits POST] unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await req.text();
    let body: any = null;
    try {
      body = JSON.parse(raw);
    } catch {
      console.warn("[edits POST] non-JSON body", raw);
    }
    console.log(
      "[edits POST] parsed body keys",
      body ? Object.keys(body) : null,
    );
    // body expected: { note?: string, payload: { core?: {}, camera?: {}, lens?: {} } }
    if (!body?.payload || typeof body.payload !== "object") {
      console.warn("[edits POST] invalid payload shape", { body });
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // find gear by slug
    const found = await db
      .select()
      .from(gear)
      .where(eq(gear.slug, slug))
      .limit(1);
    if (!found.length) {
      console.warn("[edits POST] gear not found", { slug });
      return NextResponse.json({ error: "Gear not found" }, { status: 404 });
    }

    const created = await db
      .insert(gearEdits)
      .values({
        gearId: found[0]!.id,
        createdById: session.user.id,
        payload: body.payload,
        note: body.note ?? null,
      })
      .returning({ id: gearEdits.id, createdAt: gearEdits.createdAt });

    const response = {
      id: created[0]?.id,
      createdAt: created[0]?.createdAt,
      slug,
      userId: session.user.id,
    };
    console.log("[edits POST] created", response);
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("/api/gear/[slug]/edits POST error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
