"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export function UserListsSectionDeferred({
  profileUserId,
}: UserListsSectionDeferredProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<UserListsResponse | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || shouldLoad) return;

    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldLoad]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        profileUserId,
      });
      const response = await fetch(
        `/api/user-lists/profile?${query.toString()}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load lists");
      }

      const data = (await response.json()) as UserListsResponse;
      setPayload(data);
    } catch {
      setError("Unable to load lists right now.");
    } finally {
      setIsLoading(false);
    }
  }, [profileUserId]);

  useEffect(() => {
    if (!shouldLoad || payload || isLoading) return;
    void load();
  }, [shouldLoad, payload, isLoading, load]);

  return (
    <div ref={containerRef}>
      {payload ? (
        <UserListsSection initialLists={payload.lists} myProfile={payload.myProfile} />
      ) : (
        <div className="space-y-2 rounded-lg border border-dashed p-6">
          <p className="text-sm font-medium">Lists</p>
          <p className="text-muted-foreground text-sm">
            {error
              ? error
              : isLoading || shouldLoad
                ? "Loading lists..."
                : "Lists load as you scroll."}
          </p>
          {error ? (
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
