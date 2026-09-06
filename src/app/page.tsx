'use client';

import Link from 'next/link';
import { useState, useEffect, useReducer } from 'react';
import {
  Shield,
  Eye,
  Activity,
  ArrowRight,
  Flame,
  Radio,
  AlertTriangle,
  Layers,
  Globe,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Menu,
  X,
  Play,
  Square,
} from 'lucide-react';
import { useMirage } from '@/components/providers/mirage-provider';
import { CyberGlobe } from '@/components/network/cyber-globe';
import { CinematicFooter } from '@/components/ui/motion-footer';
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button';
import { formatBytes, formatNumber } from '@/lib/utils';
import { SimulationScenario } from '@/types';

// Reduced motion accessibility
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useReducer((_: boolean, v: boolean) => v, false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

// Native lightweight high-performance scroll progress hook
function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setProgress(Math.min(100, Math.max(0, (window.scrollY / scrollHeight) * 100)));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return progress;
}

const THREAT_ORIGINS = [
  { rank: '01', ip: '10.0.0.50', label: 'SYN Flood Cluster', country: 'RU', flag: '🇷🇺', pps: '35,400 pps', severity: 'CRITICAL', status: 'Active Ingress' },
  { rank: '02', ip: '198.51.100.42', label: 'C2 Command Node', country: 'CN', flag: '🇨🇳', pps: '4,120 flows', severity: 'HIGH', status: 'Beaconing' },
  { rank: '03', ip: '203.0.113.88', label: 'UDP Reflection Cluster', country: 'US', flag: '🇺🇸', pps: '18,200 pps', severity: 'CRITICAL', status: 'Volumetric' },
  { rank: '04', ip: '10.0.0.31', label: 'DNS Exfiltration Agent', country: 'DE', flag: '🇩🇪', pps: '1,840 queries', severity: 'MEDIUM', status: 'High Entropy' },
  { rank: '05', ip: '10.0.0.21', label: 'Compromised Optical Node', country: 'GB', flag: '🇬🇧', pps: '890 flows', severity: 'HIGH', status: 'Anomalous EWMA' },
  { rank: '06', ip: '192.0.2.14', label: 'Tor Exit Relay', country: 'NL', flag: '🇳🇱', pps: '640 flows', severity: 'LOW', status: 'Monitored' },
];

const ARCHITECTURAL_TIERS = [
  {
    tier: '01',
    category: 'PHYSICAL ISOLATION',
    title: 'Hardware Optical Diode TAP',
    desc: 'Unidirectional optical fiber tap with physical transmit laser absent. Network telemetry flows strictly inbound into the monitoring enclave with absolute physical air gap.',
    badge: 'HARDWARE RX-ONLY',
    metric: '0.00 ns',
    metricLabel: 'Backchannel Return',
  },
  {
    tier: '02',
    category: 'MICROSECOND RESOLUTION',
    title: 'L1 Packet Lens (Sliding Entropy)',
    desc: 'Real-time Shannon Entropy and inter-arrival time distributions calculated over 1–5ms sliding windows. Instantly flags volumetric floods before socket binding.',
    badge: '1–5ms EVALUATION',
    metric: '< 1.4 ms',
    metricLabel: 'Processing Latency',
  },
  {
    tier: '03',
    category: 'STATISTICAL MOMENTS',
    title: 'L2 Connection Lens (Adaptive Baseline)',
    desc: 'Welford algorithm continuously updates online running mean and variance per host. Discovers Slowloris, half-open states, and scans via dynamic Z-score deviations.',
    badge: 'WELFORD RUNNING MEAN',
    metric: '99.94%',
    metricLabel: 'Baseline Accuracy',
  },
  {
    tier: '04',
    category: 'TEMPORAL GRAPH FUSION',
    title: 'L3 Session Lens (Campaign Correlator)',
    desc: 'Directed temporal bipartite graph correlating disparate alert sequences across multiple optical hosts. Maps coordinated multi-host kill chains to MITRE tactics.',
    badge: 'GRAPH RECONSTRUCTION',
    metric: '12-Dim',
    metricLabel: 'Feature Tensor',
  },
  {
    tier: '05',
    category: 'FORENSIC IMMUTABILITY',
    title: 'Cryptographic Tamper-Evident Ledger',
    desc: 'Every anomalous packet batch is Merkle-tree hashed with SHA-256 into an append-only audit chain. Delivers immutable chain of custody for formal review.',
    badge: 'SHA-256 MERKLE CHAIN',
    metric: '100%',
    metricLabel: 'Chain Integrity',
  },
];

