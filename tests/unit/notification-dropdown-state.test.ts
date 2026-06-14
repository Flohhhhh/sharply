import { describe, expect, it } from "vitest";
import {
  archiveNotifications,
  deleteArchivedNotifications,
  getTabAfterClearingAllNotifications,
  markNotificationsRead,
  shouldDisableDeleteAllArchived,
  type NotificationDropdownData,
} from "~/components/layout/notifications/notification-dropdown-state";

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

describe("notification dropdown state helpers", () => {
  it("marks unread notifications as read and decrements the unread count", () => {
    const data: NotificationDropdownData = {
      notifications: [
        makeNotification("n-1"),
        makeNotification("n-2", { readAt: "2026-06-13T10:00:00.000Z" }),
      ],
      archived: [],
      unreadCount: 1,
    };

    expect(
      markNotificationsRead(data, ["n-1", "n-2"], "2026-06-14T15:30:00.000Z"),
    ).toEqual({
      notifications: [
        makeNotification("n-1", { readAt: "2026-06-14T15:30:00.000Z" }),
        makeNotification("n-2", { readAt: "2026-06-13T10:00:00.000Z" }),
      ],
      archived: [],
      unreadCount: 0,
    });
  });

  it("returns the same object when there is nothing new to mark read", () => {
    const data: NotificationDropdownData = {
      notifications: [makeNotification("n-1", { readAt: "2026-06-13T10:00:00.000Z" })],
      archived: [],
      unreadCount: 0,
    };

    expect(markNotificationsRead(data, ["n-1"], "2026-06-14T15:30:00.000Z")).toBe(
      data,
    );
  });

  it("archives all selected active notifications and preserves archived ordering", () => {
    const data: NotificationDropdownData = {
      notifications: [
        makeNotification("n-1"),
        makeNotification("n-2", { readAt: "2026-06-13T10:00:00.000Z" }),
      ],
      archived: [makeNotification("archived-1", { readAt: "2026-06-10T10:00:00.000Z", archivedAt: "2026-06-10T10:00:00.000Z" })],
      unreadCount: 1,
    };

    expect(
      archiveNotifications(data, ["n-1", "n-2"], "2026-06-14T15:30:00.000Z"),
    ).toEqual({
      notifications: [],
      archived: [
        makeNotification("n-1", {
          readAt: "2026-06-14T15:30:00.000Z",
          archivedAt: "2026-06-14T15:30:00.000Z",
        }),
        makeNotification("n-2", {
          readAt: "2026-06-13T10:00:00.000Z",
          archivedAt: "2026-06-14T15:30:00.000Z",
        }),
        makeNotification("archived-1", {
          readAt: "2026-06-10T10:00:00.000Z",
          archivedAt: "2026-06-10T10:00:00.000Z",
        }),
      ],
      unreadCount: 0,
    });
  });

  it("deletes only the requested archived notifications", () => {
    const data: NotificationDropdownData = {
      notifications: [makeNotification("n-1")],
      archived: [
        makeNotification("archived-1", {
          readAt: "2026-06-10T10:00:00.000Z",
          archivedAt: "2026-06-10T10:00:00.000Z",
        }),
        makeNotification("archived-2", {
          readAt: "2026-06-11T10:00:00.000Z",
          archivedAt: "2026-06-11T10:00:00.000Z",
        }),
      ],
      unreadCount: 1,
    };

    expect(deleteArchivedNotifications(data, ["archived-1"])).toEqual({
      notifications: [makeNotification("n-1")],
      archived: [
        makeNotification("archived-2", {
          readAt: "2026-06-11T10:00:00.000Z",
          archivedAt: "2026-06-11T10:00:00.000Z",
        }),
      ],
      unreadCount: 1,
    });
  });

  it("keeps the current state unchanged for empty archive and delete operations", () => {
    const data: NotificationDropdownData = {
      notifications: [],
      archived: [],
      unreadCount: 0,
    };

    expect(archiveNotifications(data, [], "2026-06-14T15:30:00.000Z")).toBe(data);
    expect(deleteArchivedNotifications(data, [])).toBe(data);
  });

  it("switches to the archived tab after clearing all from the inbox", () => {
    expect(getTabAfterClearingAllNotifications("inbox")).toBe("archived");
  });

  it("keeps the archived tab selected when already viewing archived items", () => {
    expect(getTabAfterClearingAllNotifications("archived")).toBe("archived");
  });

  it("disables archived deletion while a notification mutation is in flight", () => {
    expect(
      shouldDisableDeleteAllArchived({
        archivedCount: 2,
        isPending: true,
        isClearing: false,
      }),
    ).toBe(true);
    expect(
      shouldDisableDeleteAllArchived({
        archivedCount: 2,
        isPending: false,
        isClearing: true,
      }),
    ).toBe(true);
  });

  it("allows archived deletion only when items exist and no mutation is pending", () => {
    expect(
      shouldDisableDeleteAllArchived({
        archivedCount: 0,
        isPending: false,
        isClearing: false,
      }),
    ).toBe(true);
    expect(
      shouldDisableDeleteAllArchived({
        archivedCount: 2,
        isPending: false,
        isClearing: false,
      }),
    ).toBe(false);
  });
});
