import type { VideoModeNormalized } from "~/lib/video/mode-schema";

export type ProposalStatus = "PENDING" | "APPROVED" | "REJECTED" | "MERGED";

export type GearProposalPayload = {
  core?: Record<string, any>;
  camera?: Record<string, any>;
  analogCamera?: Record<string, any>;
  lens?: Record<string, any>;
  fixedLens?: Record<string, any>;
  cameraCardSlots?: Array<{
    slotIndex: number;
    supportedFormFactors: string[];
    supportedBuses: string[];
    supportedSpeedClasses?: string[];
  }>;
  videoModes?: VideoModeNormalized[];
};

export interface GearProposal {
  id: string;
  gearId: string;
  gearName: string;
  gearSlug: string;
  createdById: string;
  createdByName: string | null;
  createdByImage: string | null;
  status: ProposalStatus;
  payload: GearProposalPayload;
  beforeCore?: Record<string, any>;
  beforeCamera?: Record<string, any>;
  beforeAnalogCamera?: Record<string, any>;
  beforeLens?: Record<string, any>;
  beforeFixedLens?: Record<string, any>;
  note?: string | null;
  createdAt: string | Date;
}

export type ProposalGroupDto = {
  gearId: string;
  gearName: string;
  gearSlug: string;
  proposals: Array<{
    id: string;
    gearId: string;
    createdById: string;
    createdByName: string | null;
    createdByImage: string | null;
    status: string;
    payload: unknown;
    beforeCore?: Record<string, unknown>;
    beforeCamera?: Record<string, unknown>;
    beforeAnalogCamera?: Record<string, unknown>;
    beforeLens?: Record<string, unknown>;
    beforeFixedLens?: Record<string, unknown>;
    note?: string | null;
    createdAt: string | Date;
  }>;
};

export type ProposalGroup = {
  gearId: string;
  gearName: string;
  gearSlug: string;
  proposals: GearProposal[];
};

export type ProposalFieldArea =
  | "core"
  | "camera"
  | "analogCamera"
  | "lens"
  | "fixedLens"
  | "cameraCardSlots"
  | "videoModes";

export type ConflictEntry = {
  fieldKey: string;
  area: ProposalFieldArea;
  key?: string;
  options: Array<{
    proposalId: string;
    createdByName: string | null;
    createdAt: string | Date;
    value: unknown;
  }>;
};

export type NonConflictEntry = {
  fieldKey: string;
  area: ProposalFieldArea;
  key?: string;
  provider: {
    proposalId: string;
    createdByName: string | null;
    createdAt: string | Date;
  };
  value: unknown;
};

const isKnownStatus = (status: string): status is ProposalStatus =>
  status === "PENDING" ||
  status === "APPROVED" ||
  status === "REJECTED" ||
  status === "MERGED";

export function flattenProposalGroups(groups: ProposalGroupDto[]): GearProposal[] {
  return groups.flatMap((group) =>
    group.proposals.map((proposal) => ({
      id: proposal.id,
      gearId: proposal.gearId,
      gearName: group.gearName,
      gearSlug: group.gearSlug,
      createdById: proposal.createdById,
      createdByName: proposal.createdByName,
      createdByImage: proposal.createdByImage,
      status: isKnownStatus(proposal.status) ? proposal.status : "APPROVED",
      payload: (proposal.payload as GearProposalPayload) || {},
      beforeCore: proposal.beforeCore as Record<string, any> | undefined,
      beforeCamera: proposal.beforeCamera as Record<string, any> | undefined,
      beforeAnalogCamera:
        proposal.beforeAnalogCamera as Record<string, any> | undefined,
      beforeLens: proposal.beforeLens as Record<string, any> | undefined,
      beforeFixedLens:
        proposal.beforeFixedLens as Record<string, any> | undefined,
      note: proposal.note,
      createdAt: proposal.createdAt,
    })),
  );
}

export function groupGearProposals(proposals: GearProposal[]): ProposalGroup[] {
  return Array.from(
    proposals.reduce((map, proposal) => {
      const existing = map.get(proposal.gearId);
      if (existing) {
        existing.proposals.push(proposal);
      } else {
        map.set(proposal.gearId, {
          gearId: proposal.gearId,
          gearName: proposal.gearName,
          gearSlug: proposal.gearSlug,
          proposals: [proposal],
        });
      }
      return map;
    }, new Map<string, ProposalGroup>()),
  )
    .map(([, group]) => ({
      ...group,
      proposals: group.proposals
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt as any).getTime() -
            new Date(a.createdAt as any).getTime(),
        ),
    }))
    .sort((a, b) => {
      const aLatest = Math.max(
        ...a.proposals.map((proposal) =>
          new Date(proposal.createdAt as any).getTime(),
        ),
      );
      const bLatest = Math.max(
        ...b.proposals.map((proposal) =>
          new Date(proposal.createdAt as any).getTime(),
        ),
      );
      return bLatest - aLatest;
    });
}

