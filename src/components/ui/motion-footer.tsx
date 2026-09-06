"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Shield, Zap, Activity, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Register ScrollTrigger safely for React / Next.js SSR
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES WITH LIQUID GLASS REFRACTION
// -------------------------------------------------------------------------
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  
  --foreground: #e8edf4;
  --background: #080c12;
  --primary: #00d4ff;
  --secondary: #3b9eff;
  --destructive: #ef4444;
  
  /* Dynamic Variables using standard tokens */
  --pill-bg-1: color-mix(in oklch, var(--foreground) 3.5%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background) 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground) 12%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground) 8%, transparent);
  
  --pill-bg-1-hover: color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--foreground) 2%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
  --pill-shadow-hover: color-mix(in oklch, var(--background) 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px color-mix(in oklch, var(--destructive) 50%, transparent)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px color-mix(in oklch, var(--destructive) 80%, transparent)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 36s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* Theme-adaptive Grid Background */
.footer-bg-grid {
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

/* Theme-adaptive Aurora Glow (Violet & Cyan Accent) */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(167, 139, 250, 0.18) 0%, 
    rgba(59, 158, 255, 0.12) 35%, 
    transparent 70%
  );
}

/* Liquid Glass Capsule (Matching user image reference) */
.footer-liquid-glass {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(240, 240, 245, 0.86) 100%);
  color: #121417;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
      0 12px 32px -4px rgba(0, 0, 0, 0.4), 
      inset 0 2px 2.5px rgba(255, 255, 255, 1), 
      inset 0 -2px 4px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-liquid-glass:hover {
  background: linear-gradient(180deg, #ffffff 0%, rgba(245, 245, 250, 0.96) 100%);
  box-shadow: 
      0 18px 40px -4px rgba(0, 0, 0, 0.5), 
      inset 0 2.5px 3px rgba(255, 255, 255, 1), 
      inset 0 -2.5px 5px rgba(0, 0, 0, 0.55);
}

/* Translucent Dark Glass Pill */
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--foreground);
}

/* Giant Background Text Masking */
.footer-giant-bg-text {
  font-size: clamp(3.5rem, 20vw, 17rem);
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 5%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 10%, transparent) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Metallic Text Glow */
.footer-text-glow {
  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.45) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 25px rgba(255, 255, 255, 0.15));
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Zero Dependency with GSAP Elastic Physics)
// -------------------------------------------------------------------------
export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & 
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
    href?: string;
  };

