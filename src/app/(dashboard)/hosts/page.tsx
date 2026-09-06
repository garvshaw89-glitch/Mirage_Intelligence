'use client';

import { useState, useEffect } from 'react';
import {
  Server,
  Shield,
  Activity,
  AlertTriangle,
  TrendingUp,
  Cpu,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
} from 'lucide-react';
import { useMirage } from '@/components/providers/mirage-provider';

interface HostData {
  id: string;
  ip: string;
  hostname: string;
  host_type: string;
  is_internal: boolean;
  risk_score: number;
  risk_level: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  components: {
    packet?: number;
    connection?: number;
    session?: number;
    ml?: number;
    baseline?: number;
    correlation?: number;
  };
  baseline: Record<string, { mean: number; stddev: number; samples: number }>;
}

const INITIAL_HOSTS: HostData[] = [
  {
    id: '10.0.0.50',
    ip: '10.0.0.50',
    hostname: 'unknown-threat-node',
    host_type: 'attacker',
    is_internal: false,
    risk_score: 91.5,
    risk_level: 'CRITICAL',
    components: { packet: 84.0, connection: 45.0, session: 10.0, ml: 30.0, baseline: 25.0, correlation: 25.0 },
    baseline: {
      packets_per_sec: { mean: 6.2, stddev: 1.8, samples: 140 },
      syn_rate: { mean: 1.2, stddev: 0.5, samples: 140 },
    },
  },
  {
    id: '10.0.0.21',
    ip: '10.0.0.21',
    hostname: 'ws-engineering-04.corp.internal',
    host_type: 'user',
    is_internal: true,
    risk_score: 88.0,
    risk_level: 'CRITICAL',
    components: { packet: 10.0, connection: 20.0, session: 85.0, ml: 25.0, baseline: 15.0, correlation: 25.0 },
    baseline: {
      packets_per_sec: { mean: 14.5, stddev: 3.2, samples: 8940 },
      inter_arrival_mean: { mean: 2.1, stddev: 1.4, samples: 8940 },
    },
  },
  {
    id: '10.0.0.31',
    ip: '10.0.0.31',
    hostname: 'ws-finance-12.corp.internal',
    host_type: 'user',
    is_internal: true,
    risk_score: 72.0,
    risk_level: 'HIGH',
    components: { packet: 15.0, connection: 10.0, session: 68.0, ml: 20.0, baseline: 18.0, correlation: 15.0 },
    baseline: {
      packets_per_sec: { mean: 8.4, stddev: 2.1, samples: 6200 },
      dns_entropy: { mean: 2.1, stddev: 0.3, samples: 6200 },
    },
  },
  {
    id: '10.0.0.10',
    ip: '10.0.0.10',
    hostname: 'auth-dc01.corp.internal',
    host_type: 'server',
    is_internal: true,
    risk_score: 18.5,
    risk_level: 'NORMAL',
    components: { packet: 12.0, connection: 8.0, session: 0.0, ml: 5.0, baseline: 4.0, correlation: 0.0 },
    baseline: {
      packets_per_sec: { mean: 82.0, stddev: 14.5, samples: 25800 },
      concurrent_connections: { mean: 45.0, stddev: 8.2, samples: 25800 },
    },
  },
  {
    id: '10.0.0.1',
    ip: '10.0.0.1',
    hostname: 'border-gateway.corp.internal',
    host_type: 'gateway',
    is_internal: true,
    risk_score: 8.0,
    risk_level: 'NORMAL',
    components: { packet: 5.0, connection: 2.0, session: 0.0, ml: 2.0, baseline: 1.0, correlation: 0.0 },
    baseline: {
      packets_per_sec: { mean: 120.0, stddev: 25.0, samples: 14200 },
    },
  },
];