export function buildInitialSelectedByProposal(
  proposals: GearProposal[],
  existing: Record<string, Record<string, boolean>> = {},
) {
  const next = { ...existing };
  for (const proposal of proposals) {
    if (next[proposal.id]) continue;
    const initial: Record<string, boolean> = {};
    const namespaces = [
      proposal.payload.core,
      proposal.payload.camera,
      proposal.payload.analogCamera,
      proposal.payload.lens,
      proposal.payload.fixedLens,
    ];
    for (const namespace of namespaces) {
      for (const key of Object.keys(namespace ?? {})) {
        initial[key] = true;
      }
    }
    next[proposal.id] = initial;
  }
  return next;
}

function serialize(value: unknown): string {
  try {
    return JSON.stringify(value, Object.keys((value as any) ?? {}).sort());
  } catch {
    return String(value);
  }
}

function addFieldItems(
  map: Map<
    string,
    {
      area: ProposalFieldArea;
      key?: string;
      items: ConflictEntry["options"];
    }
  >,
  area: ProposalFieldArea,
  proposal: GearProposal,
  object?: Record<string, unknown>,
) {
  if (!object) return;
  Object.entries(object).forEach(([key, value]) => {
    const fieldKey = `${area}.${key}`;
    const entry = map.get(fieldKey) ?? { area, key, items: [] };
    entry.items.push({
      proposalId: proposal.id,
      createdByName: proposal.createdByName ?? null,
      createdAt: proposal.createdAt,
      value,
    });
    map.set(fieldKey, entry);
  });
}

export function computeNonConflictsForGroup(
  group: ProposalGroup,
): NonConflictEntry[] {
  const map = new Map<
    string,
    {
      area: ProposalFieldArea;
      key?: string;
      items: ConflictEntry["options"];
    }
  >();

  for (const proposal of group.proposals.filter((item) => item.status === "PENDING")) {
    addFieldItems(map, "core", proposal, proposal.payload.core);
    addFieldItems(map, "camera", proposal, proposal.payload.camera);
    addFieldItems(map, "analogCamera", proposal, proposal.payload.analogCamera);
    addFieldItems(map, "lens", proposal, proposal.payload.lens);
    addFieldItems(map, "fixedLens", proposal, proposal.payload.fixedLens);

    if (Array.isArray(proposal.payload.cameraCardSlots)) {
      const fieldKey = "cameraCardSlots";
      const entry = map.get(fieldKey) ?? {
        area: "cameraCardSlots" as ProposalFieldArea,
        items: [] as ConflictEntry["options"],
      };
      entry.items.push({
        proposalId: proposal.id,
        createdByName: proposal.createdByName ?? null,
        createdAt: proposal.createdAt,
        value: proposal.payload.cameraCardSlots,
      });
      map.set(fieldKey, entry);
    }

    if (Array.isArray(proposal.payload.videoModes)) {
      const fieldKey = "videoModes";
      const entry = map.get(fieldKey) ?? {
        area: "videoModes" as ProposalFieldArea,
        items: [] as ConflictEntry["options"],
      };
      entry.items.push({
        proposalId: proposal.id,
        createdByName: proposal.createdByName ?? null,
        createdAt: proposal.createdAt,
        value: proposal.payload.videoModes,
      });
      map.set(fieldKey, entry);
    }
  }

  const results: NonConflictEntry[] = [];
  for (const [fieldKey, entry] of map.entries()) {
    const uniqueValues = new Set<string>();
    let representative: ConflictEntry["options"][number] | null = null;
    for (const option of entry.items) {
      uniqueValues.add(serialize(option.value));
      if (!representative) representative = option;
    }
    if (entry.items.length >= 1 && uniqueValues.size === 1 && representative) {
      results.push({
        fieldKey,
        area: entry.area,
        key: entry.key,
        provider: {
          proposalId: representative.proposalId,
          createdByName: representative.createdByName ?? null,
          createdAt: representative.createdAt,
        },
        value: representative.value,
      });
    }
  }
  return results;
}