const SIMULATION_PRESETS: {
  id: SimulationScenario;
  name: string;
  desc: string;
  category: string;
  intensity: string;
}[] = [
  {
    id: 'SYN_FLOOD',
    name: 'SYN Flood Storm',
    desc: 'Layer 4 volumetric flood designed to exhaust connection state tables.',
    category: 'VOLUMETRIC',
    intensity: '35,000 PPS · CRITICAL',
  },
  {
    id: 'UDP_FLOOD',
    name: 'UDP Amplification',
    desc: 'High-bandwidth reflection consuming ingress optical tap buffer capacity.',
    category: 'BANDWIDTH',
    intensity: '48.2 MBPS · HIGH',
  },
  {
    id: 'C2_BEACON',
    name: 'C2 Low & Slow Beacon',
    desc: 'Periodic jittered communication from internal host to external adversary node.',
    category: 'STEALTH',
    intensity: '12.4s JITTER · LATENT',
  },
  {
    id: 'DNS_TUNNEL',
    name: 'DNS Data Exfiltration',
    desc: 'Subdomain exfiltration encoding base64 payload into recursive queries.',
    category: 'EXFILTRATION',
    intensity: '4.88 BITS · ENTROPY',
  },
];

export default function LandingPage() {
  const scrollPercent = useScrollProgress();
  const reducedMotion = useReducedMotion();

  const {
    metrics,
    alerts,
    hosts,
    isSimulating,
    activeScenario,
    simulation,
    startSimulation,
    stopSimulation,
  } = useMirage();

  const [selectedThreatFilter, setSelectedThreatFilter] = useState<string>('ALL');
  const [activeThreatOrigin, setActiveThreatOrigin] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Auto-cycle through threat targets in hero
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveThreatOrigin((prev) => (prev + 1) % THREAT_ORIGINS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const totalPps = metrics?.packetsPerSec || (isSimulating ? 14200 : 850);
  const totalBps = metrics?.bytesPerSec || totalPps * 920 * 8;

  return (
    <div className="relative w-full bg-[#05070a] min-h-screen font-sans selection:bg-white/20 overflow-x-clip text-[#e4e4e7]">
      {/* 
        MAIN CONTENT AREA 
        Generous negative space, calm luxury dark atmosphere, and clean Liquid Glass aesthetics.
        The rounded bottom lifts cleanly on scroll to reveal the Cinematic Curtain Footer underneath.
      */}
      <main className="relative z-10 w-full bg-[#05070a] border-b border-white/[0.08] shadow-[0_25px_60px_rgba(0,0,0,0.9)] rounded-b-[3rem] overflow-hidden pb-20 sm:pb-32">
        {/* ── Top Scroll Progress Line (Subtle & Refined) ── */}
        <div className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-transparent">
          <div
            className="h-full bg-gradient-to-r from-white/40 via-cyan-400 to-white/70 transition-all duration-75"
            style={{ width: `${scrollPercent}%` }}
          />
        </div>

        {/* ── Deep Minimalist Atmospheric Glows ── */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85vw] max-w-[1000px] h-[600px] bg-blue-900/[0.07] rounded-full blur-[160px]" />
          <div className="absolute top-[45%] right-0 w-[50vw] max-w-[600px] h-[600px] bg-cyan-900/[0.04] rounded-full blur-[180px]" />
        </div>

        {/* ── Minimalist Navigation Bar ── */}
        <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-2xl bg-[#05070a]/75 border-b border-white/[0.06] h-20 transition-all">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 h-full flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-white shadow-inner">
                <Shield size={16} />
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-semibold tracking-[0.2em] text-sm text-white">
                  MIRAGE
                </span>
                <span className="text-[10px] font-mono text-white/40 border border-white/10 px-2 py-0.5 rounded-full bg-white/[0.02]">
                  NTRO · 26145
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links (Spacious Negative Space) */}
            <div className="hidden md:flex items-center gap-10 text-xs font-mono tracking-wider text-white/50">
              <a href="#footprint" className="hover:text-white transition-colors">THREAT FOOTPRINT</a>
              <a href="#insights" className="hover:text-white transition-colors">PROJECT INSIGHTS</a>
              <a href="#soc-dashboard" className="hover:text-white transition-colors">SOC DASHBOARD</a>
              <a href="#simulation-lab" className="hover:text-white transition-colors flex items-center gap-1.5 text-white/80">
                <Flame size={13} className="text-amber-400" /> SIMULATION
              </a>
            </div>

            {/* Desktop Action & Mobile Toggle */}
            <div className="flex items-center gap-4">
              <LiquidGlassButton
                as={Link}
                href="/dashboard"
                variant="liquid-light"
                size="sm"
                className="hidden sm:inline-flex"
              >
                Launch Console <ArrowRight size={13} />
              </LiquidGlassButton>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1] transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-20 left-0 right-0 bg-[#05070a]/95 backdrop-blur-2xl border-b border-white/10 p-6 flex flex-col gap-4 z-50 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
              <a
                href="#footprint"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-mono text-white/70 hover:text-white py-2.5 border-b border-white/[0.06] flex items-center justify-between"
              >
                <span>THREAT FOOTPRINT</span>
                <ChevronRight size={14} className="text-white/30" />
              </a>
              <a
                href="#insights"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-mono text-white/70 hover:text-white py-2.5 border-b border-white/[0.06] flex items-center justify-between"
              >
                <span>PROJECT INSIGHTS</span>
                <ChevronRight size={14} className="text-white/30" />
              </a>
              <a
                href="#soc-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-mono text-white/70 hover:text-white py-2.5 border-b border-white/[0.06] flex items-center justify-between"
              >
                <span>SOC DASHBOARD</span>
                <ChevronRight size={14} className="text-white/30" />
              </a>
              <a
                href="#simulation-lab"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-mono text-white/80 py-2.5 border-b border-white/[0.06] flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Flame size={13} className="text-amber-400" /> SIMULATION LAB</span>
                <ChevronRight size={14} className="text-white/30" />
              </a>
              <div className="pt-2">
                <LiquidGlassButton
                  as={Link}
                  href="/dashboard"
                  variant="liquid-light"
                  size="md"
                  className="w-full text-center font-bold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Enter SOC Command Deck <ArrowRight size={14} />
                </LiquidGlassButton>
              </div>
            </div>
          )}
        </nav>

        {/* ── Section 1: Hero with Generous Negative Space ── */}
        <section className="relative min-h-[94vh] flex flex-col items-center justify-center pt-36 sm:pt-44 pb-20 sm:pb-32 px-6 text-center z-10">
          <div className="max-w-4xl mx-auto flex flex-col items-center w-full">
            
            {/* Liquid Glass Target Capsule (Matching Reference Image) */}
            <div className="relative inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.15] shadow-[0_12px_32px_-4px_rgba(0,0,0,0.5),_inset_0_1.5px_2px_rgba(255,255,255,0.25)] backdrop-blur-2xl mb-10 transition-all duration-300 max-w-[94vw] overflow-x-auto">
              <span className="text-base">{THREAT_ORIGINS[activeThreatOrigin].flag}</span>
              <span className="text-xs font-mono font-medium text-white tracking-wider">
                {THREAT_ORIGINS[activeThreatOrigin].ip}
              </span>
              <span className="text-white/30">·</span>
              <span className="text-[11px] font-mono text-white/70">
                {THREAT_ORIGINS[activeThreatOrigin].label}
              </span>
              <span className="text-[10px] font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full bg-cyan-500/10">
                {THREAT_ORIGINS[activeThreatOrigin].pps}
              </span>
            </div>

            {/* Confident, Restrained Typography */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-8 text-white max-w-4xl">
              Multi-Resolution <br />
              <span className="bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text text-transparent">
                Passive Threat Intelligence
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white/50 max-w-2xl mx-auto font-normal leading-relaxed mb-12 sm:mb-16 px-4">
              Hardware-enforced unidirectional optical tap monitoring. Extracts packet, connection,
              and session graph invariants with zero physical return channel.
            </p>

            {/* Tactile Liquid Glass Button Pair */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-20 sm:mb-28 w-full px-4">
              <LiquidGlassButton
                as={Link}
                href="/dashboard"
                variant="liquid-light"
                size="lg"
                className="w-full sm:w-auto"
              >
                Enter SOC Command Deck <ArrowRight size={16} />
              </LiquidGlassButton>

              <LiquidGlassButton
                as="a"
                href="#simulation-lab"
                variant="liquid-dark"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Flame size={16} className="text-amber-400" /> Launch Cyber Range
              </LiquidGlassButton>
            </div>

            {/* Minimalist Metrics Baseline Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-3xl pt-8 border-t border-white/[0.06]">
              {[
                { label: 'INGRESS EVALUATION', value: '< 1.45 ms' },
                { label: 'TEMPORAL LENSES', value: 'L1 · L2 · L3' },
                { label: 'HARDWARE AIR GAP', value: '100% Unidirectional' },
                { label: 'AUDIT CHAIN', value: 'SHA-256 Merkle' },
              ].map((stat, i) => (
                <div key={i} className="text-center p-3">
                  <div className="text-lg sm:text-xl font-mono font-semibold text-white mb-1">{stat.value}</div>
                  <div className="text-[10px] font-mono tracking-widest text-white/40">{stat.label}</div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── Section 2: Platform Threat Geography (Negative Space & 3D Globe) ── */}
        <section id="footprint" className="py-28 sm:py-40 px-6 sm:px-12 relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-4">
            <div>
              <div className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase mb-3 flex items-center gap-2">
                <Globe size={14} /> PLATFORM THREAT FOOTPRINT
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
                Global Threat Origin Matrix
              </h2>
            </div>
            <div className="text-xs font-mono text-white/40">
              PHYSICAL RX ENCLAVE · ZERO INJECTION
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* 3D Cyber Globe (Airy & Spacious Container) */}
            <div className="lg:col-span-7 rounded-3xl border border-white/[0.08] bg-[#080c12]/60 backdrop-blur-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl relative min-h-[420px]">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <span className="text-xs font-mono text-white/60">3D TOPOLOGICAL SENSOR RADAR</span>
                <span className="text-[11px] font-mono text-cyan-400">● 6 ACTIVE THREAT ARCS</span>
              </div>
              
              <div className="relative w-full h-[300px] sm:h-[380px] flex items-center justify-center my-4">
                <CyberGlobe className="w-full h-full" />
              </div>

              <div className="text-[11px] font-mono text-white/40 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span>REVOLVING CYBER GLOBE</span>
                <span>GEO-LOCATED OPTICAL INGRESS</span>
              </div>
            </div>

            {/* Threat Screener List */}
            <div className="lg:col-span-5 rounded-3xl border border-white/[0.08] bg-[#080c12]/60 backdrop-blur-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl space-y-6">
              <div>
                <div className="text-xs font-mono text-white/40 uppercase mb-4 tracking-wider">
                  RANKED INGRESS THREAT VECTORS
                </div>
                <div className="space-y-3">
                  {THREAT_ORIGINS.map((item) => (
                    <div
                      key={item.ip}
                      className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{item.flag}</span>
                        <div>
                          <div className="text-xs font-mono font-medium text-white">
                            {item.ip}
                          </div>
                          <div className="text-[10px] font-mono text-white/40">
                            {item.label}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-medium text-white/80">
                          {item.pps}
                        </div>
                        <div className="text-[9px] font-mono text-amber-400/80">
                          {item.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-white/40">
                <span>PASSIVE TAP BUFFER</span>
                <Link href="/traffic" className="text-white hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  Deep Traffic Tap <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: The 5 Pillars of Unidirectional Defense ── */}
        <section id="insights" className="py-28 sm:py-40 px-6 sm:px-12 relative z-10 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-24">
            <div className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase mb-3 flex items-center justify-center gap-2">
              <Sparkles size={14} /> ARCHITECTURAL BLUEPRINT
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Five Pillars of Unidirectional Defense
            </h2>
            <p className="text-sm sm:text-base text-white/50 leading-relaxed">
              How MIRAGE achieves sub-millisecond entropy detection and multi-host campaign attribution
              over physically isolated network links.
            </p>
          </div>

          {/* Minimalist Dark Obsidian Cards with Ample Negative Space */}
          <div className="space-y-6 sm:space-y-8">
            {ARCHITECTURAL_TIERS.map((tier) => (
              <div
                key={tier.tier}
                className="group relative p-8 sm:p-10 rounded-3xl bg-[#080c12]/70 border border-white/[0.08] hover:border-white/[0.18] backdrop-blur-2xl transition-all duration-300 shadow-xl"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.1]">
                        TIER {tier.tier}
                      </span>
                      <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
                        {tier.category}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {tier.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-sans">
                      {tier.desc}
                    </p>
                  </div>

                  <div className="flex-shrink-0 flex items-center md:flex-col md:items-end gap-2 md:gap-1 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-white">
                      {tier.metric}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                      {tier.metricLabel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4: Clean Embedded SOC Preview ── */}
        <section id="soc-dashboard" className="py-28 sm:py-40 px-6 sm:px-12 relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-4">
            <div>
              <div className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase mb-3 flex items-center gap-2">
                <Layers size={14} /> LIVE OPERATIONAL INTERFACE
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
                Embedded SOC Command Console
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="text-xs font-mono text-white/70 hover:text-white flex items-center gap-2 transition-colors"
            >
              EXPAND FULLSCREEN CONSOLE <ExternalLink size={13} />
            </Link>
          </div>

          {/* Clean Hardware Window Frame */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#070a10]/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl">
            {/* Header Bar */}
            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <span className="ml-3 text-xs font-mono text-white/40 hidden sm:inline">
                  https://mirage-enclave.internal/dashboard
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400/90">● HARDWARE RX ENFORCED</span>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-10 space-y-8">
              {/* Stat Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="text-[10px] font-mono text-white/40 uppercase mb-2">AGGREGATED INGRESS</div>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-white mb-1">
                    {formatBytes(totalBps)}/s
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400">Baseline synchronized</div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="text-[10px] font-mono text-white/40 uppercase mb-2">PACKET INGESTION</div>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-white mb-1">
                    {formatNumber(totalPps)} pps
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400">0 dropped frames</div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="text-[10px] font-mono text-white/40 uppercase mb-2">ACTIVE THREAT ALERTS</div>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-amber-400 mb-1">
                    {alerts.length || 4} Flagged
                  </div>
                  <div className="text-[11px] font-mono text-white/40">Multi-resolution match</div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="text-[10px] font-mono text-white/40 uppercase mb-2">OPTICAL NODES</div>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-white mb-1">
                    {hosts.length || 5} Monitored
                  </div>
                  <div className="text-[11px] font-mono text-white/40">Air-gapped topology</div>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                  {['ALL', 'CRITICAL', 'VOLUMETRIC', 'C2', 'EXFILTRATION'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedThreatFilter(filter)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all whitespace-nowrap border ${
                        selectedThreatFilter === filter
                          ? 'bg-white text-black border-white shadow-sm'
                          : 'bg-white/[0.04] text-white/60 border-white/[0.08] hover:bg-white/[0.08]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-white/40">Real-time passive tap stream</span>
              </div>

              {/* Table with Mobile Horizontal Scroll Container */}
              <div className="rounded-2xl border border-white/[0.06] overflow-x-auto">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-12 px-6 py-3 bg-white/[0.02] text-[11px] font-mono text-white/40 uppercase border-b border-white/[0.06]">
                    <span className="col-span-3">THREAT VECTOR</span>
                    <span className="col-span-4">INGRESS PATH</span>
                    <span className="col-span-2">SEVERITY</span>
                    <span className="col-span-1">RISK</span>
                    <span className="col-span-2 text-right">ACTION</span>
                  </div>

                  <div className="divide-y divide-white/[0.04] font-mono text-xs">
                    {(alerts.length > 0 ? alerts : [
                      { id: '1', threatType: 'SYN_FLOOD', srcIp: '10.0.0.50', dstIp: '10.0.0.10', severity: 'CRITICAL', riskScore: 92 },
                      { id: '2', threatType: 'C2_BEACON', srcIp: '10.0.0.21', dstIp: '198.51.100.42', severity: 'HIGH', riskScore: 88 },
                      { id: '3', threatType: 'UDP_FLOOD', srcIp: '203.0.113.88', dstIp: '10.0.0.10', severity: 'CRITICAL', riskScore: 95 },
                      { id: '4', threatType: 'DNS_TUNNEL', srcIp: '10.0.0.31', dstIp: '1.1.1.1', severity: 'MEDIUM', riskScore: 68 },
                    ]).map((alert) => (
                      <div
                        key={alert.id}
                        className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-white/[0.02] transition-colors"
                      >
                        <span className="col-span-3 font-semibold text-white flex items-center gap-2">
                          <AlertTriangle size={13} className="text-amber-400" />
                          {alert.threatType.replace(/_/g, ' ')}
                        </span>
                        <span className="col-span-4 text-white/60">
                          {alert.srcIp} → {alert.dstIp}
                        </span>
                        <span className="col-span-2">
                          <span className="text-[10px] font-mono text-white/80 border border-white/10 px-2 py-0.5 rounded-full">
                            {alert.severity}
                          </span>
                        </span>
                        <span className="col-span-1 font-bold text-white">
                          {Math.round(alert.riskScore)}
                        </span>
                        <span className="col-span-2 text-right">
                          <Link
                            href="/threats"
                            className="px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/80 text-[11px] border border-white/[0.1] transition-colors"
                          >
                            Inspect Flow
                          </Link>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: Isolated Cyber Range Lab (Spacious & Clean) ── */}
        <section id="simulation-lab" className="py-28 sm:py-40 px-6 sm:px-12 relative z-10 max-w-6xl mx-auto border-t border-white/[0.06]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-4">
            <div>
              <div className="text-[11px] font-mono text-amber-400 tracking-widest uppercase mb-3 flex items-center gap-2">
                <Flame size={15} /> ISOLATED TEST ENCLAVE
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
                Cyber Range Simulation Lab
              </h2>
              <p className="text-sm sm:text-base text-white/50 max-w-xl font-sans leading-relaxed">
                Inject synthetic network scenarios across the passive optical tap. Verify anomaly triggers
                and risk scoring in real time with zero return risk.
              </p>
            </div>

            {/* Active Simulation Badge / Action */}
            {isSimulating && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <div className="font-mono text-xs text-red-400">
                  ATTACK RUNNING: <strong className="text-white">{activeScenario}</strong> ({Math.round(simulation?.elapsedSeconds || 0)}s)
                </div>
                <button
                  onClick={stopSimulation}
                  className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs transition-all"
                >
                  STOP
                </button>
              </div>
            )}
          </div>

          {/* 4 Spacious Scenario Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {SIMULATION_PRESETS.map((scenario) => {
              const isThisActive = isSimulating && activeScenario === scenario.id;
              return (
                <div
                  key={scenario.id}
                  className={`p-6 sm:p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                    isThisActive
                      ? 'bg-red-950/20 border-red-500/40 shadow-xl'
                      : 'bg-[#080c12]/70 border-white/[0.08] hover:border-white/[0.18]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono text-white/50 border border-white/10 px-2 py-0.5 rounded-full">
                        {scenario.category}
                      </span>
                      <span className="text-[10px] font-mono text-white/30">SCENARIO</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2">{scenario.name}</h3>
                    <p className="text-xs text-white/50 mb-8 leading-relaxed font-sans">{scenario.desc}</p>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono text-white/40 mb-4">{scenario.intensity}</div>
                    <button
                      onClick={() => {
                        if (isThisActive) {
                          stopSimulation();
                        } else {
                          startSimulation(scenario.id, 20);
                        }
                      }}
                      className={`w-full py-2.5 rounded-full font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        isThisActive
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg'
                          : 'bg-white hover:bg-white/90 text-black shadow-md'
                      }`}
                    >
                      {isThisActive ? (
                        <>
                          <Square size={13} /> HALT SCENARIO
                        </>
                      ) : (
                        <>
                          <Play size={13} /> TEST SCENARIO
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Telemetry Bar */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#080c12]/60 border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white">
                <Zap size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {isSimulating ? `Active Vector: ${activeScenario}` : 'Enclave Standby State'}
                </div>
                <div className="text-xs text-white/40">
                  {isSimulating
                    ? `${formatNumber(simulation?.packetsGenerated || 0)} frames mirrored through optical tap`
                    : 'Select any scenario above to observe real-time feature extraction'}
                </div>
              </div>
            </div>

            <LiquidGlassButton
              as={Link}
              href="/dashboard"
              variant="liquid-light"
              size="sm"
              className="w-full sm:w-auto"
            >
              Open Full 3D Globe <ArrowRight size={14} />
            </LiquidGlassButton>
          </div>
        </section>

      </main>

      {/* ── Breathtaking Cinematic Curtain Reveal Footer ── */}
      <CinematicFooter title="Ready to begin?" brandText="MIRAGE" />
    </div>
  );
}
