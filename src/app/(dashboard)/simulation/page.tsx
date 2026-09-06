'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Play,
  Square,
  Activity,
  Shield,
  Zap,
  Server,
  Radio,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { useMirage } from '@/components/providers/mirage-provider';

interface ScenarioDef {
  id: string;
  name: string;
  category: 'Benign' | 'Flood' | 'Starvation' | 'C2 & Stealth' | 'Coordinated';
  generator: string;
  description: string;
  expectedRisk: string;
}

const SCENARIOS: ScenarioDef[] = [
  {
    id: 'NORMAL',
    name: 'TRex / iperf3 Enterprise Baseline',
    category: 'Benign',
    generator: 'TRex & iperf3 Emulators',
    description: 'Generates high-throughput legitimate web browsing, API queries, and bulk file transfers. Confirms zero false positives on benign traffic.',
    expectedRisk: '5.0 - 15.0 (NORMAL)',
  },
  {
    id: 'SYN_FLOOD',
    name: 'hping3 SYN Flood Bursts',
    category: 'Flood',
    generator: 'hping3 Raw Socket Emulator',
    description: 'Transmits high-rate TCP SYN packets without ACK responses, targeting the authentication service. Triggers the packet-level detection engine.',
    expectedRisk: '80.0 - 95.0 (CRITICAL)',
  },
  {
    id: 'UDP_FLOOD',
    name: 'hping3 UDP Datagram Flood',
    category: 'Flood',
    generator: 'hping3 UDP Saturation Generator',
    description: 'High-frequency random UDP packet floods aimed at port exhaustion and link saturation across the optical tap.',
    expectedRisk: '80.0 - 92.0 (CRITICAL)',
  },
  {
    id: 'SLOWLORIS',
    name: 'Slowloris Connection Starvation',
    category: 'Starvation',
    generator: 'Slowloris HTTP Socket Engine',
    description: 'Opens 50+ concurrent HTTP connections and sends headers at slow 10-second intervals to tie up server threads without volume spikes.',
    expectedRisk: '70.0 - 85.0 (HIGH)',
  },
  {
    id: 'DNS_TUNNEL',
    name: 'dnscat2 / iodine DNS Tunneling',
    category: 'C2 & Stealth',
    generator: 'dnscat2 Base32 Encoded Generator',
    description: 'Encodes exfiltrated files into high-entropy DNS TXT queries with unique subdomains, evading standard stateful inspection.',
    expectedRisk: '75.0 - 88.0 (HIGH)',
  },
  {
    id: 'DGA',
    name: 'Algorithmic Domain Generation (DGA)',
    category: 'C2 & Stealth',
    generator: 'DGA Pseudo-Random Query Synthesizer',
    description: 'Simulates malware querying high-entropy algorithmic domain names to locate dynamic command-and-control rendezvous points.',
    expectedRisk: '65.0 - 80.0 (HIGH)',
  },
  {
    id: 'C2_BEACON',
    name: 'Sandboxed C2 Emulator (Beaconing)',
    category: 'C2 & Stealth',
    generator: 'C2 Periodic Beacon Synthesizer',
    description: 'Generates persistent heartbeats with realistic jitter (CV < 0.15). Evaluates FFT autocorrelation and session inter-arrival variance.',
    expectedRisk: '85.0 - 95.0 (CRITICAL)',
  },
  {
    id: 'MULTI_HOST_CAMPAIGN',
    name: 'Multi-Host APT Coordinated Campaign',
    category: 'Coordinated',
    generator: 'Distributed Multi-Agent Simulator',
    description: 'Coordinates a 3-host synchronized attack: External SYN flood distraction while compromised internal engineering host beacons to C2 and finance host tunnels data.',
    expectedRisk: '90.0 - 98.0 (CRITICAL)',
  },
];

