"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import type { ButtonProps } from "~/components/ui/button";
import { Heart } from "lucide-react";
import { useSession } from "~/lib/auth/auth-client";
import { toast } from "sonner";
import { withBadgeToasts } from "~/components/badges/badge-toast";
import { actionToggleWishlist } from "~/server/gear/actions";
import { fetchWishlistStatus } from "~/server/gear/service";

export function AddToWishlistButton({
  slug,
  name,
  size = "sm",
  className,
  stopPropagation = true,
  showLabel = false,
  variant = "secondary",
}: {
  slug: string;
  name?: string;
  size?: "sm" | "md";
  className?: string;
  /** When rendered inside a link, prevent navigation */
  stopPropagation?: boolean;
  /** Whether to show a visible text label next to the icon */
  showLabel?: boolean;
  /** Button visual variant; defaults to current secondary style */
  variant?: ButtonProps["variant"];
}) {
  const { data } = useSession();
  const session = data?.session;
  const user = data?.user;
  
  const [inWishlist, setInWishlist] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch wishlist status when session is available
  useEffect(() => {
    if (!session) {
      setInWishlist(null);
      return;
    }

    let mounted = true;
    
    fetchWishlistStatus(slug)
      .then((res) => {
        if (mounted && res) {
          setInWishlist(res.inWishlist);
        }
      })
      .catch(() => {
        if (mounted) {
          setInWishlist(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [slug, session]);

  const handleToggle = async () => {
    if (!session || !user || inWishlist === null || loading) return;

    setLoading(true);
    
    const action = inWishlist ? "remove" : "add";
    const wasInWishlist = inWishlist;
    const gearName = name ?? "Item";
    const promise = actionToggleWishlist(slug, action);

    toast.promise(promise, {
      loading: wasInWishlist ? `Removing ${gearName}...` : `Adding ${gearName}...`,
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
        }
        return {
          message: "Failed to update wishlist",
        };
      },
      error: `Failed to update wishlist`,
    });

    try {
      await withBadgeToasts(promise);
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
  const disabled = inWishlist === null || loading;

  return (
    <Button
      variant={variant}
      size={size === "sm" ? "sm" : "default"}
      className={className}
      disabled={disabled}
      loading={loading}
      icon={active ? <Heart className="h-4 w-4 fill-current" /> : <Heart className="h-4 w-4" />}
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
          "In Wishlist"
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
