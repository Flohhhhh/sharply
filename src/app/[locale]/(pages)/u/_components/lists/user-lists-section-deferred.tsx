"use client";

import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Button } from "~/components/ui/button";
import type { ProfileUserListState } from "./types";
import { UserListsSection } from "./user-lists-section";

type UserListsSectionDeferredProps = {
  initialData: UserListsResponse;
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
  initialData,
  profileUserId,
  myProfile,
  profileName,
}: UserListsSectionDeferredProps) {
  const t = useTranslations("userProfile");
  const query = new URLSearchParams({ profileUserId }).toString();
  const { data, error, isLoading, mutate } = useSWR<UserListsResponse>(
    `/api/user-lists/profile?${query}`,
    fetcher,
    {
      fallbackData: initialData,
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
    const displayName = profileName?.trim() || t("listsThisUser");

    return (
      <div>
        <div className="space-y-2 rounded-lg border border-dashed p-6">
          <p className="text-sm font-medium">{t("listsTitle")}</p>
          <p className="text-muted-foreground text-sm">
            {t("listsLoadPublicErrorNamed", { name: displayName })}
          </p>
          <Button
            size="sm"
            variant="outline"
            loading={isLoading}
            onClick={() => {
              void mutate();
            }}
          >
            {t("listsRetry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2 rounded-lg border border-dashed p-6">
        <p className="text-sm font-medium">{t("listsTitle")}</p>
        <p className="text-muted-foreground text-sm">
          {error ? t("listsLoadError") : t("listsLoading")}
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
            {t("listsRetry")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