export function computeConflictsForGroup(group: ProposalGroup): ConflictEntry[] {
  const map = new Map<
    string,
    {
      area: ProposalFieldArea;
      key?: string;
      items: ConflictEntry["options"];
    }
  >();

  for (const proposal of group.proposals.filter((item) => item.status === "PENDING")) {
    addFieldItems(map, "core", proposal, proposal.payload.core);
    addFieldItems(map, "camera", proposal, proposal.payload.camera);
    addFieldItems(map, "analogCamera", proposal, proposal.payload.analogCamera);
    addFieldItems(map, "lens", proposal, proposal.payload.lens);
    addFieldItems(map, "fixedLens", proposal, proposal.payload.fixedLens);

    if (Array.isArray(proposal.payload.cameraCardSlots)) {
      const fieldKey = "cameraCardSlots";
      const entry = map.get(fieldKey) ?? {
        area: "cameraCardSlots" as ProposalFieldArea,
        items: [] as ConflictEntry["options"],
      };
      entry.items.push({
        proposalId: proposal.id,
        createdByName: proposal.createdByName ?? null,
        createdAt: proposal.createdAt,
        value: proposal.payload.cameraCardSlots,
      });
      map.set(fieldKey, entry);
    }

    if (Array.isArray(proposal.payload.videoModes)) {
      const fieldKey = "videoModes";
      const entry = map.get(fieldKey) ?? {
        area: "videoModes" as ProposalFieldArea,
        items: [] as ConflictEntry["options"],
      };
      entry.items.push({
        proposalId: proposal.id,
        createdByName: proposal.createdByName ?? null,
        createdAt: proposal.createdAt,
        value: proposal.payload.videoModes,
      });
      map.set(fieldKey, entry);
    }
  }

  const conflicts: ConflictEntry[] = [];
  for (const [fieldKey, entry] of map.entries()) {
    const uniqueValues = new Map<string, ConflictEntry["options"][number]>();
    for (const option of entry.items) {
      const key = serialize(option.value);
      if (!uniqueValues.has(key)) uniqueValues.set(key, option);
    }
    if (entry.items.length > 1 && uniqueValues.size > 1) {
      conflicts.push({
        fieldKey,
        area: entry.area,
        key: entry.key,
        options: entry.items,
      });
    }
  }

  return conflicts;
}

export function buildSelectedPayload(
  proposal: GearProposal,
  selected: Record<string, boolean>,
): GearProposalPayload {
  const pick = (
    object: Record<string, any> | undefined,
  ): Record<string, any> | undefined => {
    if (!object) return undefined;
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(object)) {
      if (selected[key]) out[key] = value;
    }
    return Object.keys(out).length ? out : undefined;
  };

  return {
    core: pick(proposal.payload.core),
    camera: pick(proposal.payload.camera),
    analogCamera: pick(proposal.payload.analogCamera),
    lens: pick(proposal.payload.lens),
    fixedLens: pick(proposal.payload.fixedLens),
    cameraCardSlots: Array.isArray(proposal.payload.cameraCardSlots)
      ? proposal.payload.cameraCardSlots
      : undefined,
    videoModes: Array.isArray(proposal.payload.videoModes)
      ? proposal.payload.videoModes
      : undefined,
  };
}

export function buildMergedPayloadForGroup(
  group: ProposalGroup,
  selectedMap: Record<string, string | null>,
  includedMap: Record<string, boolean>,
): GearProposalPayload {
  const conflicts = computeConflictsForGroup(group);
  const nonConflicts = computeNonConflictsForGroup(group);
  const providerByField = new Map<string, string>();

  for (const conflict of conflicts) {
    const selectedProposalId = selectedMap[conflict.fieldKey];
    if (selectedProposalId && selectedProposalId !== "__SKIP__") {
      providerByField.set(conflict.fieldKey, selectedProposalId);
    }
  }

  for (const entry of nonConflicts) {
    if (
      includedMap[entry.fieldKey] !== false &&
      !providerByField.has(entry.fieldKey)
    ) {
      providerByField.set(entry.fieldKey, entry.provider.proposalId);
    }
  }

  const out: GearProposalPayload = {};
  const getProposalById = (id: string) =>
    group.proposals.find((proposal) => proposal.id === id);

  for (const [fieldKey, providerId] of providerByField.entries()) {
    if (fieldKey === "cameraCardSlots") {
      const proposal = getProposalById(providerId);
      if (proposal && Array.isArray(proposal.payload.cameraCardSlots)) {
        out.cameraCardSlots = proposal.payload.cameraCardSlots;
      }
      continue;
    }

    if (fieldKey === "videoModes") {
      const proposal = getProposalById(providerId);
      if (proposal && Array.isArray(proposal.payload.videoModes)) {
        out.videoModes = proposal.payload.videoModes;
      }
      continue;
    }

    const [area, key] = fieldKey.split(".");
    if (!area || !key) continue;

    const proposal = getProposalById(providerId);
    const source = proposal ? (proposal.payload as any)[area] : null;
    if (!proposal || !source || !Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }

    (out as any)[area] = (out as any)[area] || {};
    (out as any)[area][key] = source[key];
  }

  return out;
}

export function mergeProposalDiffsForDisplay(proposal: GearProposal) {
  return {
    beforeMerged: {
      ...(proposal.beforeCore || {}),
      ...(proposal.beforeCamera || {}),
      ...(proposal.beforeAnalogCamera || {}),
      ...(proposal.beforeLens || {}),
      ...(proposal.beforeFixedLens || {}),
    },
    afterMerged: {
      ...(proposal.payload.core || {}),
      ...(proposal.payload.camera || {}),
      ...(proposal.payload.analogCamera || {}),
      ...(proposal.payload.lens || {}),
      ...(proposal.payload.fixedLens || {}),
    },
  };
}
