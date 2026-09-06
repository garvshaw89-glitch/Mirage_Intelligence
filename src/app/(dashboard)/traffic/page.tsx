'use client';

import { useState } from 'react';
import {
  Zap,
  Activity,
  Layers,
  Server,
  Filter,
  BarChart2,
  PieChart,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useMirage } from '@/components/providers/mirage-provider';

export default function TrafficPage() {
  const { metrics, isSimulating, activeScenario, hosts } = useMirage();
  const [resolution, setResolution] = useState<string>('5s');

  const totalPps = metrics?.packetsPerSec || (isSimulating ? 12400 : 850);

  const PROTOCOL_STATS = isSimulating && activeScenario === 'UDP_FLOOD'
    ? [
        { name: 'UDP (High Throughput Floods)', pct: 86, pps: Math.round(totalPps * 0.86), color: '#ef4444' },
        { name: 'TCP (HTTP / HTTPS / Raw)', pct: 10, pps: Math.round(totalPps * 0.10), color: '#3b82f6' },
        { name: 'DNS (Port 53 / Tunneling)', pct: 3, pps: Math.round(totalPps * 0.03), color: '#a855f7' },
        { name: 'ICMP / Other Control', pct: 1, pps: Math.round(totalPps * 0.01), color: '#10b981' },
      ]
    : isSimulating && activeScenario === 'DNS_TUNNEL'
    ? [
        { name: 'DNS (Port 53 / Tunneling)', pct: 48, pps: Math.round(totalPps * 0.48), color: '#f59e0b' },
        { name: 'TCP (HTTP / HTTPS / Raw)', pct: 42, pps: Math.round(totalPps * 0.42), color: '#3b82f6' },
        { name: 'UDP (High Throughput Floods)', pct: 8, pps: Math.round(totalPps * 0.08), color: '#f97316' },
        { name: 'ICMP / Other Control', pct: 2, pps: Math.round(totalPps * 0.02), color: '#10b981' },
      ]
    : isSimulating && (activeScenario === 'SYN_FLOOD' || activeScenario === 'SLOWLORIS')
    ? [
        { name: 'TCP (HTTP / SYN Floods)', pct: 92, pps: Math.round(totalPps * 0.92), color: '#ef4444' },
        { name: 'UDP (High Throughput Floods)', pct: 5, pps: Math.round(totalPps * 0.05), color: '#f97316' },
        { name: 'DNS (Port 53 / Tunneling)', pct: 2, pps: Math.round(totalPps * 0.02), color: '#a855f7' },
        { name: 'ICMP / Other Control', pct: 1, pps: Math.round(totalPps * 0.01), color: '#10b981' },
      ]
    : [
        { name: 'TCP (HTTP / HTTPS / Raw)', pct: 64, pps: Math.round(totalPps * 0.64), color: '#3b82f6' },
        { name: 'UDP (High Throughput Floods)', pct: 22, pps: Math.round(totalPps * 0.22), color: '#f97316' },
        { name: 'DNS (Port 53 / Tunneling)', pct: 11, pps: Math.round(totalPps * 0.11), color: '#a855f7' },
        { name: 'ICMP / Other Control', pct: 3, pps: Math.round(totalPps * 0.03), color: '#10b981' },
      ];

  const TOP_TALKERS = [
    {
      ip: '10.0.0.50',
      name: 'unknown-threat-node',
      role: 'Attacker Node',
      pps: isSimulating && (activeScenario === 'SYN_FLOOD' || activeScenario === 'UDP_FLOOD') ? totalPps : 180,
      bytes: isSimulating ? '142.8 MB' : '14.2 MB',
    },
    {
      ip: '10.0.0.21',
      name: 'ws-engineering-04',
      role: 'Internal Host',
      pps: isSimulating && activeScenario === 'C2_BEACON' ? 420 : 64,
      bytes: isSimulating && activeScenario === 'C2_BEACON' ? '28.4 MB' : '5.1 MB',
    },
    {
      ip: '10.0.0.10',
      name: 'auth-dc01.corp.internal',
      role: 'Internal Server',
      pps: 420,
      bytes: '48.8 MB',
    },
    {
      ip: '10.0.0.31',
      name: 'ws-finance-12',
      role: 'Internal Host',
      pps: isSimulating && activeScenario === 'DNS_TUNNEL' ? 620 : 18,
      bytes: isSimulating && activeScenario === 'DNS_TUNNEL' ? '18.4 MB' : '1.4 MB',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl glass-card border border-white/10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Zap className="text-amber-400" size={22} />
            Passive Traffic Breakdown & Flow Resolution
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Aggregated traffic statistics categorized by protocols, top network talkers, and multi-resolution time windows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-mono">RESOLUTION:</span>
          {['1s', '5s', '30s', '60s'].map((res) => (
            <button
              key={res}
              onClick={() => setResolution(res)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
                resolution === res
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* Protocol Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PROTOCOL_STATS.map((proto) => (
          <div key={proto.name} className="p-4 rounded-xl glass-card border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/80 font-mono">{proto.name}</span>
              <span className="text-xs font-bold font-mono" style={{ color: proto.color }}>
                {proto.pct}%
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${proto.pct}%`, backgroundColor: proto.color }}
              />
            </div>

            <div className="text-[11px] text-white/40 font-mono flex justify-between pt-1">
              <span>Rate: {proto.pps} pps</span>
              <span>Diode Rx</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Talkers Table */}
      <div className="p-5 rounded-xl glass-card border border-white/10 space-y-4">
        <h2 className="text-sm font-semibold text-white tracking-wide">
          Observed Ingress Endpoints (Top Talkers)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="text-[11px] uppercase tracking-wider text-white/40 border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Host IP</th>
                <th className="py-2.5 px-3">Hostname</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Ingress Rate</th>
                <th className="py-2.5 px-3">Total Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {TOP_TALKERS.map((t) => (
                <tr key={t.ip} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">{t.ip}</td>
                  <td className="py-3 px-3 text-white/60 font-sans">{t.name}</td>
                  <td className="py-3 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/70 border border-white/10 font-sans">
                      {t.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-blue-400 font-bold">{t.pps} pps</td>
                  <td className="py-3 px-3 text-white/70">{t.bytes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