export const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      // On touch devices (phones/tablets), avoid mouse tilt
      if (window.matchMedia("(pointer: coarse)").matches) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.35,
            y: y * 0.35,
            rotationX: -y * 0.12,
            rotationY: x * 0.12,
            scale: 1.04,
            ease: "power2.out",
            duration: 0.35,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };

        element.addEventListener("mousemove", handleMouseMove);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement | null) => {
          (localRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        className={cn("cursor-pointer select-none active:scale-95 transition-transform", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. DIAGONAL MARQUEE STRIP
// -------------------------------------------------------------------------
const MarqueeItem = () => (
  <div className="flex items-center space-x-8 sm:space-x-12 px-4 sm:px-6">
    <span>Unidirectional Diode TAP</span> <span className="text-primary/70">✦</span>
    <span>Zero Return-Path Architecture</span> <span className="text-secondary/70">✦</span>
    <span>Microsecond Entropy Lens</span> <span className="text-primary/70">✦</span>
    <span>Welford Adaptive Baselines</span> <span className="text-secondary/70">✦</span>
    <span>SHA-256 Merkle Audit Chain</span> <span className="text-primary/70">✦</span>
    <span>Air-Gapped SOC Intelligence</span> <span className="text-secondary/70">✦</span>
    <span>Physical Hardware Isolation</span> <span className="text-primary/70">✦</span>
  </div>
);

// -------------------------------------------------------------------------
// 4. MAIN CINEMATIC FOOTER COMPONENT
// -------------------------------------------------------------------------
interface CinematicFooterProps {
  title?: string;
  brandText?: string;
}

export function CinematicFooter({
  title = "Ready to begin?",
  brandText = "MIRAGE",
}: CinematicFooterProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    // React strict mode compatible GSAP context cleanup
    const ctx = gsap.context(() => {
      // Background Parallax
      gsap.fromTo(
        giantTextRef.current,
        { y: "8vh", scale: 0.85, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 85%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      // Staggered Content Reveal
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 45%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      
      {/* 
        The "Curtain Reveal" Wrapper:
        It sits in standard flow. Because it has clip-path, its contents
        are ONLY visible within its bounding box as the user scrolls down!
        Uses h-[100dvh] for mobile viewport safety.
      */}
      <div
        ref={wrapperRef}
        className="relative h-[100dvh] min-h-[580px] w-full pointer-events-auto"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        {/* The actual footer stays fixed to the viewport underneath everything */}
        <footer className="fixed bottom-0 left-0 flex h-[100dvh] min-h-[580px] w-full flex-col justify-between overflow-y-auto sm:overflow-hidden bg-background text-foreground cinematic-footer-wrapper">
          
          {/* Ambient Light & Grid Background */}
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          {/* Giant background text (MIRAGE) */}
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute -bottom-[2vh] sm:-bottom-[4vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none font-bold"
          >
            {brandText}
          </div>

          {/* 1. Diagonal Sleek Marquee (Top of footer) */}
          <div className="absolute top-4 sm:top-8 md:top-12 left-0 w-full overflow-hidden border-y border-border/50 bg-background/70 backdrop-blur-md py-2.5 sm:py-3.5 z-10 -rotate-2 scale-110 shadow-2xl">
            <div className="flex w-max animate-footer-scroll-marquee text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.25em] sm:tracking-[0.3em] text-muted-foreground uppercase">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          {/* 2. Main Center Content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 pt-20 sm:pt-24 pb-8 w-full max-w-5xl mx-auto">
            <h2
              ref={headingRef}
              className="text-3xl xs:text-4xl sm:text-6xl md:text-8xl font-black footer-text-glow tracking-tighter mb-6 sm:mb-10 text-center px-2"
            >
              {title}
            </h2>

            {/* Interactive Magnetic Pills Layout */}
            <div ref={linksRef} className="flex flex-col items-center gap-4 sm:gap-6 w-full">
              {/* Primary Command Actions (Liquid Glass Capsule & Dark Glass) */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 w-full px-2">
                {/* Liquid Glass Pill Button (Matches user screenshot) */}
                <MagneticButton
                  as="a"
                  href="/simulation"
                  className="footer-liquid-glass px-7 sm:px-10 py-3.5 sm:py-5 rounded-full text-sm sm:text-base flex items-center justify-center gap-3 group w-full sm:w-auto"
                >
                  <Zap className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span>Launch Cyber Range</span>
                </MagneticButton>
                
                {/* Dark Glass Enclave Pill */}
                <MagneticButton
                  as="a"
                  href="/dashboard"
                  className="footer-glass-pill px-7 sm:px-10 py-3.5 sm:py-5 rounded-full text-foreground font-bold text-sm sm:text-base flex items-center justify-center gap-3 group w-full sm:w-auto"
                >
                  <Activity className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>Enter SOC Command Deck</span>
                </MagneticButton>
              </div>

              {/* Secondary Navigation & Enclave Links */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full mt-1 sm:mt-2 px-2">
                <MagneticButton
                  as="a"
                  href="/traffic"
                  className="footer-glass-pill px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-muted-foreground font-medium text-[11px] sm:text-xs md:text-sm hover:text-foreground"
                >
                  Traffic Optical Tap
                </MagneticButton>
                <MagneticButton
                  as="a"
                  href="/threats"
                  className="footer-glass-pill px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-muted-foreground font-medium text-[11px] sm:text-xs md:text-sm hover:text-foreground"
                >
                  Threat Matrix
                </MagneticButton>
                <MagneticButton
                  as="a"
                  href="/hosts"
                  className="footer-glass-pill px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-muted-foreground font-medium text-[11px] sm:text-xs md:text-sm hover:text-foreground"
                >
                  Host Topology
                </MagneticButton>
                <MagneticButton
                  as="a"
                  href="/forensics"
                  className="footer-glass-pill px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-muted-foreground font-medium text-[11px] sm:text-xs md:text-sm hover:text-foreground"
                >
                  Merkle Forensics
                </MagneticButton>
                <MagneticButton
                  as="a"
                  href="/settings"
                  className="footer-glass-pill px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-muted-foreground font-medium text-[11px] sm:text-xs md:text-sm hover:text-foreground"
                >
                  Enclave Hardware
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* 3. Bottom Bar / Credits (Fully responsive on mobile) */}
          <div className="relative z-20 w-full pb-4 sm:pb-8 px-4 sm:px-8 md:px-12 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6">
            
            {/* Copyright */}
            <div className="text-muted-foreground text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase order-2 md:order-1 font-mono text-center md:text-left">
              © 2026 MIRAGE DEFENSE TECHNOLOGIES. ALL RIGHTS RESERVED.
            </div>

            {/* "Made with Love" Badge */}
            <div className="footer-glass-pill px-4 sm:px-6 py-2 sm:py-3 rounded-full flex items-center gap-2 order-1 md:order-2 cursor-default border-border/50">
              <span className="text-muted-foreground text-[10px] sm:text-xs font-bold uppercase tracking-widest font-mono">Crafted with</span>
              <span className="animate-footer-heartbeat text-xs sm:text-base text-destructive">❤</span>
              <span className="text-muted-foreground text-[10px] sm:text-xs font-bold uppercase tracking-widest font-mono">by</span>
              <span className="text-foreground font-black text-xs sm:text-sm tracking-normal ml-0.5 sm:ml-1 font-mono">Mirage</span>
            </div>

            {/* Back to top Button */}
            <MagneticButton
              as="button"
              onClick={scrollToTop}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-foreground group order-3"
              aria-label="Scroll back to top"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
            </MagneticButton>

          </div>
        </footer>
      </div>
    </>
  );
}
