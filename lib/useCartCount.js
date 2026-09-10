"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch, getToken } from "@/lib/apiClient";

export function useCartCount() {
  const [cartCount, setCartCount] = useState(0);

  const fetchCount = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const res = await apiFetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          const total = data.items.reduce(
            (sum, item) => sum + (Number(item.quantity) || 0),
            0
          );
          setCartCount(total);
        } else {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    } catch (err) {
      console.error("Failed to load cart count:", err);
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    fetchCount();

    const handleUpdate = () => fetchCount();
    window.addEventListener("cart-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [fetchCount]);

  return cartCount;
}

export function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}
