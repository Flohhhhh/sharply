import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  gearEdits,
  gear,
  users,
  cameraSpecs,
  lensSpecs,
} from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Role check: require EDITOR or ADMIN
    if (
      !session?.user ||
      !["ADMIN", "EDITOR"].includes((session.user as any).role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all gear edits with related data
    const proposals = await db
      .select({
        id: gearEdits.id,
        gearId: gearEdits.gearId,
        gearName: gear.name,
        gearSlug: gear.slug,
        createdById: gearEdits.createdById,
        createdByName: users.name,
        status: gearEdits.status,
        payload: gearEdits.payload,
        note: gearEdits.note,
        createdAt: gearEdits.createdAt,
      })
      .from(gearEdits)
      .innerJoin(gear, eq(gearEdits.gearId, gear.id))
      .innerJoin(users, eq(gearEdits.createdById, users.id))
      .orderBy(desc(gearEdits.createdAt));

    // Build a baseline cache per gear to compute "before" values
    const baselineCache = new Map<string, any>();
    const getBaseline = async (gearId: string) => {
      if (baselineCache.has(gearId)) return baselineCache.get(gearId);
      const [g] = await db
        .select({
          id: gear.id,
          name: gear.name,
          slug: gear.slug,
          releaseDate: gear.releaseDate,
          msrpUsdCents: gear.msrpUsdCents,
          mountId: gear.mountId,
          weightGrams: gear.weightGrams,
        })
        .from(gear)
        .where(eq(gear.id, gearId))
        .limit(1);
      const [cam] = await db
        .select()
        .from(cameraSpecs)
        .where(eq(cameraSpecs.gearId, gearId))
        .limit(1);
      const [lens] = await db
        .select()
        .from(lensSpecs)
        .where(eq(lensSpecs.gearId, gearId))
        .limit(1);
      const baseline: {
        core: Record<string, any>;
        camera: Record<string, any>;
        lens: Record<string, any>;
      } = {
        core: (g as any) ?? {},
        camera: (cam as any) ?? {},
        lens: (lens as any) ?? {},
      };
      baselineCache.set(gearId, baseline);
      return baseline;
    };

    // Attach before values for only the keys present in payload
    const enriched = await Promise.all(
      proposals.map(async (p) => {
        const base = (await getBaseline(p.gearId)) as {
          core: Record<string, any>;
          camera: Record<string, any>;
          lens: Record<string, any>;
        };
        const pick = (src: Record<string, any>, keys?: Record<string, any>) => {
          if (!keys) return undefined;
          const out: Record<string, any> = {};
          for (const k of Object.keys(keys)) out[k] = src?.[k] ?? null;
          return out;
        };
        const baseCore: Record<string, any> =
          (base && (base as any).core) || {};
        const baseCamera: Record<string, any> =
          (base && (base as any).camera) || {};
        const baseLens: Record<string, any> =
          (base && (base as any).lens) || {};
        const result: any = {
          ...p,
        };
        result.beforeCore = pick(
          baseCore,
          (p as any).payload?.core as Record<string, any> | undefined,
        );
        result.beforeCamera = pick(
          baseCamera,
          (p as any).payload?.camera as Record<string, any> | undefined,
        );
        result.beforeLens = pick(
          baseLens,
          (p as any).payload?.lens as Record<string, any> | undefined,
        );
        return result;
      }),
    );

    // Group proposals by gear
    const groupedProposals = enriched.reduce(
      (
        acc: Array<{
          gearId: string;
          gearName: string;
          gearSlug: string;
          proposals: typeof enriched;
        }>,
        proposal,
      ) => {
        const existingGroup = acc.find(
          (group: { gearId: string }) => group.gearId === proposal.gearId,
        );

        if (existingGroup) {
          existingGroup.proposals.push(proposal);
        } else {
          acc.push({
            gearId: proposal.gearId,
            gearName: proposal.gearName,
            gearSlug: proposal.gearSlug,
            proposals: [proposal],
          });
        }

        return acc;
      },
      [] as Array<{
        gearId: string;
        gearName: string;
        gearSlug: string;
        proposals: typeof proposals;
      }>,
    );

    // Sort groups by most recent proposal
    groupedProposals.sort((a: any, b: any) => {
      const aLatest = Math.max(
        ...a.proposals.map((p: any) => new Date(p.createdAt).getTime()),
      );
      const bLatest = Math.max(
        ...b.proposals.map((p: any) => new Date(p.createdAt).getTime()),
      );
      return bLatest - aLatest;
    });

    return NextResponse.json(groupedProposals);
  } catch (error) {
    console.error("Failed to fetch gear proposals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
