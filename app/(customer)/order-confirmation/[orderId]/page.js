"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function OrderConfirmationPage({ params }) {
  // In Next.js 15 App Router, unwrapping params can be done via useParams or React.use(params)
  const routeParams = useParams();
  const orderId = routeParams?.orderId || (params ? use(params)?.orderId : "");

  // Compute realistic delivery date window (3-5 days from now)
  const arrivalWindow = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() + 3);
    const end = new Date();
    end.setDate(end.getDate() + 5);

    const monthStart = start.toLocaleDateString("en-US", { month: "short" });
    const monthEnd = end.toLocaleDateString("en-US", { month: "short" });
    const dayStart = start.getDate();
    const dayEnd = end.getDate();

    if (monthStart === monthEnd) {
      return `${monthStart} ${dayStart} – ${dayEnd}`;
    }
    return `${monthStart} ${dayStart} – ${monthEnd} ${dayEnd}`;
  }, []);

  return (
    <div className="min-h-screen bg-[#f2efe6] text-[#0e0e0c] font-['Inter',sans-serif]">
      <div className="max-w-[1180px] mx-auto pt-6 pb-16 px-4 sm:px-6">
        <div className="bg-white rounded-[22px] shadow-[0_20px_60px_-30px_rgba(14,14,12,0.35)] border border-[#e4e0d2] overflow-hidden">
          {/* Top Bar matching reference */}
          <div className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[#e4e0d2]">
            <Link
              href="/"
              className="font-['Space_Grotesk'] font-bold text-[20px] tracking-[0.01em] text-[#0e0e0c]"
            >
              AVEN<span className="text-[#2b2506] bg-[#e7c94a] px-1 rounded-[3px] ml-0.5">.</span>
            </Link>
            <span className="text-[12px] text-[#8f8a7a] font-medium">Order confirmation</span>
            <Link
              href="/"
              className="text-[12.5px] underline text-[#3a382f] hover:text-[#0e0e0c] transition-colors"
            >
              Return to store
            </Link>
          </div>

          {/* Confirmation Content Area matching #page-confirm */}
          <div className="py-16 sm:py-20 px-6 sm:px-10 max-w-[640px] mx-auto text-center">
            {/* Green Success Check Ring */}
            <div className="w-[74px] h-[74px] rounded-full bg-[#e7efe3] flex items-center justify-center mx-auto mb-6 shadow-2xs">
              <svg
                className="w-8 h-8 stroke-[#3f6b46] fill-none stroke-[2]"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 12l2.5 2.5L16 9" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>

            {/* Headline */}
            <h1 className="font-['Space_Grotesk'] font-bold text-[26px] sm:text-[30px] text-[#0e0e0c] mb-2 tracking-tight">
              Order placed. Thank you!
            </h1>
            <p className="text-[13.5px] text-[#8f8a7a] mb-8 leading-relaxed max-w-md mx-auto">
              A confirmation email has been sent to your registered account. We&apos;ll notify you
              the moment your handcrafted footwear ships.
            </p>

            {/* Order Meta Bar */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 mb-8 py-3 px-6 bg-[#faf8f4] border border-[#e4e0d2] rounded-[14px]">
              <div>
                <span className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1 font-medium">
                  Order number
                </span>
                <b className="font-mono text-[14.5px] text-[#0e0e0c]">#AV-{orderId}</b>
              </div>
              <div className="w-[1px] h-8 bg-[#e4e0d2]" />
              <div>
                <span className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1 font-medium">
                  Status
                </span>
                <b className="font-mono text-[14px] text-[#3f6b46] font-semibold">Paid ✓</b>
              </div>
              <div className="w-[1px] h-8 bg-[#e4e0d2]" />
              <div>
                <span className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1 font-medium">
                  Arriving
                </span>
                <b className="font-mono text-[14px] text-[#0e0e0c]">{arrivalWindow}</b>
              </div>
            </div>

            {/* Order Tracking Status Box matching reference */}
            <div className="border border-[#e4e0d2] rounded-[14px] p-5 sm:p-6 text-left mb-8 bg-white">
              <div className="font-['Space_Grotesk'] font-bold text-[14px] text-[#0e0e0c] mb-4">
                Order status
              </div>
              <div className="relative flex justify-between items-start mt-2">
                {/* Horizontal timeline bar */}
                <div className="absolute top-[8px] left-[12px] right-[12px] h-[2px] bg-[#e4e0d2] -z-0" />

                {/* Step 1: Order placed */}
                <div className="flex flex-col items-center gap-2 flex-1 relative z-10 text-center">
                  <div className="w-[18px] h-[18px] rounded-full bg-[#0e0e0c] border-2 border-[#0e0e0c] ring-4 ring-white" />
                  <span className="text-[11px] font-semibold text-[#0e0e0c] leading-tight">
                    Order
                    <br />
                    placed
                  </span>
                </div>

                {/* Step 2: Processing */}
                <div className="flex flex-col items-center gap-2 flex-1 relative z-10 text-center">
                  <div className="w-[18px] h-[18px] rounded-full bg-white border-2 border-[#c9c4b3] ring-4 ring-white" />
                  <span className="text-[11px] text-[#8f8a7a]">Processing</span>
                </div>

                {/* Step 3: Shipped */}
                <div className="flex flex-col items-center gap-2 flex-1 relative z-10 text-center">
                  <div className="w-[18px] h-[18px] rounded-full bg-white border-2 border-[#c9c4b3] ring-4 ring-white" />
                  <span className="text-[11px] text-[#8f8a7a]">Shipped</span>
                </div>

                {/* Step 4: Delivered */}
                <div className="flex flex-col items-center gap-2 flex-1 relative z-10 text-center">
                  <div className="w-[18px] h-[18px] rounded-full bg-white border-2 border-[#c9c4b3] ring-4 ring-white" />
                  <span className="text-[11px] text-[#8f8a7a]">Delivered</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/orders/${orderId}`}
                className="px-7 py-3 rounded-full text-[13px] font-semibold border border-[#e4e0d2] bg-white text-[#0e0e0c] hover:border-[#0e0e0c] transition-colors"
              >
                Track order
              </Link>
              <Link
                href="/"
                className="px-7 py-3 rounded-full text-[13px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
