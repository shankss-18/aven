"use client";

import { useEffect, useRef } from "react";

/**
 * ScrollReveal — wraps children with an Intersection Observer that triggers
 * a smooth slide-up + fade-in animation when the element enters the viewport.
 *
 * Props:
 *   delay   — CSS animation-delay in ms (default 0)
 *   y       — initial translateY in px (default 32)
 *   once    — if true (default), only animate once; false = animate each time it enters
 */
export default function ScrollReveal({ children, delay = 0, y = 32, once = true, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Initial hidden state applied via JS to avoid flash
    el.style.opacity = "0";
    el.style.transform = `translateY(${y}px)`;
    el.style.transition = `opacity 0.65s cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 0.65s cubic-bezier(0.4,0,0.2,1) ${delay}ms`;
    el.style.willChange = "opacity, transform";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.style.opacity = "0";
          el.style.transform = `translateY(${y}px)`;
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, y, once]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
