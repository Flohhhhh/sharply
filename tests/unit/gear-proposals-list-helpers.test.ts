import { describe, expect, it } from "vitest";

import {
  buildMergedPayloadForGroup,
  buildSelectedPayload,
  computeConflictsForGroup,
  flattenProposalGroups,
  mergeProposalDiffsForDisplay,
  type GearProposal,
  type ProposalGroup,
  type ProposalGroupDto,
} from "~/app/[locale]/(admin)/admin/gear-proposals-list.helpers";

function createProposal(
  overrides: Partial<GearProposal> = {},
  payloadOverrides: GearProposal["payload"] = {},
): GearProposal {
  return {
    id: "proposal-1",
    gearId: "gear-1",
    gearName: "Nikon FM2",
    gearSlug: "nikon-fm2",
    createdById: "user-1",
    createdByName: "Alice",
    createdByImage: null,
    status: "PENDING",
    payload: payloadOverrides,
    createdAt: "2026-03-30T12:00:00.000Z",
    ...overrides,
  };
}

describe("gear proposal helpers", () => {
  it("preserves analog camera payload and before values when flattening groups", () => {
    const groups: ProposalGroupDto[] = [
      {
        gearId: "gear-1",
        gearName: "Nikon FM2",
        gearSlug: "nikon-fm2",
        proposals: [
          {
            id: "proposal-1",
            gearId: "gear-1",
            createdById: "user-1",
            createdByName: "Alice",
            createdByImage: null,
            status: "APPROVED",
            payload: {
              analogCamera: {
                cameraType: "slr",
                captureMedium: "35mm_film",
              },
            },
            beforeAnalogCamera: {
              cameraType: null,
              captureMedium: null,
            },
            createdAt: "2026-03-30T12:00:00.000Z",
          },
        ],
      },
    ];

    const flattened = flattenProposalGroups(groups);

    expect(flattened).toHaveLength(1);
    expect(flattened[0]?.payload.analogCamera).toEqual({
      cameraType: "slr",
      captureMedium: "35mm_film",
    });
    expect(flattened[0]?.beforeAnalogCamera).toEqual({
      cameraType: null,
      captureMedium: null,
    });
  });

  it("includes analog camera fields in selected single-proposal payloads", () => {
    const proposal = createProposal(
      {},
      {
        analogCamera: {
          cameraType: "slr",
          captureMedium: "35mm_film",
          hasBulbMode: true,
        },
        videoModes: [],
      },
    );

    const selected = buildSelectedPayload(proposal, {
      cameraType: true,
      captureMedium: true,
      hasBulbMode: false,
    });

    expect(selected).toEqual({
      analogCamera: {
        cameraType: "slr",
        captureMedium: "35mm_film",
      },
      videoModes: [],
    });
  });

  it("detects conflicts for analog camera fields", () => {
    const group: ProposalGroup = {
      gearId: "gear-1",
      gearName: "Nikon FM2",
      gearSlug: "nikon-fm2",
      proposals: [
        createProposal(
          { id: "proposal-1", createdById: "user-1", createdByName: "Alice" },
          { analogCamera: { cameraType: "slr" } },
        ),
        createProposal(
          { id: "proposal-2", createdById: "user-2", createdByName: "Bob" },
          { analogCamera: { cameraType: "rangefinder" } },
        ),
      ],
    };

    const conflicts = computeConflictsForGroup(group);

    expect(conflicts).toEqual([
      expect.objectContaining({
        fieldKey: "analogCamera.cameraType",
        key: "cameraType",
      }),
    ]);
  });

  it("builds merged group payloads with analog camera conflicts and non-conflicts", () => {
    const group: ProposalGroup = {
      gearId: "gear-1",
      gearName: "Nikon FM2",
      gearSlug: "nikon-fm2",
      proposals: [
        createProposal(
          { id: "proposal-1", createdById: "user-1", createdByName: "Alice" },
          {
            analogCamera: {
              cameraType: "slr",
              captureMedium: "35mm_film",
            },
          },
        ),
        createProposal(
          { id: "proposal-2", createdById: "user-2", createdByName: "Bob" },
          {
            analogCamera: {
              cameraType: "rangefinder",
            },
          },
        ),
      ],
    };

    const merged = buildMergedPayloadForGroup(
      group,
      { "analogCamera.cameraType": "proposal-2" },
      { "analogCamera.captureMedium": true },
    );

    expect(merged).toEqual({
      analogCamera: {
        cameraType: "rangefinder",
        captureMedium: "35mm_film",
      },
    });
  });

  it("merges analog camera values into display diffs", () => {
    const proposal = createProposal(
      {
        beforeAnalogCamera: {
          cameraType: null,
          captureMedium: null,
        },
      },
      {
        analogCamera: {
          cameraType: "slr",
          captureMedium: "35mm_film",
        },
      },
    );

    const merged = mergeProposalDiffsForDisplay(proposal);

    expect(merged.beforeMerged).toEqual({
      cameraType: null,
      captureMedium: null,
    });
    expect(merged.afterMerged).toEqual({
      cameraType: "slr",
      captureMedium: "35mm_film",
    });
  });
});
