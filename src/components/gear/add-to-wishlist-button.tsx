"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import type { ButtonProps } from "~/components/ui/button";
import { Heart } from "lucide-react";
import { useSession } from "~/lib/auth/auth-client";
import { toast } from "sonner";
import { withBadgeToasts } from "~/components/badges/badge-toast";
import { actionToggleWishlist } from "~/server/gear/actions";

export function AddToWishlistButton({
  slug,
  name,
  initialInWishlist = null,
  size = "sm",
  className,
  stopPropagation = true,
  showLabel = false,
  variant = "secondary",
  fullWidth = false,
}: {
  slug: string;
  name?: string;
  /** Initial wishlist state from server (optional, for gear detail page) */
  initialInWishlist?: boolean | null;
  size?: "sm" | "md";
  className?: string;
  /** When rendered inside a link, prevent navigation */
  stopPropagation?: boolean;
  /** Whether to show a visible text label next to the icon */
  showLabel?: boolean;
  /** Button visual variant */
  variant?: ButtonProps["variant"];
  /** Whether button should take full width */
  fullWidth?: boolean;
}) {
  const { data } = useSession();
  const session = data?.session;
  const user = data?.user;

  const [inWishlist, setInWishlist] = useState<boolean | null>(
    initialInWishlist,
  );
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!session || !user || loading) return;

    setLoading(true);

    // Optimistically determine action based on current state
    // If we don't know the state (null), assume we're adding
    const action = inWishlist ? "remove" : "add";
    const wasInWishlist = inWishlist;
    const gearName = name ?? "Item";
    const promise = actionToggleWishlist(slug, action);

    toast.promise(promise, {
      loading: inWishlist ? `Removing ${gearName}...` : `Adding ${gearName}...`,
      success: (res) => {
        if (res.ok && res.action === "added") {
          setInWishlist(true);
          // Optimistic stats update event
          window.dispatchEvent(
            new CustomEvent("gear:wishlist", { detail: { delta: 1, slug } }),
          );

          return {
            message: "Added to wishlist",
            description: `${gearName} added to your wishlist`,
            action: {
              label: "View Profile",
              onClick: () => {
                window.location.href = `/u/${user.id}`;
              },
            },
          };
        } else if (res.ok && res.action === "removed") {
          setInWishlist(false);
          // Optimistic stats update event
          window.dispatchEvent(
            new CustomEvent("gear:wishlist", { detail: { delta: -1, slug } }),
          );

          return {
            message: "Removed from wishlist",
          };
        } else if (!res.ok && res.reason === "already_in_wishlist") {
          // Item was already in wishlist, update state and show appropriate message
          setInWishlist(true);
          return {
            message: "Already in wishlist",
          };
        }
        return {
          message: "Failed to update wishlist",
        };
      },
      error: `Failed to update wishlist`,
    });

    try {
      const res = await withBadgeToasts(promise);
      if (!res.ok && res.reason !== "already_in_wishlist") {
        setInWishlist(wasInWishlist); // Reset state on failure
      }
    } catch (error) {
      setInWishlist(wasInWishlist); // Reset state on error
    } finally {
      setLoading(false);
    }
  };

  // Not logged in - don't show the button
  if (!session) {
    return null;
  }

  const active = inWishlist === true;

  // Dynamic variant: if initialInWishlist is provided (gear detail page),
  // use "default" when active, "outline" when not
  const effectiveVariant =
    initialInWishlist !== null && variant === "outline"
      ? active
        ? "default"
        : "outline"
      : variant;

  return (
    // Loading prop handles disabled state for the button
    <Button
      variant={effectiveVariant}
      size={size === "sm" ? "sm" : "default"}
      className={fullWidth ? "w-full" : className}
      loading={loading}
      icon={
        active ? (
          <Heart className="h-4 w-4 fill-current" />
        ) : (
          <Heart className="h-4 w-4" />
        )
      }
      onClick={(e) => {
        if (stopPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
        void handleToggle();
      }}
    >
      {showLabel ? (
        active ? (
          "Remove from Wishlist"
        ) : (
          "Add to Wishlist"
        )
      ) : (
        <span className="sr-only">
          {active ? "Remove from wishlist" : "Add to wishlist"}
        </span>
      )}
    </Button>
  );
}
