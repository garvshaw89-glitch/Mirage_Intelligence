'use client';

import Link from 'next/link';
import { Server, ArrowRight, ShieldAlert, ChevronRight } from 'lucide-react';
import type { HostRisk } from '@/types';

interface RiskLeaderboardProps {
  hosts: HostRisk[];
  onSelectHost?: (hostId: string) => void;
}

export function RiskLeaderboard({ hosts, onSelectHost }: RiskLeaderboardProps) {
  const sortedHosts = [...hosts].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);

  return (
    <div className="p-5 rounded-xl glass-card border border-white/10 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
          <Server size={16} className="text-blue-400" />
          Host Risk Leaderboard
        </h2>
        <Link
          href="/hosts"
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
        >
          View all <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        {sortedHosts.length > 0 ? (
          sortedHosts.map((h) => {
            const risk = h.riskScore;
            const barColor =
              risk >= 85 ? '#ef4444' : risk >= 70 ? '#f97316' : risk >= 40 ? '#eab308' : '#10b981';

            return (
              <div
                key={h.id}
                onClick={() => onSelectHost?.(h.id)}
                className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/15 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-white">{h.ip}</span>
                    <span className="text-white/40 ml-2 text-[11px] truncate">{h.hostname || 'Endpoint'}</span>
                  </div>
                  <span className="font-mono font-bold" style={{ color: barColor }}>
                    {risk.toFixed(1)}/100
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, risk)}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-xs text-white/40">
            No active host telemetry. Launch a scenario in the Cyber Range to observe scores.
          </div>
        )}
      </div>
    </div>
  );
}
