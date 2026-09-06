'use client';

import { useEffect, useState } from 'react';
import {
  Shield, Activity, Server, AlertTriangle, GitBranch,
  Zap, Eye, Radar, Clock, Cpu, Database, CircleAlert,
  Globe, Terminal, RefreshCw
} from 'lucide-react';
import { useMirage } from '@/components/providers/mirage-provider';
import { CyberGlobe } from '@/components/network/cyber-globe';
import { OneWayNetworkDiagram } from '@/components/network/one-way-diagram';
import { ThreatStream } from '@/components/dashboard/threat-stream';
import { RiskLeaderboard } from '@/components/dashboard/risk-leaderboard';
import { MetricCard } from '@/components/dashboard/metric-card';
import { SystemHealthPanel } from '@/components/dashboard/system-health';
import { cn, formatNumber, formatBytes, formatLatency } from '@/lib/utils';
import type { MetricsSnapshot } from '@/types';

// Simulated demo metrics when backend not connected
const DEMO_METRICS: MetricsSnapshot = {
  timestamp: new Date().toISOString(),
  packetsPerSec: 847,
  bytesPerSec: 2_340_000,
  activeHosts: 5,
  activeSessions: 34,
  alertsTotal: 0,
  criticalHosts: 0,
  activeCampaigns: 0,
  detectionLatencyMs: 4.2,
};

