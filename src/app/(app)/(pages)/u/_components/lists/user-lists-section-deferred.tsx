"use client";

import useSWR from "swr";
import { Button } from "~/components/ui/button";
import { UserListsSection } from "./user-lists-section";
import type { ProfileUserListState } from "./types";

type UserListsSectionDeferredProps = {
  profileUserId: string;
  myProfile: boolean;
  profileName?: string | null;
};

type UserListsResponse = {
  lists: ProfileUserListState[];
  myProfile: boolean;
};

function buildListsStateKey({
  lists,
  myProfile,
}: UserListsResponse) {
  return [
    myProfile ? "owner" : "public",
    ...lists.map((list) => `${list.id}:${String(list.updatedAt)}`),
  ].join("|");
}

const fetcher = async (url: string): Promise<UserListsResponse> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load lists");
  }
  return (await response.json()) as UserListsResponse;
};

export function UserListsSectionDeferred({
  profileUserId,
  myProfile,
  profileName,
}: UserListsSectionDeferredProps) {
  const query = new URLSearchParams({ profileUserId }).toString();
  const { data, error, isLoading, mutate } = useSWR<UserListsResponse>(
    `/api/user-lists/profile?${query}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
    },
  );

  if (data) {
    return (
      <div>
        <UserListsSection
          key={buildListsStateKey(data)}
          initialLists={data.lists}
          myProfile={data.myProfile}
          profileName={profileName}
          onListsChanged={() => {
            void mutate();
          }}
        />
      </div>
    );
  }

  if (error && !myProfile) {
    const displayName = profileName?.trim() || "This user";

    return (
      <div>
        <div className="space-y-2 rounded-lg border border-dashed p-6">
          <p className="text-sm font-medium">Lists</p>
          <p className="text-muted-foreground text-sm">
            {`Unable to load ${displayName}'s public lists right now.`}
          </p>
          <Button
            size="sm"
            variant="outline"
            loading={isLoading}
            onClick={() => {
              void mutate();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2 rounded-lg border border-dashed p-6">
        <p className="text-sm font-medium">Lists</p>
        <p className="text-muted-foreground text-sm">
          {error ? "Unable to load lists right now." : "Loading lists..."}
        </p>
        {error ? (
          <Button
            size="sm"
            variant="outline"
            loading={isLoading}
            onClick={() => {
              void mutate();
            }}
          >
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
