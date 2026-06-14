import { describe, expect, it, vi } from "vitest";
import type { NotificationDropdownData } from "~/components/layout/notifications/notification-dropdown-state";
import {
  archiveAllNotifications,
  deleteAllArchivedNotifications,
  getSharedHeaderNotificationsKey,
  markVisibleNotificationsRead,
} from "~/components/layout/notifications/shared-header-notifications-controller";

function makeNotification(
  id: string,
  overrides: Partial<NotificationDropdownData["notifications"][number]> = {},
): NotificationDropdownData["notifications"][number] {
  return {
    id,
    type: "gear_spec_approved",
    title: `Notification ${id}`,
    body: null,
    linkUrl: `/gear/${id}`,
    sourceType: "gear",
    sourceId: id,
    metadata: null,
    readAt: null,
    archivedAt: null,
    createdAt: "2026-06-14T12:00:00.000Z",
    ...overrides,
  };
}

describe("shared header notifications controller", () => {
  it("does not fetch while the session is pending or signed out", () => {
    expect(
      getSharedHeaderNotificationsKey({
        userId: null,
        isSessionPending: true,
      }),
    ).toBeNull();
    expect(
      getSharedHeaderNotificationsKey({
        userId: null,
        isSessionPending: false,
      }),
    ).toBeNull();
  });

  it("uses a user-scoped shared header cache key when the user is signed in", () => {
    expect(
      getSharedHeaderNotificationsKey({
        userId: "user-1",
        isSessionPending: false,
      }),
    ).toEqual(["/api/notifications/header", "user-1"]);
  });

  it("optimistically marks visible notifications as read and revalidates afterwards", async () => {
    const applyOptimisticData = vi.fn();
    const revalidate = vi.fn().mockResolvedValue(undefined);
    const markRead = vi.fn().mockResolvedValue(undefined);

    const result = await markVisibleNotificationsRead({
      data: {
        notifications: [
          makeNotification("n-1"),
          makeNotification("n-2", { readAt: "2026-06-13T10:00:00.000Z" }),
        ],
        archived: [],
        unreadCount: 1,
      },
      nowIso: "2026-06-14T15:30:00.000Z",
      applyOptimisticData,
      revalidate,
      markRead,
    });

    expect(result).toBe(true);
    expect(applyOptimisticData).toHaveBeenCalledTimes(1);
    expect(markRead).toHaveBeenCalledTimes(1);
    expect(markRead).toHaveBeenCalledWith("n-1");
    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it("archives all active notifications and revalidates afterwards", async () => {
    const applyOptimisticData = vi.fn();
    const revalidate = vi.fn().mockResolvedValue(undefined);
    const archiveResolvers: Array<() => void> = [];
    const archiveNotification = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          archiveResolvers.push(resolve);
        }),
    );

    const promise = archiveAllNotifications({
      data: {
        notifications: [
          makeNotification("n-1"),
          makeNotification("n-2"),
        ],
        archived: [],
        unreadCount: 2,
      },
      nowIso: "2026-06-14T15:30:00.000Z",
      applyOptimisticData,
      revalidate,
      archiveNotification,
    });

    expect(applyOptimisticData).toHaveBeenCalledTimes(1);
    expect(revalidate).not.toHaveBeenCalled();

    archiveResolvers.forEach((resolve) => resolve());
    const result = await promise;

    expect(result).toBe(true);
    expect(applyOptimisticData).toHaveBeenCalledTimes(1);
    expect(archiveNotification).toHaveBeenCalledTimes(2);
    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it("deletes all archived notifications and revalidates afterwards", async () => {
    const applyOptimisticData = vi.fn();
    const revalidate = vi.fn().mockResolvedValue(undefined);
    const deleteAllArchived = vi.fn().mockResolvedValue(undefined);

    const result = await deleteAllArchivedNotifications({
      data: {
        notifications: [],
        archived: [
          makeNotification("archived-1", {
            readAt: "2026-06-10T10:00:00.000Z",
            archivedAt: "2026-06-10T10:00:00.000Z",
          }),
        ],
        unreadCount: 0,
      },
      applyOptimisticData,
      revalidate,
      deleteAllArchived,
    });

    expect(result).toBe(true);
    expect(applyOptimisticData).toHaveBeenCalledTimes(1);
    expect(deleteAllArchived).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it("no-ops without revalidating when there is nothing to mutate", async () => {
    const applyOptimisticData = vi.fn();
    const revalidate = vi.fn().mockResolvedValue(undefined);
    const markRead = vi.fn().mockResolvedValue(undefined);
    const archiveNotification = vi.fn().mockResolvedValue(undefined);
    const deleteAllArchived = vi.fn().mockResolvedValue(undefined);

    const emptyData: NotificationDropdownData = {
      notifications: [],
      archived: [],
      unreadCount: 0,
    };

    await expect(
      markVisibleNotificationsRead({
        data: emptyData,
        nowIso: "2026-06-14T15:30:00.000Z",
        applyOptimisticData,
        revalidate,
        markRead,
      }),
    ).resolves.toBe(false);
    await expect(
      archiveAllNotifications({
        data: emptyData,
        nowIso: "2026-06-14T15:30:00.000Z",
        applyOptimisticData,
        revalidate,
        archiveNotification,
      }),
    ).resolves.toBe(false);
    await expect(
      deleteAllArchivedNotifications({
        data: emptyData,
        applyOptimisticData,
        revalidate,
        deleteAllArchived,
      }),
    ).resolves.toBe(false);

    expect(applyOptimisticData).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });
});
