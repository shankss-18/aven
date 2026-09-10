"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch, getToken } from "@/lib/apiClient";

export function useWishlistCount() {
  const [wishlistCount, setWishlistCount] = useState(0);

  const fetchCount = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setWishlistCount(0);
      return;
    }

    try {
      const res = await apiFetch("/api/wishlist");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          setWishlistCount(data.items.length);
        } else {
          setWishlistCount(0);
        }
      } else {
        setWishlistCount(0);
      }
    } catch (err) {
      console.error("Failed to load wishlist count:", err);
      setWishlistCount(0);
    }
  }, []);

  useEffect(() => {
    fetchCount();

    const handleUpdate = () => fetchCount();
    window.addEventListener("wishlist-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("wishlist-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [fetchCount]);

  return wishlistCount;
}

export function notifyWishlistUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("wishlist-updated"));
  }
}
