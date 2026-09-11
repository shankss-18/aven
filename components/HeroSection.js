"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   AVEN Hero Section — White background, floating shoe on white
   Interactive scroll effects + luxury typography shimmer + 3D depth
───────────────────────────────────────────────────────────────────────────── */

const TICKER_ITEMS = [
  "FW26 Collection",
  "Free Returns",
  "Full-Grain Leather",
  "Handcrafted",
  "EU Sizing",
  "12K+ Pairs Sold",
  "Considered Footwear",
  "4.9★ Rating",
  "Free Delivery over ₹2,500",
];

export default function HeroSection() {
  const shoeParallaxRef = useRef(null);
  const textParallaxRef = useRef(null);
  const glowRef = useRef(null);
  const badgeTopRef = useRef(null);
  const badgeBottomRef = useRef(null);
  const scrollCueRef = useRef(null);

  /* Combined Scroll Parallax & Mouse Tracking (60/120 FPS via RAF) */
  useEffect(() => {
    const hero = document.getElementById("aven-hero");
    if (!hero) return;

    let mouseX = 0;
    let mouseY = 0;
    let scrollY = 0;
    let rafId = null;

    const updateTransforms = () => {
      // 1. Shoe Parallax (Mouse + Scroll)
      if (shoeParallaxRef.current) {
        const scrollOffsetY = scrollY * -0.32; // Glides upward on scroll
        const scrollRotate = Math.max(-14, Math.min(2, -7 + scrollY * -0.012));
        const scrollScale = Math.min(1.08, 1 + scrollY * 0.0002);
        const tx = mouseX * 20;
        const ty = mouseY * 14 + scrollOffsetY;

        shoeParallaxRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0px) rotate(${scrollRotate}deg) scale(${scrollScale})`;
      }

      // 2. Text Parallax (Gentle drift + subtle fade on deep scroll)
      if (textParallaxRef.current) {
        const textOffset = scrollY * 0.16;
        const textOpacity = Math.max(0.15, 1 - scrollY / 650);
        textParallaxRef.current.style.transform = `translate3d(0px, ${textOffset}px, 0px)`;
        textParallaxRef.current.style.opacity = textOpacity;
      }

      // 3. Ambient Glow Expansion
      if (glowRef.current) {
        const glowScale = 1 + scrollY * 0.0006;
        const glowOpacity = Math.min(0.42, 0.22 + scrollY * 0.0003);
        glowRef.current.style.transform = `scale(${glowScale})`;
        glowRef.current.style.opacity = glowOpacity;
      }

      // 4. Badges Counter-Parallax (Opposite float for 3D hologram effect)
      if (badgeTopRef.current) {
        const bTopY = scrollY * -0.18 + mouseY * -8;
        badgeTopRef.current.style.transform = `translate3d(${mouseX * -10}px, ${bTopY}px, 0px)`;
      }
      if (badgeBottomRef.current) {
        const bBottomY = scrollY * -0.22 + mouseY * -6;
        badgeBottomRef.current.style.transform = `translate3d(${mouseX * -8}px, ${bBottomY}px, 0px)`;
      }

      // 5. Scroll Prompt Fade Out
      if (scrollCueRef.current) {
        const cueOpacity = Math.max(0, 1 - scrollY / 45);
        scrollCueRef.current.style.opacity = cueOpacity;
        scrollCueRef.current.style.pointerEvents = cueOpacity <= 0 ? "none" : "auto";
      }

      rafId = null;
    };

    const onScroll = () => {
      scrollY = window.scrollY || 0;
      if (!rafId) rafId = requestAnimationFrame(updateTransforms);
    };

    const onMouseMove = (e) => {
      const rect = hero.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX = (e.clientX - cx) / rect.width;
      mouseY = (e.clientY - cy) / rect.height;
      if (!rafId) rafId = requestAnimationFrame(updateTransforms);
    };

    const onMouseLeave = () => {
      mouseX = 0;
      mouseY = 0;
      if (!rafId) rafId = requestAnimationFrame(updateTransforms);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    if (window.matchMedia("(pointer: fine)").matches) {
      hero.addEventListener("mousemove", onMouseMove, { passive: true });
      hero.addEventListener("mouseleave", onMouseLeave);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      hero.removeEventListener("mousemove", onMouseMove);
      hero.removeEventListener("mouseleave", onMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <style>{`
        /* Open Page Animation: Text Fade In from Top */
        @keyframes av-fadeDown {
          from {
            opacity: 0;
            transform: translate3d(0, -32px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        /* Continuous Ice Blue & Metallic Shimmer */
        @keyframes av-textShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .av-shimmer-headline {
          background: linear-gradient(
            110deg,
            #0e0e0c 0%,
            #0e0e0c 32%,
            #5a7a8a 46%,
            #9DB7C5 50%,
            #5a7a8a 54%,
            #0e0e0c 68%,
            #0e0e0c 100%
          );
          background-size: 260% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: av-textShimmer 9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* Continuous vertical float */
        @keyframes av-shoeFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }

        /* Underline dynamic glow */
        @keyframes av-markerGlow {
          0%, 100% { opacity: 0.95; filter: drop-shadow(0 1px 6px rgba(157,183,197,0.45)); }
          50%       { opacity: 1; filter: drop-shadow(0 3px 12px rgba(157,183,197,0.8)); }
        }

        @keyframes av-underline {
          from { width: 0; }
          to   { width: 100%; }
        }

        @keyframes av-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @keyframes av-glowPulse {
          0%, 100% { opacity: 0.22; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(1.05); }
        }

        @keyframes av-scrollBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(5px); opacity: 1; }
        }

        .av-shoe-float {
          animation: av-shoeFloat 5.5s ease-in-out infinite;
          transform-origin: center center;
          will-change: transform;
        }
        .av-ticker-track {
          animation: av-ticker 32s linear infinite;
          will-change: transform;
        }
        .av-ticker-track:hover { animation-play-state: paused; }
        .av-glow {
          animation: av-glowPulse 4.5s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .av-scroll-arrow {
          animation: av-scrollBounce 1.8s ease-in-out infinite;
        }
        .av-marker-glow {
          animation: av-markerGlow 3.5s ease-in-out infinite;
        }
      `}</style>

      <section
        id="aven-hero"
        className="relative w-full bg-white overflow-hidden border-b border-[#e4e0d2]"
        style={{ minHeight: "calc(100vh - 65px)" }}
        aria-label="AVEN Hero — Premium Footwear"
      >
        {/* ── Subtle dot-grid background texture ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(14,14,12,0.055) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 1,
          }}
        />

        {/* ── Main two-column layout ── */}
        <div
          className="relative z-10 flex flex-col lg:flex-row items-center w-full max-w-[1360px] mx-auto px-5 sm:px-10 xl:px-16 pt-4 pb-10 lg:py-0"
          style={{ minHeight: "calc(100vh - 65px)" }}
        >
          {/* ═══════════════════════════════
              LEFT — Text Content (Parallax Drift)
          ═══════════════════════════════ */}
          <div
            ref={textParallaxRef}
            className="flex flex-col justify-center w-full lg:w-1/2 order-2 lg:order-1 pb-6 lg:pb-0 lg:pr-12 will-change-transform transition-opacity duration-150"
          >
            {/* Season label */}
            <div
              className="flex items-center gap-3 mb-5 lg:mb-6"
              style={{ animation: "av-fadeDown 0.75s cubic-bezier(0.16, 1, 0.3, 1) both 0.08s" }}
            >
              <span className="h-px bg-[#0e0e0c] w-7 block" />
              <span className="text-[10.5px] uppercase tracking-[0.24em] text-[#8f8a7a] font-semibold font-mono">
                FW26 Collection
              </span>
              <span className="h-px bg-[#0e0e0c] w-7 block" />
            </div>

            {/* Headline with interactive typography and metallic shimmer */}
            <h1
              className="font-bold text-[#0e0e0c] leading-[1.04] mb-4 lg:mb-5 tracking-tight select-none"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(2.4rem, 4.5vw, 4.4rem)",
                letterSpacing: "-0.02em",
                animation: "av-fadeDown 0.85s cubic-bezier(0.16, 1, 0.3, 1) both 0.2s",
              }}
            >
              <span className="inline-block transition-transform duration-300 hover:-translate-y-1 hover:text-[#0e0e0c] cursor-default mr-3">
                Step
              </span>
              <span className="inline-block transition-transform duration-300 hover:-translate-y-1 hover:text-[#0e0e0c] cursor-default mr-3">
                into
              </span>
              <span className="relative inline-block mr-3">
                <span className="relative z-10 transition-transform duration-300 hover:-translate-y-1 cursor-default inline-block">
                  something
                </span>
                {/* Animated slab underline with ambient breathing glow */}
                <span
                  aria-hidden="true"
                  className="av-marker-glow absolute bottom-[5%] left-0 h-[28%] bg-[#9DB7C5] z-0"
                  style={{
                    animation: "av-underline 0.55s ease both 0.55s",
                    width: 0,
                    display: "block",
                  }}
                />
              </span>
              <br />
              <span className="av-shimmer-headline inline-block transition-transform duration-300 hover:-translate-y-1 cursor-default">
                exceptional.
              </span>
            </h1>

            {/* Sub-copy */}
            <p
              className="text-[#5a5744] leading-relaxed mb-6 max-w-[460px]"
              style={{
                fontSize: "clamp(13.5px, 1.4vw, 15px)",
                animation: "av-fadeDown 0.85s cubic-bezier(0.16, 1, 0.3, 1) both 0.32s",
              }}
            >
              Full-grain leather, reinforced stitching, and soles engineered for
              pavement and trail alike.{" "}
              <strong className="text-[#0e0e0c] font-semibold">
                Considered footwear, made to be worn in.
              </strong>
            </p>

            {/* CTA Buttons with smooth micro-interactions */}
            <div
              className="flex flex-wrap items-center gap-3 mb-6 lg:mb-8"
              style={{ animation: "av-fadeDown 0.85s cubic-bezier(0.16, 1, 0.3, 1) both 0.44s" }}
            >
              <Link
                href="/products"
                id="hero-shop-btn"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-[13.5px] font-semibold bg-[#0e0e0c] text-white border border-[#0e0e0c] hover:-translate-y-0.5 hover:shadow-xl hover:bg-[#1a1a17] transition-all duration-200 shadow-md"
              >
                Shop the collection
                <svg
                  className="w-4 h-4 stroke-current fill-none stroke-[2.5] group-hover:translate-x-1.5 transition-transform duration-200"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/products"
                id="hero-explore-btn"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[13.5px] font-semibold bg-transparent text-[#0e0e0c] border border-[#d4cfbf] hover:border-[#0e0e0c] hover:bg-[#f9f9f7] hover:-translate-y-0.5 transition-all duration-200"
              >
                Explore catalog
                <svg
                  className="w-3.5 h-3.5 stroke-current fill-none stroke-[2] group-hover:translate-x-1 transition-transform duration-200"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>

            {/* Trust strip */}
            <div
              className="flex flex-wrap items-center gap-x-5 gap-y-2.5"
              style={{ animation: "av-fadeDown 0.85s cubic-bezier(0.16, 1, 0.3, 1) both 0.56s" }}
            >
              {[
                {
                  icon: (
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#8f8a7a" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  ),
                  label: "Free 30-day returns",
                },
                {
                  icon: (
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#8f8a7a" strokeWidth="2" strokeLinecap="round">
                      <rect x="1" y="3" width="15" height="13" rx="1" />
                      <path d="M16 8h4l3 6v3h-7V8z" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  ),
                  label: "Free delivery ₹2,500+",
                },
                {
                  icon: (
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#8f8a7a" strokeWidth="2" strokeLinecap="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ),
                  label: "4.9★ · 2,400+ reviews",
                },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-1.5 text-[12px] text-[#6b6656] font-medium">
                  {t.icon}
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════
              RIGHT — Floating Blue Shoe with Scroll Parallax
          ═══════════════════════════════ */}
          <div
            className="relative flex items-center justify-center w-full lg:w-1/2 order-1 lg:order-2 pt-2 pb-4 lg:py-0"
            style={{ minHeight: "clamp(240px, 40vw, 540px)" }}
          >
            {/* Ambient luxury blue glow behind shoe */}
            <div
              ref={glowRef}
              aria-hidden="true"
              className="av-glow pointer-events-none absolute rounded-full"
              style={{
                width: "80%",
                height: "65%",
                background: "radial-gradient(ellipse, rgba(147, 197, 253, 0.28) 0%, rgba(157, 183, 197, 0.22) 45%, transparent 70%)",
                top: "15%",
                left: "10%",
                filter: "blur(50px)",
              }}
            />

            {/* Soft ground shadow beneath shoe sole */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{
                width: "65%",
                height: "18px",
                bottom: "10%",
                left: "17%",
                background: "radial-gradient(ellipse, rgba(14,14,12,0.18) 0%, transparent 70%)",
                filter: "blur(14px)",
              }}
            />

            {/* Parallax & Mouse tracking wrapper */}
            <div
              ref={shoeParallaxRef}
              className="relative z-10 w-full flex items-center justify-center select-none will-change-transform"
              style={{
                maxWidth: "clamp(300px, 85%, 580px)",
                transition: "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
            >
              {/* Continuous vertical float animation */}
              <div className="av-shoe-float w-full flex items-center justify-center p-2">
                <img
                  src="/hero-shoe.png"
                  alt="AVEN premium blue sneaker — FW26 Collection"
                  className="w-full h-auto object-contain pointer-events-none"
                  draggable={false}
                  style={{
                    filter: "drop-shadow(0 28px 40px rgba(14, 14, 12, 0.18)) drop-shadow(0 8px 16px rgba(14, 14, 12, 0.08))",
                  }}
                />
              </div>
            </div>

            {/* FW26 pill badge (with 3D counter-parallax) */}
            <div
              ref={badgeTopRef}
              className="absolute top-2 right-2 sm:top-6 sm:right-6 bg-[#0e0e0c] text-white text-[9.5px] font-mono uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full shadow-lg z-20 will-change-transform transition-transform duration-200"
            >
              FW26
            </div>

            {/* New season badge (with 3D counter-parallax) */}
            <div
              ref={badgeBottomRef}
              className="absolute bottom-4 left-2 sm:left-4 z-20 bg-[#0e0e0c] text-white rounded-2xl shadow-lg px-4 py-2 flex items-center gap-2 will-change-transform transition-transform duration-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#9DB7C5] shrink-0" />
              <span className="text-[11px] font-semibold font-mono uppercase tracking-widest">New Season</span>
            </div>

            {/* Scroll indicator on desktop (smoothly fades on scroll) */}
            <div
              ref={scrollCueRef}
              className="hidden lg:flex flex-col items-center gap-1.5 absolute bottom-2 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-300"
              aria-hidden="true"
            >
              <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-[#c4bfad]">Scroll</span>
              <svg className="av-scroll-arrow w-4 h-4 stroke-[#c4bfad] fill-none stroke-[1.8]" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Bottom Ticker Marquee ── */}
        <div
          className="relative z-10 border-t border-[#e4e0d2] bg-[#0e0e0c] overflow-hidden"
          aria-hidden="true"
        >
          <div className="flex whitespace-nowrap py-[10px]">
            <div className="av-ticker-track flex items-center shrink-0">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9c4b3] px-6"
                >
                  {item}
                  <span className="text-[#9DB7C5] text-[8px]">◆</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
