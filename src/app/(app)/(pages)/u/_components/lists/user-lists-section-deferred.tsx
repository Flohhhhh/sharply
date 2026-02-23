"use client";

import useSWR from "swr";
import { Button } from "~/components/ui/button";
import { UserListsSection } from "./user-lists-section";
import type { ProfileUserListState } from "./types";

type UserListsSectionDeferredProps = {
  profileUserId: string;
};

type UserListsResponse = {
  lists: ProfileUserListState[];
  myProfile: boolean;
};

const fetcher = async (url: string): Promise<UserListsResponse> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load lists");
  }
  return (await response.json()) as UserListsResponse;
};

export function UserListsSectionDeferred({
  profileUserId,
}: UserListsSectionDeferredProps) {
  const query = new URLSearchParams({ profileUserId });
  const { data, error, isLoading, mutate } = useSWR<UserListsResponse>(
    `/api/user-lists/profile?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
    },
  );

  return (
    <div>
      {data ? (
        <UserListsSection
          initialLists={data.lists}
          myProfile={data.myProfile}
          onListsChanged={() => {
            void mutate();
          }}
        />
      ) : (
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
      )}
    </div>
  );
}
