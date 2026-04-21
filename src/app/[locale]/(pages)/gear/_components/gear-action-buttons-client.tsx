"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { useSession } from "~/lib/auth/auth-client";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import {
  Bookmark,
  ChevronDown,
  Heart,
  Package,
  PackageOpen,
} from "lucide-react";
import { toast } from "sonner";
import { withBadgeToasts } from "~/components/badges/badge-toast";
import { CompareButton } from "~/components/compare/compare-button";
import { AddToWishlistButton } from "~/components/gear/add-to-wishlist-button";
import { SaveItemButton } from "~/components/gear/save-item-button";
import { actionToggleOwnership } from "~/server/gear/actions";
import { fetchJson } from "~/lib/fetch-json";
import { useGearDisplayName } from "~/lib/hooks/useGearDisplayName";
import type { GearAlias } from "~/types/gear";

interface GearActionButtonsClientProps {
  slug: string;
  name: string;
  regionalAliases?: GearAlias[] | null;
  gearType?: string | null;
  initialIsAuthenticated: boolean;
  initialInWishlist?: boolean | null;
  initialIsOwned?: boolean | null;
  initialSaveState?: {
    lists: Array<{
      id: string;
      name: string;
      isDefault: boolean;
      itemCount: number;
    }>;
    savedListIds: string[];
    defaultListId: string | null;
  } | null;
}

type GearActionSaveState = Exclude<
  GearActionButtonsClientProps["initialSaveState"],
  undefined
>;

type GearActionUserState = {
  inWishlist: boolean | null;
  isOwned: boolean | null;
  saveState: GearActionSaveState;
};

function GearCompareActionButton({
  slug,
  name,
  gearType,
}: Pick<GearActionButtonsClientProps, "slug" | "gearType"> & {
  name: string;
}) {
  return (
    <CompareButton
      slug={slug}
      name={name}
      gearType={gearType}
      size="md"
      variant="outline"
      className="w-full justify-start"
      showLabel
    />
  );
}

