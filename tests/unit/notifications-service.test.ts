import { beforeEach, describe, expect, it, vi } from "vitest";

const notificationDataMocks = vi.hoisted(() => ({
  archiveNotificationData: vi.fn(),
  countUnreadNotificationsData: vi.fn(),
  createNotificationData: vi.fn(),
  deleteAllArchivedNotificationsData: vi.fn(),
  deleteNotificationData: vi.fn(),
  fetchNotificationsData: vi.fn(),
  markNotificationReadData: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));
vi.mock("~/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));
vi.mock("~/server/notifications/data", () => notificationDataMocks);

import { fetchNotificationsForUser } from "~/server/notifications/service";

describe("notifications service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationDataMocks.fetchNotificationsData
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    notificationDataMocks.countUnreadNotificationsData.mockResolvedValue(0);
  });

  it("loads all active and archived notifications by default", async () => {
    await fetchNotificationsForUser({
      userId: "user-1",
    });

    expect(notificationDataMocks.fetchNotificationsData).toHaveBeenNthCalledWith(1, {
      userId: "user-1",
      archived: false,
      limit: undefined,
    });
    expect(notificationDataMocks.fetchNotificationsData).toHaveBeenNthCalledWith(2, {
      userId: "user-1",
      archived: true,
      limit: undefined,
    });
  });

  it("still respects explicit limits when they are provided", async () => {
    await fetchNotificationsForUser({
      userId: "user-1",
      limit: 8,
      archivedLimit: 3,
    });

    expect(notificationDataMocks.fetchNotificationsData).toHaveBeenNthCalledWith(1, {
      userId: "user-1",
      archived: false,
      limit: 8,
    });
    expect(notificationDataMocks.fetchNotificationsData).toHaveBeenNthCalledWith(2, {
      userId: "user-1",
      archived: true,
      limit: 3,
    });
  });
});
