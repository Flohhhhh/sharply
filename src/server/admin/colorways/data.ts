import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/server/db";
import {
  auditLogs,
  gear,
  gearColorways,
  gearEdits,
  imageRequests,
} from "~/server/db/schema";

export type ColorwayImageType = "front" | "topView" | "rearView";
export type ColorwayResetMode = "keepGearImages" | "applyColorway";

type ColorwayInput = {
  name: string;
  slug: string;
  swatchColorA: string;
  swatchColorB: string;
};

async function orderedColorways(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  gearId: string,
) {
  return tx
    .select()
    .from(gearColorways)
    .where(eq(gearColorways.gearId, gearId))
    .orderBy(asc(gearColorways.sortOrder), asc(gearColorways.createdAt));
}

async function mirrorDefaultColorway(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  gearId: string,
  colorway: typeof gearColorways.$inferSelect,
  options: { ogImageUrl?: string | null; preserveOg?: boolean } = {},
) {
  const shouldUpdateOgImage =
    options.preserveOg === false || Object.hasOwn(options, "ogImageUrl");

  await tx
    .update(gear)
    .set({
      thumbnailUrl: colorway.frontImageUrl,
      topViewUrl: colorway.topViewUrl,
      rearViewUrl: colorway.rearViewUrl,
      ...(shouldUpdateOgImage ? { ogImageUrl: options.ogImageUrl ?? null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(gear.id, gearId));
}

async function uniqueColorwaySlug(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  gearId: string,
  baseSlug: string,
) {
  const rows = await tx
    .select({ slug: gearColorways.slug })
    .from(gearColorways)
    .where(eq(gearColorways.gearId, gearId));
  const used = new Set(rows.map((row) => row.slug));
  if (!used.has(baseSlug)) return baseSlug;
  let suffix = 2;
  while (used.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}

export async function enableGearColorwaysData(params: {
  gearId: string;
  actorUserId: string;
  input: ColorwayInput;
}) {
  return db.transaction(async (tx) => {
    const [gearRow] = await tx
      .select()
      .from(gear)
      .where(eq(gear.id, params.gearId))
      .limit(1);
    if (!gearRow)
      throw Object.assign(new Error("Gear not found"), { status: 404 });

    const existing = await orderedColorways(tx, params.gearId);
    if (existing.length) {
      throw Object.assign(new Error("Color variations are already enabled"), {
        status: 409,
      });
    }

    const [created] = await tx
      .insert(gearColorways)
      .values({
        ...params.input,
        gearId: params.gearId,
        sortOrder: 0,
        frontImageUrl: gearRow.thumbnailUrl,
        topViewUrl: gearRow.topViewUrl,
        rearViewUrl: gearRow.rearViewUrl,
      })
      .returning();

    await tx.insert(auditLogs).values({
      action: "GEAR_COLORWAY_CREATE",
      actorUserId: params.actorUserId,
      gearId: params.gearId,
      metadata: {
        colorwayId: created!.id,
        name: created!.name,
        enabledMode: true,
      },
    });

    return { colorway: created!, gearSlug: gearRow.slug };
  });
}

export async function createGearColorwayData(params: {
  gearId: string;
  actorUserId: string;
  input: ColorwayInput;
}) {
  return db.transaction(async (tx) => {
    const [gearRow] = await tx
      .select({ slug: gear.slug })
      .from(gear)
      .where(eq(gear.id, params.gearId))
      .limit(1);
    if (!gearRow)
      throw Object.assign(new Error("Gear not found"), { status: 404 });

    const existing = await orderedColorways(tx, params.gearId);
    if (!existing.length) {
      throw Object.assign(new Error("Enable color variations first"), {
        status: 409,
      });
    }
    const slug = await uniqueColorwaySlug(tx, params.gearId, params.input.slug);
    const [created] = await tx
      .insert(gearColorways)
      .values({
        ...params.input,
        slug,
        gearId: params.gearId,
        sortOrder: existing.length,
      })
      .returning();

    await tx.insert(auditLogs).values({
      action: "GEAR_COLORWAY_CREATE",
      actorUserId: params.actorUserId,
      gearId: params.gearId,
      metadata: { colorwayId: created!.id, name: created!.name },
    });
    return { colorway: created!, gearSlug: gearRow.slug };
  });
}

export async function updateGearColorwayData(params: {
  gearId: string;
  colorwayId: string;
  actorUserId: string;
  name: string;
  swatchColorA: string;
  swatchColorB: string;
}) {
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(gearColorways)
      .where(
        and(
          eq(gearColorways.id, params.colorwayId),
          eq(gearColorways.gearId, params.gearId),
        ),
      )
      .limit(1);
    if (!before)
      throw Object.assign(new Error("Colorway not found"), { status: 404 });

    const [updated] = await tx
      .update(gearColorways)
      .set({
        name: params.name,
        swatchColorA: params.swatchColorA,
        swatchColorB: params.swatchColorB,
        updatedAt: new Date(),
      })
      .where(eq(gearColorways.id, params.colorwayId))
      .returning();
    const [gearRow] = await tx
      .select({ slug: gear.slug })
      .from(gear)
      .where(eq(gear.id, params.gearId))
      .limit(1);

    await tx.insert(auditLogs).values({
      action: "GEAR_COLORWAY_UPDATE",
      actorUserId: params.actorUserId,
      gearId: params.gearId,
      metadata: {
        colorwayId: params.colorwayId,
        before: {
          name: before.name,
          swatchColorA: before.swatchColorA,
          swatchColorB: before.swatchColorB,
        },
        after: {
          name: updated!.name,
          swatchColorA: updated!.swatchColorA,
          swatchColorB: updated!.swatchColorB,
        },
      },
    });
    return { colorway: updated!, gearSlug: gearRow!.slug };
  });
}

export async function reorderGearColorwaysData(params: {
  gearId: string;
  orderedIds: string[];
  actorUserId: string;
}) {
  return db.transaction(async (tx) => {
    const existing = await orderedColorways(tx, params.gearId);
    const existingIds = new Set(existing.map((item) => item.id));
    if (
      existing.length !== params.orderedIds.length ||
      params.orderedIds.some((id) => !existingIds.has(id))
    ) {
      throw Object.assign(new Error("Colorway order is incomplete"), {
        status: 400,
      });
    }

    await Promise.all(
      params.orderedIds.map((id, sortOrder) =>
        tx
          .update(gearColorways)
          .set({ sortOrder, updatedAt: new Date() })
          .where(
            and(
              eq(gearColorways.id, id),
              eq(gearColorways.gearId, params.gearId),
            ),
          ),
      ),
    );
    const newDefault = existing.find(
      (item) => item.id === params.orderedIds[0],
    )!;
    const defaultChanged = existing[0]?.id !== newDefault.id;
    if (defaultChanged)
      await mirrorDefaultColorway(tx, params.gearId, newDefault);

    const [gearRow] = await tx
      .select({ slug: gear.slug })
      .from(gear)
      .where(eq(gear.id, params.gearId))
      .limit(1);
    await tx.insert(auditLogs).values({
      action: "GEAR_COLORWAY_REORDER",
      actorUserId: params.actorUserId,
      gearId: params.gearId,
      metadata: { orderedIds: params.orderedIds, defaultChanged },
    });
    return {
      colorways: await orderedColorways(tx, params.gearId),
      gearSlug: gearRow!.slug,
    };
  });
}

export async function deleteGearColorwayData(params: {
  gearId: string;
  colorwayId: string;
  actorUserId: string;
}) {
  return db.transaction(async (tx) => {
    const existing = await orderedColorways(tx, params.gearId);
    if (existing.length <= 1) {
      throw Object.assign(
        new Error("Reset color variations to remove the final colorway"),
        { status: 409 },
      );
    }
    const removed = existing.find((item) => item.id === params.colorwayId);
    if (!removed)
      throw Object.assign(new Error("Colorway not found"), { status: 404 });
    await tx
      .delete(gearColorways)
      .where(eq(gearColorways.id, params.colorwayId));

    const remaining = existing.filter((item) => item.id !== params.colorwayId);
    await Promise.all(
      remaining.map((item, sortOrder) =>
        tx
          .update(gearColorways)
          .set({ sortOrder, updatedAt: new Date() })
          .where(eq(gearColorways.id, item.id)),
      ),
    );
    if (existing[0]!.id === params.colorwayId) {
      await mirrorDefaultColorway(tx, params.gearId, remaining[0]!);
    }
    const [gearRow] = await tx
      .select({ slug: gear.slug })
      .from(gear)
      .where(eq(gear.id, params.gearId))
      .limit(1);
    await tx.insert(auditLogs).values({
      action: "GEAR_COLORWAY_DELETE",
      actorUserId: params.actorUserId,
      gearId: params.gearId,
      metadata: { colorwayId: removed.id, name: removed.name },
    });
    return {
      colorways: await orderedColorways(tx, params.gearId),
      gearSlug: gearRow!.slug,
    };
  });
}

export async function resetGearColorwaysData(params: {
  gearId: string;
  mode: ColorwayResetMode;
  colorwayId?: string;
  actorUserId: string;
}) {
  return db.transaction(async (tx) => {
    const existing = await orderedColorways(tx, params.gearId);
    if (!existing.length)
      throw Object.assign(new Error("Color variations are not enabled"), {
        status: 409,
      });
    if (params.mode === "applyColorway") {
      const selected = existing.find((item) => item.id === params.colorwayId);
      if (!selected)
        throw Object.assign(new Error("Choose a colorway to apply"), {
          status: 400,
        });
      await mirrorDefaultColorway(tx, params.gearId, selected);
    }
    await tx
      .delete(gearColorways)
      .where(eq(gearColorways.gearId, params.gearId));
    const [gearRow] = await tx
      .select({ slug: gear.slug })
      .from(gear)
      .where(eq(gear.id, params.gearId))
      .limit(1);
    await tx.insert(auditLogs).values({
      action: "GEAR_COLORWAY_RESET",
      actorUserId: params.actorUserId,
      gearId: params.gearId,
      metadata: {
        mode: params.mode,
        appliedColorwayId: params.colorwayId ?? null,
      },
    });
    return { gearSlug: gearRow!.slug };
  });
}

export async function setGearColorwayImageData(params: {
  gearId: string;
  colorwayId: string;
  imageType: ColorwayImageType;
  imageUrl: string | null;
  ogImageUrl?: string | null;
  actorUserId: string;
}) {
  return db.transaction(async (tx) => {
    const [gearRow] = await tx
      .select()
      .from(gear)
      .where(eq(gear.id, params.gearId))
      .limit(1);
    if (!gearRow)
      throw Object.assign(new Error("Gear not found"), { status: 404 });
    if (params.imageType === "rearView" && gearRow.gearType === "LENS") {
      throw Object.assign(
        new Error("Rear-view images are only supported for cameras"),
        { status: 400 },
      );
    }
    const existing = await orderedColorways(tx, params.gearId);
    const before = existing.find((item) => item.id === params.colorwayId);
    if (!before)
      throw Object.assign(new Error("Colorway not found"), { status: 404 });
    const field =
      params.imageType === "front"
        ? "frontImageUrl"
        : params.imageType === "topView"
          ? "topViewUrl"
          : "rearViewUrl";
    const previousUrl = before[field];
    const [updated] = await tx
      .update(gearColorways)
      .set({ [field]: params.imageUrl, updatedAt: new Date() })
      .where(eq(gearColorways.id, params.colorwayId))
      .returning();
    const isDefault = existing[0]?.id === params.colorwayId;
    if (isDefault) {
      await mirrorDefaultColorway(tx, params.gearId, updated!, {
        preserveOg: params.imageType !== "front",
        ogImageUrl: params.ogImageUrl,
      });
    }
    if (params.imageUrl) {
      await tx
        .delete(imageRequests)
        .where(eq(imageRequests.gearId, params.gearId));
    }

    const action = params.imageUrl
      ? previousUrl
        ? "GEAR_COLORWAY_IMAGE_REPLACE"
        : "GEAR_COLORWAY_IMAGE_UPLOAD"
      : "GEAR_COLORWAY_IMAGE_REMOVE";
    await tx.insert(auditLogs).values({
      action,
      actorUserId: params.actorUserId,
      gearId: params.gearId,
      metadata: {
        colorwayId: before.id,
        colorwayName: before.name,
        imageType: params.imageType,
        url: params.imageUrl,
      },
    });
    if (params.imageUrl) {
      await tx.insert(gearEdits).values({
        id: nanoid(),
        gearId: params.gearId,
        createdById: params.actorUserId,
        status: "APPROVED",
        payload: {
          colorwayImageUpload: {
            colorwayId: before.id,
            colorwayName: before.name,
            type: params.imageType,
            url: params.imageUrl,
            action: previousUrl ? "replace" : "upload",
          },
        },
      });
    }
    return { colorway: updated!, gearSlug: gearRow.slug, isDefault };
  });
}
