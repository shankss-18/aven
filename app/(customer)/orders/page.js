"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrdersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account?tab=orders");
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-['Inter',sans-serif]">
      <div className="w-8 h-8 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="font-mono text-[13px] text-[#8f8a7a]">Redirecting to Account Orders...</p>
    </div>
  );
}
