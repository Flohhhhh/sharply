import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { gear, gearEdits, auditLogs } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "~/server/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // find gear by slug
    const found = await db
      .select({ id: gear.id })
      .from(gear)
      .where(eq(gear.slug, slug))
      .limit(1);
    if (!found.length) {
      return NextResponse.json({ error: "Gear not found" }, { status: 404 });
    }

    const pending = await db
      .select({ id: gearEdits.id })
      .from(gearEdits)
      .where(
        and(
          eq(gearEdits.gearId, found[0]!.id),
          eq(gearEdits.createdById, session.user.id),
          eq(gearEdits.status, "PENDING"),
        ),
      )
      .limit(1);

    return NextResponse.json({ pendingEditId: pending[0]?.id ?? null });
  } catch (err) {
    console.error("/api/gear/[slug]/edits GET error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

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

    // Audit: gear edit proposed
    try {
      await db.insert(auditLogs).values({
        action: "GEAR_EDIT_PROPOSE",
        actorUserId: session.user.id,
        gearId: found[0]!.id,
        gearEditId: created[0]!.id,
      });
    } catch (e) {
      console.warn("[edits POST] audit log failed", e);
    }

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