export function GearActionButtonsClient({
  slug,
  name,
  regionalAliases,
  gearType,
  initialIsAuthenticated,
  initialInWishlist = null,
  initialIsOwned = null,
  initialSaveState = null,
}: GearActionButtonsClientProps) {
  const t = useTranslations("gearDetail");
  const { data, isPending } = useSession();
  const displayName = useGearDisplayName({ name, regionalAliases });

  const session = data?.session;
  const activeUserId = session?.userId ?? null;
  const fetchKey = activeUserId ? `${activeUserId}:${slug}` : null;
  const callbackUrl = `/gear/${slug}`;
  const signInUrl = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const [userState, setUserState] = useState<GearActionUserState>(() => ({
    inWishlist: initialInWishlist,
    isOwned: initialIsOwned,
    saveState: initialSaveState ?? null,
  }));
  const [fetchedKey, setFetchedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    ownership: false,
  });
  const missingInitialState =
    userState.inWishlist === null ||
    userState.isOwned === null ||
    userState.saveState === null;
  const shouldHydrateUserState = Boolean(
    fetchKey && fetchedKey !== fetchKey && missingInitialState,
  );
  const { data: hydratedUserState, isLoading: isHydratingUserState } = useSWR<{
    inWishlist: boolean | null;
    isOwned: boolean | null;
    saveState: GearActionSaveState;
  }>(
    shouldHydrateUserState
      ? `/api/gear/${encodeURIComponent(slug)}/user-state`
      : null,
    (url: string) =>
      fetchJson<{
        inWishlist: boolean | null;
        isOwned: boolean | null;
        saveState: GearActionSaveState;
      }>(url, {
        credentials: "same-origin",
        cache: "no-store",
      }),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      shouldRetryOnError: false,
    },
  );

  useEffect(() => {
    if (!fetchKey) {
      setFetchedKey(null);
      return;
    }

    if (!missingInitialState) {
      setFetchedKey(fetchKey);
      return;
    }

    if (!hydratedUserState) return;

    setUserState({
      inWishlist: hydratedUserState.inWishlist,
      isOwned: hydratedUserState.isOwned,
      saveState: hydratedUserState.saveState ?? null,
    });
    setFetchedKey(fetchKey);
  }, [fetchKey, fetchedKey, hydratedUserState, missingInitialState]);

  const { inWishlist, isOwned, saveState } = userState;
  const saveButtonActive = (saveState?.savedListIds.length ?? 0) > 0;
  const wishlistActive = inWishlist === true;

  const handleRequireAuthInteraction = () => {
    if (isPending) return;
    window.location.href = signInUrl;
  };

  const handleOwnershipToggle = async () => {
    if (!session) {
      handleRequireAuthInteraction();
      return;
    }
    if (isOwned === null) return;

    setLoading((prev) => ({ ...prev, ownership: true }));
    try {
      const action = isOwned ? "remove" : ("add" as const);
      const res = await withBadgeToasts(actionToggleOwnership(slug, action));
      if (res.ok) {
        setUserState((prev) => ({ ...prev, isOwned: !isOwned }));

        // Optimistic stats update event
        const delta = res.action === "added" ? 1 : -1;
        window.dispatchEvent(
          new CustomEvent("gear:ownership", { detail: { delta, slug } }),
        );

        if (res.action === "added") {
          toast.success(t("addedToCollection"));
        } else {
          toast.success(t("removedFromCollection"));
        }
      } else {
        toast.error(t("failedToUpdateCollection"));
      }
    } catch {
      toast.error(t("failedToUpdateCollection"));
    } finally {
      setLoading((prev) => ({ ...prev, ownership: false }));
    }
  };

  const renderPendingAuthenticatedButtons = () => (
    <div className="space-y-2 pt-4">
      <ButtonGroup className="w-full">
        <Button
          type="button"
          variant={saveButtonActive ? "default" : "outline"}
          className="flex-1 justify-start"
          disabled
          icon={<Bookmark className={saveButtonActive ? "fill-current" : ""} />}
        >
          {saveButtonActive ? t("saved") : t("saveItem")}
        </Button>
        <Button
          type="button"
          variant={saveButtonActive ? "default" : "outline"}
          size="icon"
          disabled
        >
          <ChevronDown className="size-4" />
          <span className="sr-only">{t("chooseList")}</span>
        </Button>
      </ButtonGroup>

      <Button
        variant={wishlistActive ? "default" : "outline"}
        className="w-full justify-start"
        disabled
        icon={
          wishlistActive ? (
            <Heart className="h-4 w-4 fill-current" />
          ) : (
            <Heart className="h-4 w-4" />
          )
        }
      >
        {wishlistActive ? t("removeFromWishlist") : t("addToWishlist")}
      </Button>

      <Button
        variant={isOwned ? "default" : "outline"}
        className="w-full justify-start"
        disabled
        icon={isOwned ? <Package /> : <PackageOpen />}
      >
        {isOwned ? t("removeFromCollection") : t("addToCollection")}
      </Button>

      <GearCompareActionButton
        slug={slug}
        name={displayName}
        gearType={gearType}
      />
    </div>
  );

  const renderSignedOutButtons = (authButtonsDisabled: boolean) => (
    <div className="space-y-2 pt-4">
      <Button
        variant="outline"
        className="w-full justify-start"
        icon={<Bookmark />}
        onClick={handleRequireAuthInteraction}
        disabled={authButtonsDisabled}
      >
        {t("saveItem")}
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        icon={<Heart />}
        onClick={handleRequireAuthInteraction}
        disabled={authButtonsDisabled}
      >
        {t("addToWishlist")}
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        icon={<PackageOpen />}
        onClick={handleRequireAuthInteraction}
        disabled={authButtonsDisabled}
      >
        {t("addToCollection")}
      </Button>

      <GearCompareActionButton
        slug={slug}
        name={displayName}
        gearType={gearType}
      />
    </div>
  );

  if (isPending) {
    if (initialIsAuthenticated) {
      return renderPendingAuthenticatedButtons();
    }
    return renderSignedOutButtons(true);
  }

  if (!session) {
    return renderSignedOutButtons(false);
  }

  if (isHydratingUserState) {
    return renderPendingAuthenticatedButtons();
  }

  const ownedActive = isOwned === true;

  return (
    <div className="space-y-2 pt-4">
      {/* Save Item Button */}
      <SaveItemButton
        key={`${fetchKey ?? "anonymous"}:${saveState?.savedListIds.join(",") ?? "none"}`}
        slug={slug}
        initialState={saveState}
        onStateChange={(nextState) =>
          setUserState((prev) => ({ ...prev, saveState: nextState }))
        }
      />

      {/* Wishlist Button */}
      <AddToWishlistButton
        key={`${fetchKey ?? "anonymous"}:${String(inWishlist)}`}
        slug={slug}
        initialInWishlist={inWishlist}
        size="md"
        variant="outline"
        className="w-full justify-start"
        showLabel
      />

      {/* Ownership Button */}
      <Button
        variant={!ownedActive ? "outline" : "default"}
        className="w-full justify-start"
        onClick={handleOwnershipToggle}
        loading={loading.ownership}
        disabled={isOwned === null}
        icon={ownedActive ? <Package /> : <PackageOpen />}
      >
        {ownedActive ? t("removeFromCollection") : t("addToCollection")}
      </Button>

      {/* Compare Button */}
      <GearCompareActionButton
        slug={slug}
        name={displayName}
        gearType={gearType}
      />
    </div>
  );
}
