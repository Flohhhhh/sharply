import { describe, expect, it } from "vitest";

import {
  buildCompactContributorStack,
  type ContributorItem,
} from "~/app/[locale]/(pages)/gear/_components/gear-contributors-client";

function createContributor(id: string): ContributorItem {
  return {
    id,
    name: `User ${id}`,
    handle: `user-${id}`,
    memberNumber: Number(id),
    image: null,
    count: 10,
  };
}

describe("buildCompactContributorStack", () => {
  it("preserves contributor order while giving earlier contributors higher z-indexes", () => {
    const contributors = [
      createContributor("1"),
      createContributor("2"),
      createContributor("3"),
      createContributor("4"),
      createContributor("5"),
    ];

    const stack = buildCompactContributorStack(contributors);

    expect(stack.topFive.map(({ contributor }) => contributor.id)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
    expect(stack.topFive.map(({ zIndex }) => zIndex)).toEqual([5, 4, 3, 2, 1]);
    expect(stack.remaining).toBe(0);
  });

  it("limits the compact row to five contributors and reports the overflow count", () => {
    const contributors = [
      createContributor("1"),
      createContributor("2"),
      createContributor("3"),
      createContributor("4"),
      createContributor("5"),
      createContributor("6"),
      createContributor("7"),
    ];

    const stack = buildCompactContributorStack(contributors);

    expect(stack.topFive).toHaveLength(5);
    expect(stack.topFive[0]?.contributor.id).toBe("1");
    expect(stack.topFive[4]?.contributor.id).toBe("5");
    expect(stack.topFive.map(({ zIndex }) => zIndex)).toEqual([5, 4, 3, 2, 1]);
    expect(stack.remaining).toBe(2);
  });
});
