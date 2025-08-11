"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Heart, CheckCircle, Plus, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface GearActionButtonsProps {
  slug: string;
}

export function GearActionButtons({ slug }: GearActionButtonsProps) {
  const { data: session, status } = useSession();
  const [inWishlist, setInWishlist] = useState(false);
  const [isOwned, setIsOwned] = useState(false);
  const [loading, setLoading] = useState({
    wishlist: false,
    ownership: false,
  });

  // Check initial state when component mounts
  useEffect(() => {
    if (session?.user && status === "authenticated") {
      checkWishlistStatus();
      checkOwnershipStatus();
    }
  }, [session, status, slug]);

  const checkWishlistStatus = async () => {
    try {
      const response = await fetch(`/api/gear/${slug}/wishlist`);
      if (response.ok) {
        const data = await response.json();
        setInWishlist(data.inWishlist);
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

  const checkOwnershipStatus = async () => {
    try {
      const response = await fetch(`/api/gear/${slug}/ownership`);
      if (response.ok) {
        const data = await response.json();
        setIsOwned(data.isOwned);
      }
    } catch (error) {
      console.error("Error checking ownership status:", error);
    }
  };

  const handleWishlistToggle = async () => {
    if (!session?.user) return;

    setLoading((prev) => ({ ...prev, wishlist: true }));
    try {
      const action = inWishlist ? "remove" : "add";
      const response = await fetch(`/api/gear/${slug}/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();
        setInWishlist(!inWishlist);

        if (data.action === "added") {
          toast.success("Added to wishlist");
        } else {
          toast.success("Removed from wishlist");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update wishlist");
      }
    } catch (error) {
      toast.error("Failed to update wishlist");
    } finally {
      setLoading((prev) => ({ ...prev, wishlist: false }));
    }
  };

  const handleOwnershipToggle = async () => {
    if (!session?.user) return;

    setLoading((prev) => ({ ...prev, ownership: true }));
    try {
      const action = isOwned ? "remove" : "add";
      const response = await fetch(`/api/gear/${slug}/ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsOwned(!isOwned);

        if (data.action === "added") {
          toast.success("Added to collection");
        } else {
          toast.success("Removed from collection");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update collection");
      }
    } catch (error) {
      toast.error("Failed to update collection");
    } finally {
      setLoading((prev) => ({ ...prev, ownership: false }));
    }
  };

  // Don't show buttons if not authenticated
  if (status === "loading") {
    return (
      <div className="space-y-3 pt-4">
        <div className="h-10 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-10 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="pt-4">
        <Button variant="outline" className="w-full" disabled>
          Sign in to interact with gear
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      {/* Wishlist Button */}
      <Button
        variant={inWishlist ? "default" : "outline"}
        className={`w-full ${
          inWishlist
            ? "bg-red-600 text-white hover:bg-red-700"
            : "hover:border-red-200 hover:bg-red-50"
        }`}
        onClick={handleWishlistToggle}
        loading={loading.wishlist}
        icon={inWishlist ? <Heart className="fill-current" /> : <Heart />}
      >
        {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
      </Button>

      {/* Ownership Button */}
      <Button
        variant={isOwned ? "default" : "outline"}
        className={`w-full ${
          isOwned
            ? "bg-green-600 text-white hover:bg-green-700"
            : "hover:border-green-200 hover:bg-green-50"
        }`}
        onClick={handleOwnershipToggle}
        loading={loading.ownership}
        icon={isOwned ? <CheckCircle className="fill-current" /> : <Plus />}
      >
        {isOwned ? "Remove from Collection" : "Add to Collection"}
      </Button>

      {/* Profile Link */}
      <Link href={`/u/${session.user.id}`} className="block">
        <Button
          variant="ghost"
          className="w-full text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"
          icon={<User className="h-4 w-4" />}
        >
          View My Collection
        </Button>
      </Link>
    </div>
  );
}
