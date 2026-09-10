"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="w-full border-b border-[#e4e0d2] bg-white overflow-hidden min-h-[calc(100vh-73px)] lg:h-[calc(100vh-73px)] flex flex-col items-center justify-center relative px-6 py-8 sm:py-10">
      {/* Full-width centered layout */}
      <div className="max-w-4xl mx-auto px-6 sm:px-10 flex flex-col items-center text-center gap-5 sm:gap-6 w-full">

        {/* Tag line */}
        <div
          className="flex items-center gap-2.5"
          style={{ animation: "heroFadeUp 0.55s ease both 0.05s", opacity: 0 }}
        >
          <span
            className="block h-px bg-[#0e0e0c]"
            style={{ width: 28, animation: "expandLine 0.5s ease both 0.4s", transform: "scaleX(0)", transformOrigin: "left" }}
          />
          <span className="text-[11px] uppercase tracking-[0.22em] text-[#8f8a7a] font-semibold">
            FW26 Collection
          </span>
          <span
            className="block h-px bg-[#0e0e0c]"
            style={{ width: 28, animation: "expandLine 0.5s ease both 0.4s", transform: "scaleX(0)", transformOrigin: "right" }}
          />
        </div>

        {/* Big headline */}
        <div style={{ animation: "heroFadeUp 0.65s ease both 0.15s", opacity: 0 }}>
          <h1
            className="font-bold text-[#0e0e0c] tracking-tight leading-[1.04]"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2.4rem, 5.2vw, 4.4rem)" }}
          >
            Built for{" "}
            <span className="relative inline-block whitespace-nowrap">
              <em className="not-italic">the ground</em>
              {/* Animated yellow underline */}
              <svg
                aria-hidden="true"
                className="absolute left-0 w-full pointer-events-none"
                viewBox="0 0 400 12"
                preserveAspectRatio="none"
                style={{ bottom: "-4px", height: "8px" }}
              >
                <path
                  d="M2 7 C60 2, 130 10, 200 5 C270 1, 340 9, 398 6"
                  fill="none"
                  stroke="#e7c94a"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 500,
                    strokeDashoffset: 500,
                    animation: "drawUnderline 1s cubic-bezier(0.4,0,0.2,1) both 0.7s",
                  }}
                />
              </svg>
            </span>
            <br />
            you cover.
          </h1>
        </div>

        {/* Sub-copy */}
        <p
          className="text-[#5a5744] max-w-[540px] leading-relaxed text-[14px] sm:text-[15.5px]"
          style={{ animation: "heroFadeUp 0.65s ease both 0.3s", opacity: 0 }}
        >
          Full-grain leather, reinforced stitching, and soles engineered for pavement and trail alike.{" "}
          <span className="text-[#0e0e0c] font-semibold">Considered footwear, made to be worn in.</span>
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 mt-1"
          style={{ animation: "heroFadeUp 0.65s ease both 0.42s", opacity: 0 }}
        >
          <Link
            href="/products"
            className="group inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-[13.5px] font-semibold bg-[#0e0e0c] text-[#f2efe6] border border-[#0e0e0c] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 shadow-md"
          >
            <span>Shop the collection</span>
            <svg
              className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.5] group-hover:translate-x-1 transition-transform duration-200"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-[13.5px] font-semibold bg-transparent text-[#0e0e0c] border border-[#c9c4b3] hover:border-[#0e0e0c] hover:bg-[#f5f3ea] transition-all duration-200"
          >
            Explore Catalog →
          </Link>
        </div>

        {/* Stats row */}
        <div
          className="flex items-center justify-center gap-8 sm:gap-12 mt-2"
          style={{ animation: "heroFadeUp 0.65s ease both 0.55s", opacity: 0 }}
        >
          {[
            { val: "12K+", label: "Pairs sold" },
            { val: "4.9★", label: "Avg. rating" },
            { val: "Free", label: "Returns" },
          ].map((chip) => (
            <div key={chip.label} className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-[16px] sm:text-[18px] font-bold text-[#0e0e0c]">{chip.val}</span>
              <span className="text-[10.5px] sm:text-[11px] text-[#8f8a7a] font-medium tracking-wide">{chip.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint pinned at bottom */}
      <div
        className="hidden sm:flex flex-col items-center gap-1.5 absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ animation: "heroFadeUp 0.5s ease both 0.8s", opacity: 0 }}
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9c4b3]">Scroll to explore</span>
        <div className="w-px h-6 bg-gradient-to-b from-[#c9c4b3] to-transparent" style={{ animation: "scrollPulse 2s ease-in-out infinite" }} />
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawUnderline {
          to { stroke-dashoffset: 0; }
        }
        @keyframes expandLine {
          to { transform: scaleX(1); }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.15); }
        }
      `}</style>
    </section>
  );
}
