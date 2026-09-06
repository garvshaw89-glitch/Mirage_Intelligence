"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

export type LiquidGlassButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'onAbort'> & {
    as?: React.ElementType;
    href?: string;
    variant?: "liquid-light" | "liquid-dark" | "liquid-accent";
    size?: "sm" | "md" | "lg";
    magnetic?: boolean;
  };

export const LiquidGlassButton = React.forwardRef<HTMLElement, LiquidGlassButtonProps>(
  (
    {
      className,
      children,
      as: Component = "button",
      variant = "liquid-light",
      size = "md",
      magnetic = true,
      ...props
    },
    forwardedRef
  ) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (!magnetic || typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      // Disable magnetic physics on touch devices for mobile performance
      if (window.matchMedia("(pointer: coarse)").matches) return;

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
          ease: "elastic.out(1, 0.35)",
          duration: 1.1,
        });
      };

      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, [magnetic]);

    // Size classes
    const sizeClasses = {
      sm: "px-5 py-2 text-xs gap-2",
      md: "px-7 py-3 text-sm gap-2.5",
      lg: "px-9 py-4 text-base gap-3",
    }[size];

    // Variant classes matching the physical refractive Liquid Glass capsule
    const variantClasses = {
      // Exact representation of the user's "Liquid Glass" screenshot:
      "liquid-light":
        "bg-gradient-to-b from-white/95 via-white/85 to-[#e4e4e7]/80 text-[#121417] font-semibold " +
        "border border-white/60 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.35),_inset_0_2px_2px_rgba(255,255,255,1),_inset_0_-2px_4px_rgba(0,0,0,0.45)] " +
        "hover:shadow-[0_18px_40px_-6px_rgba(0,0,0,0.45),_inset_0_2.5px_3px_rgba(255,255,255,1),_inset_0_-2px_5px_rgba(0,0,0,0.55)] " +
        "active:shadow-[0_4px_12px_rgba(0,0,0,0.3),_inset_0_1px_1px_rgba(255,255,255,0.8),_inset_0_-1px_2px_rgba(0,0,0,0.6)] " +
        "active:scale-95 backdrop-blur-xl transition-all duration-300",

      // Dark Enclave crystal glass variant
      "liquid-dark":
        "bg-gradient-to-b from-white/[0.09] to-white/[0.02] text-[#e8edf4] font-semibold " +
        "border border-white/[0.16] shadow-[0_12px_32px_-4px_rgba(0,0,0,0.5),_inset_0_1.5px_1.5px_rgba(255,255,255,0.25),_inset_0_-1.5px_2px_rgba(0,0,0,0.8)] " +
        "hover:border-white/30 hover:bg-white/[0.14] hover:shadow-[0_18px_40px_-6px_rgba(0,0,0,0.6),_inset_0_2px_2px_rgba(255,255,255,0.35)] " +
        "active:scale-95 backdrop-blur-2xl transition-all duration-300",

      // Luminous Cyan / Accent cyber variant
      "liquid-accent":
        "bg-gradient-to-b from-cyan-400/90 via-cyan-500/80 to-blue-600/85 text-black font-bold " +
        "border border-cyan-300/60 shadow-[0_12px_32px_-4px_rgba(0,212,255,0.35),_inset_0_2px_2px_rgba(255,255,255,0.9),_inset_0_-2px_4px_rgba(0,0,0,0.4)] " +
        "hover:shadow-[0_18px_44px_-4px_rgba(0,212,255,0.5),_inset_0_2px_3px_rgba(255,255,255,1)] " +
        "active:scale-95 backdrop-blur-xl transition-all duration-300",
    }[variant];

    return (
      <Component
        ref={(node: HTMLElement | null) => {
          (localRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef)
            (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        className={cn(
          "inline-flex items-center justify-center rounded-full select-none cursor-pointer tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
          sizeClasses,
          variantClasses,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
LiquidGlassButton.displayName = "LiquidGlassButton";
