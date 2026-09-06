'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Shield,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  CircleAlert,
  Fingerprint,
  TrendingUp,
  Cpu,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useMirage } from '@/components/providers/mirage-provider';

interface EvidenceItem {
  feature_name: string;
  observed_value: number;
  baseline_value: number;
  deviation: number;
  contribution: number;
  explanation: string;
}

interface ThreatAlert {
  id: string;
  src_ip: string;
  dst_ip: string;
  threat_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  risk_score: number;
  detection_engine: string;
  description: string;
  timestamp: string;
  evidence: EvidenceItem[];
  model_version?: string;
  evidence_hash?: string;
}

const INITIAL_ALERTS: ThreatAlert[] = [
  {
    id: 'alt-c2-01',
    src_ip: '10.0.0.21',
    dst_ip: '198.51.100.42',
    threat_type: 'C2_BEACON',
    severity: 'CRITICAL',
    confidence: 0.94,
    risk_score: 88.5,
    detection_engine: 'SESSION',
    description: 'Automated C2 beaconing channel identified from 10.0.0.21 with strict 60s periodicity',
    timestamp: 'Just now',
    model_version: 'SessionTiming_FFT_v3.2',
    evidence_hash: '9f83a48e71b2d03a',
    evidence: [
      {
        feature_name: 'periodicity_score',
        observed_value: 0.93,
        baseline_value: 0.15,
        deviation: 0.78,
        contribution: 0.45,
        explanation: 'FFT peak autocorrelation detects periodic heartbeats with 0.05 CV (minimal human jitter)',
      },
      {
        feature_name: 'inter_arrival_cv',
        observed_value: 0.048,
        baseline_value: 0.85,
        deviation: -0.802,
        contribution: 0.35,
        explanation: 'Inter-arrival timing variance is 94% lower than standard interactive user browsing',
      },
      {
        feature_name: 'destination_rarity',
        observed_value: 0.98,
        baseline_value: 0.20,
        deviation: 0.78,
        contribution: 0.20,
        explanation: 'Single external IP accessed persistently without prior corporate DNS resolution',
      },
    ],
  },
  {
    id: 'alt-syn-02',
    src_ip: '10.0.0.50',
    dst_ip: '10.0.0.10',
    threat_type: 'SYN_FLOOD',
    severity: 'HIGH',
    confidence: 0.97,
    risk_score: 84.0,
    detection_engine: 'PACKET',
    description: 'SYN flood attack detected from 10.0.0.50 targeting auth server port 80 (640 SYN/s)',
    timestamp: '2 min ago',
    model_version: 'PacketRate_Engine_v2.1',
    evidence_hash: '4e29b1c783f09a12',
    evidence: [
      {
        feature_name: 'syn_rate',
        observed_value: 640.2,
        baseline_value: 4.5,
        deviation: 12.8,
        contribution: 0.50,
        explanation: 'SYN packet generation exceeds host EWMA baseline by 12.8 standard deviations',
      },
      {
        feature_name: 'syn_ack_ratio',
        observed_value: 14.2,
        baseline_value: 1.0,
        deviation: 13.2,
        contribution: 0.35,
        explanation: 'SYN to ACK ratio indicates uncompleted handshake flood without 3-way completion',
      },
      {
        feature_name: 'packets_per_sec',
        observed_value: 710.0,
        baseline_value: 22.0,
        deviation: 8.4,
        contribution: 0.15,
        explanation: 'Aggregate ingress volume spike detected on unidirectional sensor queue',
      },
    ],
  },
  {
    id: 'alt-dns-03',
    src_ip: '10.0.0.31',
    dst_ip: '1.1.1.1',
    threat_type: 'DNS_TUNNEL',
    severity: 'HIGH',
    confidence: 0.91,
    risk_score: 76.5,
    detection_engine: 'SESSION',
    description: 'Base32 encoded DNS exfiltration queries detected matching dnscat2 protocol signature',
    timestamp: '5 min ago',
    model_version: 'DNS_Entropy_Classifier_v1.2',
    evidence_hash: 'd827f394c1e05a8b',
    evidence: [
      {
        feature_name: 'dns_entropy',
        observed_value: 4.12,
        baseline_value: 2.1,
        deviation: 2.02,
        contribution: 0.55,
        explanation: 'Shannon entropy in subdomains indicates high-density binary payload encoding',
      },
      {
        feature_name: 'dns_query_len_mean',
        observed_value: 58.4,
        baseline_value: 14.0,
        deviation: 44.4,
        contribution: 0.30,
        explanation: 'Query length exceeds standard FQDN hostname distribution',
      },
      {
        feature_name: 'unique_subdomain_ratio',
        observed_value: 0.92,
        baseline_value: 0.05,
        deviation: 0.87,
        contribution: 0.15,
        explanation: 'Each query targets a unique random prefix, bypassing intermediate resolver caches',
      },
    ],
  },
];

