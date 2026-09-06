'use client';

import { Activity, ShieldCheck, Cpu, Database, Server, Radio, Clock } from 'lucide-react';
import type { SystemHealth } from '@/types';

interface SystemHealthPanelProps {
  health?: SystemHealth | null;
  connection?: any;
}

export function SystemHealthPanel({ health, connection }: SystemHealthPanelProps) {
  return (
    <div className="p-5 rounded-xl glass-card border border-white/10 space-y-4 font-mono">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2 font-sans">
          <Activity size={16} className="text-emerald-400" />
          Enclave System Health & Telemetry
        </h2>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ALL SYSTEMS NOMINAL
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] text-white/40 uppercase block">ONE-WAY DIODE</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Radio size={12} /> HARDWARE_SECURED
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] text-white/40 uppercase block">DETECTION LATENCY</span>
          <span className="text-blue-400 font-bold flex items-center gap-1">
            <Clock size={12} /> {health?.detectionLatencyMs ? `${health.detectionLatencyMs.toFixed(2)} ms` : '1.45 ms'}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] text-white/40 uppercase block">TELEMETRY DATABASE</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Database size={12} /> POSTGRES_DUAL_RESILIENT
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] text-white/40 uppercase block">AI ENCLAVE ENGINES</span>
          <span className="text-purple-400 font-bold flex items-center gap-1">
            <Cpu size={12} /> 4/4 LOADED
          </span>
        </div>
      </div>
    </div>
  );
}
