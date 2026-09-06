'use client';

import { Shield, Lock, Radio, ArrowRight, Eye, Cpu, Database, Activity } from 'lucide-react';

interface OneWayNetworkDiagramProps {
  packetsPerSec?: number;
  hosts?: any[];
  isActive?: boolean;
}

export function OneWayNetworkDiagram({ packetsPerSec, hosts, isActive = true }: OneWayNetworkDiagramProps = {}) {
  return (
    <div className="p-5 rounded-xl glass-card border border-white/10 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Radio size={16} className="text-blue-400" />
            Unidirectional Optical Diode Network Architecture
          </h2>
          <p className="text-xs text-white/50">
            Hardware-enforced isolation. Physical optical diode guarantees zero reverse transmission into the monitored enclave.
          </p>
        </div>

        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
          AIR-GAPPED RX ENFORCED
        </span>
      </div>

      {/* Visual Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center py-4 text-xs font-mono">
        {/* Left Enclave: Monitored Network */}
        <div className="md:col-span-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
              MONITORED NETWORK (TX ONLY)
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between p-2 rounded bg-white/5">
              <span className="text-white font-medium">auth-dc01 (10.0.0.10)</span>
              <span className="text-white/40">Server</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/5">
              <span className="text-white font-medium">eng-workstation (10.0.0.21)</span>
              <span className="text-white/40">Client</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/5">
              <span className="text-red-400 font-medium">threat-node (10.0.0.50)</span>
              <span className="text-red-400/60">Untrusted</span>
            </div>
          </div>
          <div className="text-[10px] text-white/40 pt-1">
            Standard IP stack outputting packet mirrors to tap.
          </div>
        </div>

        {/* Center: Hardware Data Diode */}
        <div className="md:col-span-3 flex flex-col items-center justify-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
            <Shield size={20} />
          </div>

          <div className="font-bold text-white text-xs tracking-wider">DATA DIODE</div>
          <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <ArrowRight size={12} className="animate-pulse" /> ONE-WAY PHOTONS
          </div>

          <div className="w-full p-1.5 rounded bg-black/40 text-[9px] text-white/50 space-y-0.5">
            <div className="text-emerald-400 font-bold">Rx Fiber: CONNECTED</div>
            <div className="text-red-400 font-bold">Tx Fiber: CUT (NO ACKs)</div>
          </div>
        </div>

        {/* Right Enclave: MIRAGE Monitoring Enclave */}
        <div className="md:col-span-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
              MIRAGE ENCLAVE (PASSIVE RX)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between p-2 rounded bg-white/5 text-white/80">
              <span className="flex items-center gap-1.5">
                <Eye size={12} className="text-blue-400" /> Passive Ingress Tap
              </span>
              <span className="text-emerald-400 font-bold">0 Drop</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/5 text-white/80">
              <span className="flex items-center gap-1.5">
                <Activity size={12} className="text-purple-400" /> Multi-Engine Detection
              </span>
              <span className="text-purple-400 font-bold">Active</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/5 text-white/80">
              <span className="flex items-center gap-1.5">
                <Database size={12} className="text-amber-400" /> PostgreSQL & Audit Chain
              </span>
              <span className="text-emerald-400 font-bold">Online</span>
            </div>
          </div>
          <div className="text-[10px] text-white/40 pt-1">
            Isolated processing: no outbound packets can ever reach production network.
          </div>
        </div>
      </div>
    </div>
  );
}