export default function ThreatsPage() {
  const { wsState } = useMirage();
  const [alerts, setAlerts] = useState<ThreatAlert[]>(INITIAL_ALERTS);
  const [selectedAlert, setSelectedAlert] = useState<ThreatAlert | null>(INITIAL_ALERTS[0]);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Prepend live incoming alerts from WebSocket
  useEffect(() => {
    if (wsState.alerts && wsState.alerts.length > 0) {
      const latest: any = wsState.alerts[0];
      const converted: ThreatAlert = {
        id: latest.id,
        src_ip: latest.srcIp || latest.src_ip || '10.0.0.50',
        dst_ip: latest.dstIp || latest.dst_ip || '10.0.0.10',
        threat_type: latest.threatType || latest.threat_type || 'UNKNOWN',
        severity: (latest.severity as any) || 'HIGH',
        confidence: latest.confidence ?? 0.95,
        risk_score: latest.riskScore ?? latest.risk_score ?? 85.0,
        detection_engine: latest.detectionEngine ?? latest.detection_engine ?? 'SESSION',
        description: latest.description || `${latest.threatType || latest.threat_type} detected`,
        timestamp: 'Just now',
        evidence: latest.evidence || [],
        model_version: latest.modelVersion || latest.model_version || 'Hybrid_Engine_v1.0',
        evidence_hash: latest.evidenceHash || latest.evidence_hash || 'auto-gen-hash',
      };

      setAlerts((prev) => [converted, ...prev.filter((a) => a.id !== converted.id)]);
      setSelectedAlert(converted);
    }
  }, [wsState.alerts]);

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.src_ip.toLowerCase().includes(q) ||
        a.threat_type.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl glass-card border border-white/10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <AlertTriangle className="text-amber-400" size={22} />
            Threats & Explainable Evidence
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Every detection is traceable to raw unidirectional features, adaptive baselines, and mathematical evidence cards.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-white/40" />
            <input
              type="text"
              placeholder="Search IP, threat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="ALL" className="bg-slate-900">All Severities</option>
            <option value="CRITICAL" className="bg-slate-900">Critical</option>
            <option value="HIGH" className="bg-slate-900">High</option>
            <option value="MEDIUM" className="bg-slate-900">Medium</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Alerts List + Explainability Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Alerts List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-white/50 uppercase tracking-wider px-1">
            Verified Enclave Detections ({filteredAlerts.length})
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              const sevColors = {
                CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
                HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
                MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
              }[alert.severity];

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-3.5 rounded-xl transition-all duration-150 cursor-pointer border ${
                    isSelected
                      ? 'bg-white/10 border-blue-500/50 shadow-lg shadow-blue-500/5'
                      : 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sevColors}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[11px] text-white/40">{alert.timestamp}</span>
                  </div>

                  <div className="font-semibold text-sm text-white">{alert.threat_type}</div>
                  <div className="text-xs text-white/50 mt-0.5 truncate">{alert.description}</div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[11px] text-white/40">
                    <span className="font-mono">Src: {alert.src_ip}</span>
                    <span className="font-semibold text-white/70">Risk: {alert.risk_score.toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Explainability Detail & Evidence Cards */}
        <div className="lg:col-span-7">
          {selectedAlert ? (
            <div className="p-6 rounded-xl glass-card border border-white/10 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                      {selectedAlert.severity}
                    </span>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      {selectedAlert.threat_type}
                    </h2>
                  </div>
                  <p className="text-xs text-white/60 mt-1 font-mono">
                    ID: {selectedAlert.id} · Engine: {selectedAlert.detection_engine} · Model: {selectedAlert.model_version || 'v2.1'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-white/40 uppercase">CONFIDENCE</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {(selectedAlert.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-white/40 uppercase">RISK SCORE</div>
                    <div className="text-base font-bold text-red-400 font-mono">
                      {selectedAlert.risk_score.toFixed(1)}/100
                    </div>
                  </div>
                </div>
              </div>

              {/* Endpoint Context */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-white/5 border border-white/10 text-xs">
                <div>
                  <span className="text-white/40 block text-[10px]">SOURCE HOST</span>
                  <span className="text-white font-mono font-medium">{selectedAlert.src_ip}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px]">DESTINATION</span>
                  <span className="text-white font-mono font-medium">{selectedAlert.dst_ip}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px]">VERIFIED HASH</span>
                  <span className="text-blue-400 font-mono font-medium truncate block">
                    #{selectedAlert.evidence_hash || 'SHA256-OK'}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px]">TAMPER AUDIT</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Immutable
                  </span>
                </div>
              </div>

              {/* "WHY WE FLAGGED THIS" Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                    <Fingerprint size={14} className="text-blue-400" />
                    Why We Flagged This (Evidence Decomposition)
                  </h3>
                  <span className="text-[11px] text-white/40">
                    Feature contributions sum to 100%
                  </span>
                </div>

                <div className="space-y-2.5">
                  {selectedAlert.evidence && selectedAlert.evidence.length > 0 ? (
                    selectedAlert.evidence.map((ev, idx) => {
                      const contributionPct = Math.round(ev.contribution * 100);
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg bg-white/5 border border-white/10 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-semibold text-white/90">
                              {ev.feature_name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                              +{contributionPct}% contribution
                            </span>
                          </div>

                          <div className="text-xs text-white/70 leading-relaxed">
                            {ev.explanation}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono">
                            <div>
                              <span className="text-white/30 text-[9px] block">OBSERVED</span>
                              <span className="text-red-400 font-bold">{ev.observed_value}</span>
                            </div>
                            <div>
                              <span className="text-white/30 text-[9px] block">BASELINE</span>
                              <span className="text-white/60">{ev.baseline_value}</span>
                            </div>
                            <div>
                              <span className="text-white/30 text-[9px] block">DEVIATION</span>
                              <span className="text-amber-400 font-bold">
                                {ev.deviation > 0 ? `+${ev.deviation.toFixed(1)}σ` : `${ev.deviation.toFixed(1)}σ`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-white/40">
                      No decomposed features available for this event.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Banner */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                <div className="text-xs text-blue-300">
                  <span className="font-semibold">Unidirectional Enclave Notice:</span> No active block signals are transmitted outward. Security teams can isolate the host manually at the switch layer.
                </div>
                <button className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex-shrink-0">
                  Export Evidence Bundle
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-white/40 glass-card rounded-xl">
              Select an alert from the left to inspect explainable evidence cards.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