export default function SimulationLabPage() {
  const { simulation, startSimulation, stopSimulation, isSimulating, activeScenario } = useMirage();
  const [selectedScenario, setSelectedScenario] = useState<string>('SYN_FLOOD');
  const [duration, setDuration] = useState<number>(60);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] MIRAGE Cyber Range ready.',
    '[INFO] Hardware data diode tap connected (write-only channel to sensor enclave).',
  ]);

  const isRunning = isSimulating || Boolean(simulation?.isRunning);
  const stage = simulation?.stage || (isSimulating ? `RUNNING_${activeScenario}` : 'IDLE');

  // Append logs when simulation changes or generates packets
  useEffect(() => {
    if (simulation?.packetsGenerated && simulation.packetsGenerated > 0) {
      const timeStr = new Date().toLocaleTimeString();
      setLogs((prev) => [
        `[${timeStr}] [TELEMETRY] Frames pushed: ${simulation.packetsGenerated.toLocaleString()} | Flows: ${simulation.flowsGenerated.toLocaleString()} | Stage: ${simulation.stage}`,
        ...prev.slice(0, 100),
      ]);
    }
  }, [simulation?.packetsGenerated, simulation?.flowsGenerated, simulation?.stage]);

  const handleStart = async () => {
    const timeStr = new Date().toLocaleTimeString();
    setLogs((prev) => [
      `[${timeStr}] [LAUNCH] Starting scenario: ${selectedScenario} (${duration}s)`,
      `[${timeStr}] [TAP] Writing synthesized frames to Unidirectional Optical Queue...`,
      `[${timeStr}] [RADAR] Projecting orbital attack trajectories onto 3D Globe...`,
      ...prev,
    ]);

    await startSimulation(selectedScenario as any, duration);
  };

  const handleStop = async () => {
    const timeStr = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timeStr}] [ABORT] Cyber Range scenario stopped by operator.`, ...prev]);
    await stopSimulation();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl glass-card border border-white/10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Terminal className="text-amber-400" size={22} />
            Cyber Range Simulation Laboratory
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Generates the exact benchmark traffic classes specified in the NTRO Problem Statement (TRex, iperf3, hping3, Slowloris, dnscat2, C2).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all shadow-lg shadow-cyan-500/10"
          >
            <Globe size={13} /> View on 3D Globe →
          </Link>
          <span className="text-xs text-white/40 font-mono">STATUS:</span>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
              isRunning
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse'
                : 'bg-white/5 text-white/50 border-white/10'
            }`}
          >
            {isRunning ? stage : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Cyber Range Philosophy Box */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 leading-relaxed flex items-start gap-3">
        <Shield size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">Defensible Architecture: Why Live Simulation?</span>
          The problem statement specifies the exact tools (iperf3, Ostinato, TRex, hping3, Slowloris, dnscat2, DGA, C2) rather than providing a static downloaded database. MIRAGE implements native emulators that generate these live frames, pushes them through the unidirectional optical diode, and extracts features into PostgreSQL/SQLite in real-time.
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SCENARIOS.map((sc) => {
          const isSelected = selectedScenario === sc.id;
          return (
            <div
              key={sc.id}
              onClick={() => !isRunning && setSelectedScenario(sc.id)}
              className={`p-4 rounded-xl transition-all duration-150 border cursor-pointer ${
                isSelected
                  ? 'bg-white/10 border-blue-500 shadow-lg shadow-blue-500/10'
                  : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
              } ${isRunning ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/60 border border-white/10">
                  {sc.category}
                </span>
                <span className="text-[11px] font-mono text-white/40">
                  Risk: {sc.expectedRisk}
                </span>
              </div>

              <div className="font-bold text-sm text-white">{sc.name}</div>
              <div className="text-xs text-blue-400 font-mono mt-0.5">{sc.generator}</div>
              <div className="text-xs text-white/50 mt-2 leading-relaxed">{sc.description}</div>
            </div>
          );
        })}
      </div>

      {/* Control Console & Execution Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Run Controls */}
        <div className="lg:col-span-4 p-5 rounded-xl glass-card border border-white/10 space-y-4">
          <h2 className="text-sm font-semibold text-white tracking-wide">Execution Parameters</h2>

          <div className="space-y-2">
            <label className="text-xs text-white/60">Duration (seconds)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={isRunning}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value={30} className="bg-slate-900">30 seconds (Quick test)</option>
              <option value={60} className="bg-slate-900">60 seconds (Standard benchmark)</option>
              <option value={120} className="bg-slate-900">120 seconds (Full baseline drift)</option>
              <option value={300} className="bg-slate-900">300 seconds (5 min campaign)</option>
            </select>
          </div>

          <div className="pt-2">
            {isRunning ? (
              <button
                onClick={handleStop}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
              >
                <Square size={14} /> Stop Scenario
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-lg shadow-blue-500/20"
              >
                <Play size={14} /> Launch Selected Scenario
              </button>
            )}
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/40 space-y-1 font-mono">
            <div>TARGET DIODE: UNIDIRECTIONAL_TAP_01</div>
            <div>INGRESS ISOLATION: ENFORCED</div>
            <div>RECORD PROVENANCE: SIMULATION</div>
          </div>
        </div>

        {/* Live Terminal Log */}
        <div className="lg:col-span-8 p-5 rounded-xl glass-card border border-white/10 space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-white/50 pb-2 border-b border-white/10">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              CYBER_RANGE_CONSOLE.STDOUT
            </span>
            <span>{logs.length} events</span>
          </div>

          <div className="h-64 overflow-y-auto space-y-1.5 text-xs text-white/80 pr-2">
            {logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                <span className="text-white/30 mr-2">{String(logs.length - idx).padStart(3, '0')}</span>
                <span
                  className={
                    log.includes('[LAUNCH]')
                      ? 'text-emerald-400 font-bold'
                      : log.includes('[ABORT]')
                      ? 'text-red-400 font-bold'
                      : 'text-white/70'
                  }
                >
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