export default function HostsPage() {
  const { wsState } = useMirage();
  const [hosts, setHosts] = useState<HostData[]>(INITIAL_HOSTS);
  const [selectedHost, setSelectedHost] = useState<HostData | null>(INITIAL_HOSTS[0]);
  const [search, setSearch] = useState<string>('');

  // Merge live host updates from WebSocket
  useEffect(() => {
    if (wsState.hosts && wsState.hosts.length > 0) {
      setHosts((prev) => {
        const next = [...prev];
        for (const liveHost of wsState.hosts) {
          const idx = next.findIndex((h) => h.ip === liveHost.ip);
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              risk_score: (liveHost as any).riskScore ?? (liveHost as any).risk_score ?? next[idx].risk_score,
              risk_level: (liveHost as any).riskLevel ?? (liveHost as any).risk_level ?? next[idx].risk_level,
            };
          }
        }
        return next.sort((a, b) => b.risk_score - a.risk_score);
      });
    }
  }, [wsState.hosts]);

  const filteredHosts = hosts.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return h.ip.toLowerCase().includes(q) || h.hostname.toLowerCase().includes(q) || h.host_type.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl glass-card border border-white/10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Server className="text-blue-400" size={22} />
            Host Risk Leaderboard & Adaptive Baselines
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Continuous 0-100 risk scoring with EWMA behavioral baselines. Evaluates multi-layer deviations per endpoint.
          </p>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-white/40" />
          <input
            type="text"
            placeholder="Search IP, hostname, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Main Grid: Host Table + Host Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Host Table */}
        <div className="lg:col-span-7 p-5 rounded-xl glass-card border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Monitored Network Endpoints ({filteredHosts.length})
            </h2>
            <span className="text-xs text-white/40 font-mono">Sorted by risk descending</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/70">
              <thead className="text-[11px] uppercase tracking-wider text-white/40 border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Host IP / Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredHosts.map((h) => {
                  const isSelected = selectedHost?.id === h.id;
                  const levelColors = {
                    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
                    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
                    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    NORMAL: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                  }[h.risk_level] || 'bg-white/5 text-white/50 border-white/10';

                  return (
                    <tr
                      key={h.id}
                      onClick={() => setSelectedHost(h)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-medium text-white">{h.ip}</div>
                        <div className="text-[11px] text-white/40 font-sans truncate max-w-[180px]">
                          {h.hostname}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-sans font-semibold bg-white/5 text-white/60 border border-white/10">
                          {h.host_type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${h.risk_score}%`,
                                backgroundColor:
                                  h.risk_score >= 85
                                    ? '#ef4444'
                                    : h.risk_score >= 70
                                    ? '#f97316'
                                    : h.risk_score >= 40
                                    ? '#eab308'
                                    : '#10b981',
                              }}
                            />
                          </div>
                          <span className="font-bold text-white font-mono">
                            {h.risk_score.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${levelColors}`}>
                          {h.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button className="p-1 rounded text-white/40 hover:text-white transition-colors">
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Host Detail & Risk Breakdown */}
        <div className="lg:col-span-5">
          {selectedHost ? (
            <div className="p-5 rounded-xl glass-card border border-white/10 space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-white/10">
                <div>
                  <div className="text-xs text-white/40 uppercase font-semibold">ENDPOINT PROFILE</div>
                  <h3 className="text-lg font-bold text-white font-mono mt-0.5">{selectedHost.ip}</h3>
                  <div className="text-xs text-white/60 font-sans mt-0.5">{selectedHost.hostname}</div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-white">
                    {selectedHost.risk_score.toFixed(1)}
                  </div>
                  <span className="text-[10px] font-bold text-white/40 uppercase">COMPOSITE RISK</span>
                </div>
              </div>

              {/* Risk Components Breakdown */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Risk Component Decomposition
                </div>

                <div className="space-y-2 text-xs">
                  {Object.entries(selectedHost.components).map(([key, val]) => {
                    const score = Number(val || 0);
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-white/60 uppercase font-mono">{key} Component</span>
                          <span className="text-white font-mono font-bold">{score.toFixed(1)}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, score)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Adaptive EWMA Baseline Snapshot */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-emerald-400" />
                    Adaptive EWMA Baseline
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    ESTABLISHED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {Object.entries(selectedHost.baseline).map(([metric, stats]) => (
                    <div key={metric} className="p-2.5 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] space-y-1">
                      <div className="flex justify-between text-white/80">
                        <span>{metric}</span>
                        <span className="text-white/40">{stats.samples} samples</span>
                      </div>
                      <div className="flex justify-between text-white/50 text-[10px]">
                        <span>Mean: {stats.mean}</span>
                        <span>Stddev: ±{stats.stddev}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Passive Isolation Notice */}
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 leading-relaxed">
                Adaptive EWMA automatically factors in time of day and natural drift. Anomaly flags occur when an endpoint deviates by more than 4 standard deviations from its established historical mean.
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-white/40 glass-card rounded-xl">
              Select an endpoint to inspect its risk breakdown and EWMA baseline profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