export default function DashboardPage() {
  const {
    metrics,
    hosts,
    alerts,
    campaigns,
    health,
    connection,
    threatStream,
    isSimulating,
    activeScenario,
    stopSimulation,
  } = useMirage();
  const [displayMetrics, setDisplayMetrics] = useState<MetricsSnapshot>(DEMO_METRICS);
  const [viewMode, setViewMode] = useState<'globe' | 'topology'>('globe');

  useEffect(() => {
    if (metrics) setDisplayMetrics(metrics);
  }, [metrics]);

  const activeAlerts = alerts.filter(a => a.isActive);
  const criticalHosts = hosts.filter(h => h.riskScore >= 80);

  return (
    <div className="space-y-6">
      {/* ── Hero strip ── */}
      <div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield size={22} style={{ color: '#3b9eff' }} />
              <h1 className="text-2xl font-black tracking-wide" style={{ color: '#e8edf4' }}>
                MIRAGE INTELLIGENCE
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20" style={{ letterSpacing: '0.12em' }}>
                UNIDIRECTIONAL SENSOR ENCLAVE
              </span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(232,237,244,0.45)' }}>
              Real-time multi-resolution AI risk evaluation across hardware-isolated optical taps.
            </p>
          </div>

          {/* System status & Simulation Badge */}
          <div className="flex items-center gap-3 flex-wrap">
            {isSimulating && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-400 font-mono animate-pulse">
                <AlertTriangle size={13} />
                <span>ATTACK ACTIVE: {activeScenario}</span>
                <button
                  onClick={stopSimulation}
                  className="ml-2 px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] transition-colors"
                >
                  STOP
                </button>
              </div>
            )}
            <StatusBadge label="SENSOR" value="ONLINE" color="#4ade80" pulse />
            <StatusBadge label="ONE-WAY" value="ENFORCED" color="#4ade80" pulse />
            <StatusBadge
              label="PIPELINE"
              value={health?.pipelineStatus ?? (isSimulating ? 'EVALUATING_ATTACK' : 'HEALTHY')}
              color={isSimulating ? '#ef4444' : '#4ade80'}
              pulse
            />
            <StatusBadge label="ML ENGINE" value="READY" color="#3b9eff" pulse />
          </div>
        </div>
      </div>

      {/* ── Primary metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3" role="region" aria-label="Primary metrics">
        <MetricCard
          label="Traffic"
          value={formatBytes(displayMetrics.bytesPerSec) + '/s'}
          icon={<Zap size={14} />}
          sublabel="throughput"
          highlight={displayMetrics.bytesPerSec > 5000000 ? 'critical' : undefined}
        />
        <MetricCard
          label="Packets/sec"
          value={formatNumber(displayMetrics.packetsPerSec)}
          icon={<Activity size={14} />}
          sublabel="ingestion rate"
          highlight={displayMetrics.packetsPerSec > 5000 ? 'critical' : undefined}
        />
        <MetricCard
          label="Active Hosts"
          value={(displayMetrics.activeHosts || hosts.length).toString()}
          icon={<Server size={14} />}
          sublabel="monitored"
        />
        <MetricCard
          label="Sessions"
          value={displayMetrics.activeSessions.toString()}
          icon={<Eye size={14} />}
          sublabel="active"
        />
        <MetricCard
          label="Threats"
          value={activeAlerts.length.toString()}
          icon={<AlertTriangle size={14} />}
          sublabel="detected"
          highlight={activeAlerts.length > 0 ? 'high' : undefined}
        />
        <MetricCard
          label="Critical Hosts"
          value={criticalHosts.length.toString()}
          icon={<CircleAlert size={14} />}
          sublabel="risk ≥ 80"
          highlight={criticalHosts.length > 0 ? 'critical' : undefined}
        />
        <MetricCard
          label="Campaigns"
          value={displayMetrics.activeCampaigns.toString()}
          icon={<GitBranch size={14} />}
          sublabel="correlated"
          highlight={displayMetrics.activeCampaigns > 0 ? 'critical' : undefined}
        />
      </div>

      {/* ── Visualization Header Switcher ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('globe')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
              viewMode === 'globe'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
            }`}
          >
            <Globe size={14} /> 3D CYBER ATTACK GLOBE
          </button>
          <button
            onClick={() => setViewMode('topology')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
              viewMode === 'topology'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-lg shadow-blue-500/10'
                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
            }`}
          >
            <Server size={14} /> HARDWARE DIODE TOPOLOGY
          </button>
        </div>

        <span className="text-[11px] font-mono text-white/40 hidden sm:inline">
          {viewMode === 'globe'
            ? 'Interactive 3D Orbital Projection · Drag to rotate · Hover to pause'
            : 'Unidirectional Mirror TAP (Hardware RX Enforced)'}
        </span>
      </div>

      {/* ── Primary Visualizer (3D Earth Globe or Hardware Diode Topology) ── */}
      <div>
        {viewMode === 'globe' ? (
          <CyberGlobe
            alerts={alerts}
            hosts={hosts}
            activeScenario={isSimulating ? activeScenario : null}
            className="h-[580px]"
          />
        ) : (
          <OneWayNetworkDiagram
            packetsPerSec={displayMetrics.packetsPerSec}
            hosts={hosts}
            isActive
          />
        )}
      </div>

      {/* ── Secondary content grid: Threat Stream & System Health ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Left: Real-time Threat Stream */}
        <div>
          <ThreatStream events={threatStream} />
        </div>

        {/* Right: System Health */}
        <div>
          <SystemHealthPanel health={health} connection={connection} />
        </div>
      </div>

      {/* ── Host risk leaderboard + Detection stats ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RiskLeaderboard hosts={hosts} />

        {/* Detection engine status */}
        <div className="glass p-5" role="region" aria-label="Detection engines">
          <div className="flex items-center gap-2 mb-4">
            <Radar size={14} style={{ color: '#3b9eff' }} />
            <h2 className="text-heading-4">Detection Engines</h2>
          </div>

              <div className="space-y-3">
                {[
                  {
                    name: 'Packet Engine',
                    desc: 'SYN flood · UDP flood · traffic spikes',
                    status: 'ACTIVE',
                    latency: '2.1ms',
                    color: '#4ade80',
                  },
                  {
                    name: 'Connection Engine',
                    desc: 'Slowloris · half-open connections',
                    status: 'ACTIVE',
                    latency: '3.4ms',
                    color: '#4ade80',
                  },
                  {
                    name: 'Session Engine',
                    desc: 'C2 beaconing · DGA · DNS tunnel',
                    status: 'ACTIVE',
                    latency: '8.7ms',
                    color: '#4ade80',
                  },
                  {
                    name: 'Adaptive Baseline',
                    desc: 'EWMA per-host · deviation scoring',
                    status: 'LEARNING',
                    latency: '1.2ms',
                    color: '#fbbf24',
                  },
                  {
                    name: 'ML Engine (Isolation Forest)',
                    desc: 'Unsupervised anomaly detection',
                    status: 'READY',
                    latency: '12.3ms',
                    color: '#3b9eff',
                  },
                  {
                    name: 'Campaign Correlator',
                    desc: 'Temporal graph · multi-host',
                    status: 'ACTIVE',
                    latency: '5.1ms',
                    color: '#4ade80',
                  },
                ].map((engine) => (
                  <div
                    key={engine.name}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg table-row-hover"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <span
                      className="status-dot flex-shrink-0"
                      style={{ background: engine.color }}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium" style={{ color: '#e8edf4' }}>
                        {engine.name}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(232,237,244,0.35)', marginTop: '1px' }}>
                        {engine.desc}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-data text-xs" style={{ color: 'rgba(232,237,244,0.4)' }}>
                        {engine.latency}
                      </span>
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{
                          color: engine.color,
                          background: `${engine.color}18`,
                          fontSize: '9px',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {engine.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Latest alerts ── */}
          {activeAlerts.length > 0 && (
            <div className="glass p-5" role="region" aria-label="Latest alerts">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} style={{ color: '#f97316' }} />
                  <h2 className="text-heading-4">Active Threats</h2>
                </div>
                <a href="/threats" className="text-xs" style={{ color: '#3b9eff' }}>
                  View all →
                </a>
              </div>
              <div className="space-y-2">
                {activeAlerts.slice(0, 5).map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg table-row-hover cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <CircleAlert
                      size={13}
                      style={{ color: getSeverityColorLocal(alert.severity), flexShrink: 0 }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium" style={{ color: '#e8edf4' }}>
                          {alert.threatType.replace(/_/g, ' ')}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: `${getSeverityColorLocal(alert.severity)}15`,
                            color: getSeverityColorLocal(alert.severity),
                            fontSize: '9px',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'rgba(232,237,244,0.4)' }}>
                        {alert.srcIp} → {alert.dstIp ?? alert.dstDomain ?? 'unknown'}
                      </div>
                    </div>
                    <div className="text-xs text-mono" style={{ color: 'rgba(232,237,244,0.35)' }}>
                      {`${Math.round(alert.riskScore)}/100`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
    </div>
  );
}

function StatusBadge({
  label,
  value,
  color,
  pulse = false,
}: {
  label: string;
  value: string;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${label}: ${value}`}>
      <span
        className={cn('status-dot', pulse && 'status-dot-pulse')}
        style={{ background: color }}
        aria-hidden="true"
      />
      <span className="text-label">{label}</span>
      <span style={{ color, fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em' }}>
        {value}
      </span>
    </div>
  );
}

function getSeverityColorLocal(severity: string): string {
  switch (severity) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH':     return '#f97316';
    case 'MEDIUM':   return '#fbbf24';
    case 'LOW':      return '#60a5fa';
    default:         return '#60a5fa';
  }
}
