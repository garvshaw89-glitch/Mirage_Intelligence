'use client';

import Link from "next/link";
import { Shield, ArrowLeft, Radio, Terminal, AlertTriangle, RefreshCw, Home, Zap } from "lucide-react";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";

export default function NotFound() {
  return (
    <div className="relative min-h-[100dvh] w-full bg-[#080c12] text-[#e8edf4] flex flex-col items-center justify-center px-4 sm:px-6 py-12 overflow-hidden selection:bg-cyan-500/30">
      {/* ── Background Grid & Aurora Lights ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vw] max-w-[650px] h-[650px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/4 w-[50vw] max-w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ── Giant 404 Watermark ── */}
      <div className="absolute font-mono font-black text-[22vw] sm:text-[20vw] leading-none text-white/[0.02] select-none pointer-events-none z-0 tracking-tighter">
        404
      </div>

      {/* ── Main Content Container ── */}
      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center">
        {/* Hardware Status Capsule */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs mb-8 shadow-lg shadow-red-500/10 animate-pulse">
          <AlertTriangle size={13} />
          <span>DIODE EXCEPTION · ZERO RETURN CHANNEL</span>
        </div>

        {/* Optical Diode Visual Glitch Ring */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping opacity-25" />
          <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400/40 animate-[spin_20s_linear_infinite]" />
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent border border-cyan-500/40 backdrop-blur-xl flex items-center justify-center shadow-2xl shadow-cyan-500/20">
            <Radio className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-400 animate-pulse" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 text-white">
          Packet Routed into <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-300 bg-clip-text text-transparent">
            Air-Gapped Abyss
          </span>
        </h1>

        <p className="text-sm sm:text-base text-white/60 max-w-lg mb-8 leading-relaxed font-sans px-2">
          The requested route was not found in the enclave table. Under physical unidirectional optical diode
          rules, no return path exists to retransmit or echo dropped frames.
        </p>

        {/* Diagnostic Telemetry HUD */}
        <div className="w-full rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md p-4 sm:p-5 mb-10 font-mono text-left text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
            <span className="text-white/40 flex items-center gap-1.5">
              <Shield size={12} className="text-cyan-400" /> ENCLAVE TELEMETRY
            </span>
            <span className="text-emerald-400 text-[11px] font-bold">STATUS: HARDWARE_RX_ONLY</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/60 text-[11px]">
            <div>DIAGNOSTIC: <span className="text-amber-400">ERR_AIRGAP_UNRESOLVED_ROUTE</span></div>
            <div>RETURN LATENCY: <span className="text-cyan-400">0.00 ns (PHYSICALLY CUT)</span></div>
            <div>MERKLE LOG: <span className="text-white/80">SHA-256 CHAIN LOCKED</span></div>
            <div>INCIDENT ID: <span className="text-white/80 font-mono">0x404_DIODE_DROP</span></div>
          </div>
        </div>

        {/* Liquid Glass Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-2">
          <LiquidGlassButton
            as={Link}
            href="/dashboard"
            variant="liquid-light"
            size="lg"
            className="w-full sm:w-auto font-bold"
          >
            <Shield size={16} /> Return to SOC Deck
          </LiquidGlassButton>

          <LiquidGlassButton
            as={Link}
            href="/simulation"
            variant="liquid-dark"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Zap size={16} className="text-cyan-400" /> Launch Cyber Range
          </LiquidGlassButton>

          <LiquidGlassButton
            as={Link}
            href="/"
            variant="liquid-dark"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Home size={16} /> Home Platform
          </LiquidGlassButton>
        </div>
      </div>

      {/* ── Footer / Copyright ── */}
      <div className="relative z-10 mt-12 text-center text-[11px] font-mono text-white/30">
        © 2026 MIRAGE DEFENSE TECHNOLOGIES · HARDWARE ENCLAVE AIR GAP
      </div>
    </div>
  );
}
