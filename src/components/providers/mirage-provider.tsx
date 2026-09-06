'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useWebSocket, type MirageWebSocketState } from '@/hooks/useWebSocket';
import type {
  Alert,
  Host,
  Campaign,
  MetricsSnapshot,
  SimulationStatus,
  ThreatEventDisplay,
  SimulationScenario,
} from '@/types';

export interface MirageContextValue extends MirageWebSocketState {
  wsState: MirageWebSocketState;
  on: ReturnType<typeof useWebSocket>['on'];
  startSimulation: (scenario: SimulationScenario, durationSeconds?: number) => Promise<void>;
  stopSimulation: () => Promise<void>;
  isSimulating: boolean;
  activeScenario: SimulationScenario | null;
}

const MirageContext = createContext<MirageContextValue | null>(null);

const INITIAL_HOSTS: Host[] = [
  {
    id: '10.0.0.50',
    ip: '10.0.0.50',
    hostname: 'unknown-threat-node',
    firstSeen: new Date(Date.now() - 3600000).toISOString(),
    lastSeen: new Date().toISOString(),
    riskScore: 24.0,
    riskLevel: 'LOW',
    riskTrend: 0,
    riskTrendDirection: 'STABLE',
    activeThreats: [],
    packetRate: 18,
    bytesRate: 14200,
    connectionCount: 4,
    isBaselineReady: true,
    baselineConfidence: 0.95,
    tags: ['EXTERNAL', 'PROBING'],
  },
  {
    id: '10.0.0.21',
    ip: '10.0.0.21',
    hostname: 'ws-engineering-04.corp.internal',
    firstSeen: new Date(Date.now() - 7200000).toISOString(),
    lastSeen: new Date().toISOString(),
    riskScore: 12.0,
    riskLevel: 'NORMAL',
    riskTrend: 0,
    riskTrendDirection: 'STABLE',
    activeThreats: [],
    packetRate: 35,
    bytesRate: 48000,
    connectionCount: 8,
    isBaselineReady: true,
    baselineConfidence: 0.98,
    tags: ['INTERNAL', 'WORKSTATION'],
  },
  {
    id: '10.0.0.31',
    ip: '10.0.0.31',
    hostname: 'ws-finance-12.corp.internal',
    firstSeen: new Date(Date.now() - 7200000).toISOString(),
    lastSeen: new Date().toISOString(),
    riskScore: 10.5,
    riskLevel: 'NORMAL',
    riskTrend: 0,
    riskTrendDirection: 'STABLE',
    activeThreats: [],
    packetRate: 12,
    bytesRate: 16000,
    connectionCount: 3,
    isBaselineReady: true,
    baselineConfidence: 0.96,
    tags: ['INTERNAL', 'FINANCE'],
  },
  {
    id: '10.0.0.10',
    ip: '10.0.0.10',
    hostname: 'auth-dc01.corp.internal',
    firstSeen: new Date(Date.now() - 86400000).toISOString(),
    lastSeen: new Date().toISOString(),
    riskScore: 8.0,
    riskLevel: 'NORMAL',
    riskTrend: 0,
    riskTrendDirection: 'STABLE',
    activeThreats: [],
    packetRate: 420,
    bytesRate: 680000,
    connectionCount: 45,
    isBaselineReady: true,
    baselineConfidence: 0.99,
    tags: ['SERVER', 'AUTH', 'ENCLAVE_TARGET'],
  },
  {
    id: '10.0.0.1',
    ip: '10.0.0.1',
    hostname: 'border-gateway.corp.internal',
    firstSeen: new Date(Date.now() - 86400000).toISOString(),
    lastSeen: new Date().toISOString(),
    riskScore: 5.0,
    riskLevel: 'NORMAL',
    riskTrend: 0,
    riskTrendDirection: 'STABLE',
    activeThreats: [],
    packetRate: 850,
    bytesRate: 1250000,
    connectionCount: 110,
    isBaselineReady: true,
    baselineConfidence: 0.99,
    tags: ['GATEWAY', 'DIODE_MONITORED'],
  },
];

export function MirageProvider({ children }: { children: ReactNode }) {
  const { state: wsState, on } = useWebSocket();

  // Local state overlay when simulation is triggered
  const [localSimulation, setLocalSimulation] = useState<SimulationStatus | null>(null);
  const [localMetrics, setLocalMetrics] = useState<MetricsSnapshot | null>(null);
  const [localHosts, setLocalHosts] = useState<Host[]>(INITIAL_HOSTS);
  const [localAlerts, setLocalAlerts] = useState<Alert[]>([]);
  const [localThreatStream, setLocalThreatStream] = useState<ThreatEventDisplay[]>([]);
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);

  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulationEndRef = useRef<number>(0);
  const packetCountRef = useRef<number>(0);

  // Stop simulation helper
  const stopSimulation = useCallback(async () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setActiveScenario(null);
    setLocalSimulation((prev) =>
      prev
        ? {
            ...prev,
            isRunning: false,
            stage: 'STOPPED',
          }
        : null
    );

    // Gradual decay of metrics back to baseline
    setLocalMetrics((prev) =>
      prev
        ? {
            ...prev,
            packetsPerSec: 840,
            bytesPerSec: 1_250_000,
            alertsTotal: localAlerts.length,
            criticalHosts: 0,
            activeCampaigns: 0,
            detectionLatencyMs: 1.45,
          }
        : null
    );

    // Decay host risks back to normal
    setLocalHosts((prev) =>
      prev.map((h) => ({
        ...h,
        riskScore: Math.max(8.0, h.riskScore * 0.4),
        riskLevel: h.riskScore * 0.4 >= 60 ? 'HIGH' : 'NORMAL',
        riskTrendDirection: 'FALLING',
      }))
    );

    // Signal backend
    try {
      await fetch('http://localhost:8000/api/v1/simulation/stop', { method: 'POST' });
    } catch {
      // Backend offline fallback handled
    }
  }, [localAlerts.length]);

  // Start simulation handler
  const startSimulation = useCallback(
    async (scenario: SimulationScenario, durationSeconds: number = 60) => {
      // Clear any prior timer
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }

      setActiveScenario(scenario);
      const startTime = Date.now();
      simulationEndRef.current = startTime + durationSeconds * 1000;
      packetCountRef.current = 0;

      // Immediate state change
      setLocalSimulation({
        isRunning: true,
        scenario,
        elapsedSeconds: 0,
        durationSeconds,
        stage: `RUNNING_${scenario}`,
        packetsGenerated: 0,
        flowsGenerated: 0,
      });

      // Define attack parameters by scenario
      const scenarioParams: Record<
        SimulationScenario,
        {
          targetHost: string;
          threatType: string;
          severity: Alert['severity'];
          riskTarget: number;
          ppsRange: [number, number];
          bpsRange: [number, number];
          desc: string;
        }
      > = {
        SYN_FLOOD: {
          targetHost: '10.0.0.50',
          threatType: 'SYN_FLOOD',
          severity: 'CRITICAL',
          riskTarget: 94.5,
          ppsRange: [9500, 14200],
          bpsRange: [3800000, 5600000],
          desc: 'High-volume TCP SYN flood detected targeting auth-dc01 port 80 (640 SYN/s)',
        },
        UDP_FLOOD: {
          targetHost: '10.0.0.50',
          threatType: 'UDP_FLOOD',
          severity: 'CRITICAL',
          riskTarget: 91.0,
          ppsRange: [14000, 21000],
          bpsRange: [12000000, 18500000],
          desc: 'UDP datagram saturation flood aimed at optical tap queue exhaustion',
        },
        SLOWLORIS: {
          targetHost: '10.0.0.50',
          threatType: 'SLOWLORIS',
          severity: 'HIGH',
          riskTarget: 78.5,
          ppsRange: [850, 1400],
          bpsRange: [180000, 320000],
          desc: 'Slowloris connection starvation: 50+ concurrent half-open HTTP connections',
        },
        C2_BEACON: {
          targetHost: '10.0.0.21',
          threatType: 'C2_BEACON',
          severity: 'CRITICAL',
          riskTarget: 89.0,
          ppsRange: [420, 680],
          bpsRange: [120000, 240000],
          desc: 'Periodic C2 beaconing channel identified with strict 60s periodicity (CV = 0.048)',
        },
        DNS_TUNNEL: {
          targetHost: '10.0.0.31',
          threatType: 'DNS_TUNNEL',
          severity: 'HIGH',
          riskTarget: 82.0,
          ppsRange: [650, 950],
          bpsRange: [450000, 780000],
          desc: 'Base32 encoded DNS tunneling query flow matching dnscat2 signature',
        },
        DGA: {
          targetHost: '10.0.0.21',
          threatType: 'DGA',
          severity: 'HIGH',
          riskTarget: 74.0,
          ppsRange: [520, 810],
          bpsRange: [310000, 520000],
          desc: 'Algorithmic Domain Generation (DGA) query flurry detected',
        },
        MULTI_HOST_CAMPAIGN: {
          targetHost: '10.0.0.50',
          threatType: 'MULTI_HOST_CAMPAIGN',
          severity: 'CRITICAL',
          riskTarget: 97.2,
          ppsRange: [12000, 17500],
          bpsRange: [8500000, 14000000],
          desc: 'APT Coordinated Multi-Host Campaign: Recon flood, internal C2, and DNS exfiltration',
        },
        NORMAL: {
          targetHost: '10.0.0.10',
          threatType: 'NORMAL',
          severity: 'INFO',
          riskTarget: 12.0,
          ppsRange: [800, 1200],
          bpsRange: [2200000, 3400000],
          desc: 'TRex / iperf3 enterprise baseline traffic without anomalies',
        },
      };

      const params = scenarioParams[scenario] || scenarioParams.NORMAL;

      // Add immediate alert
      const newAlert: Alert = {
        id: `alt-${scenario.toLowerCase()}-${Date.now()}`,
        hostId: params.targetHost,
        srcIp: params.targetHost,
        dstIp: params.targetHost === '10.0.0.10' ? '10.0.0.1' : '10.0.0.10',
        dstDomain: scenario === 'DNS_TUNNEL' ? 'stage1.tunnel.internal-corp-sync.net' : null,
        protocol: scenario === 'UDP_FLOOD' ? 'UDP' : scenario === 'DNS_TUNNEL' ? 'DNS' : 'TCP',
        threatType: params.threatType as Alert['threatType'],
        severity: params.severity,
        confidence: 0.96,
        riskScore: params.riskTarget,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        detectionEngine:
          scenario === 'SYN_FLOOD' || scenario === 'UDP_FLOOD'
            ? 'PACKET'
            : scenario === 'SLOWLORIS'
            ? 'CONNECTION'
            : scenario === 'MULTI_HOST_CAMPAIGN'
            ? 'CORRELATION'
            : 'SESSION',
        evidence: [
          { label: 'Feature Anomaly', value: `${scenario} detected`, isSuspicious: true, weight: 0.5 },
          { label: 'Peak Deviation', value: '+14.2σ vs Baseline', isSuspicious: true, weight: 0.35 },
          { label: 'Confidence Score', value: '96% verified', isSuspicious: true, weight: 0.15 },
        ],
        featureVector: null,
        campaignId: scenario === 'MULTI_HOST_CAMPAIGN' ? 'camp-apt-01' : null,
        modelVersion: 'Ensemble_v2.1',
        featureVersion: 'fv3_fft',
        thresholdVersion: 'th_enclave_2026',
        isActive: true,
      };

      setLocalAlerts((prev) => [newAlert, ...prev]);

      const threatDisplay: ThreatEventDisplay = {
        id: `evt-sim-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: params.desc,
        severity: params.severity,
        srcIp: params.targetHost,
        dstIp: params.targetHost === '10.0.0.10' ? '10.0.0.1' : '10.0.0.10',
        threatType: params.threatType as ThreatEventDisplay['threatType'],
      };
      setLocalThreatStream((prev) => [threatDisplay, ...prev].slice(0, 200));

      // Continuous simulation tick loop
      simulationTimerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.round((now - startTime) / 1000);

        if (now >= simulationEndRef.current) {
          stopSimulation();
          return;
        }

        const ppsDelta =
          Math.floor(Math.random() * (params.ppsRange[1] - params.ppsRange[0])) +
          params.ppsRange[0];
        const bpsDelta =
          Math.floor(Math.random() * (params.bpsRange[1] - params.bpsRange[0])) +
          params.bpsRange[0];
        packetCountRef.current += ppsDelta;

        // 1. Update Metrics
        setLocalMetrics({
          timestamp: new Date().toISOString(),
          packetsPerSec: ppsDelta,
          bytesPerSec: bpsDelta,
          activeHosts: 5,
          activeSessions: scenario === 'SLOWLORIS' ? 72 : 44,
          alertsTotal: localAlerts.length + 1,
          criticalHosts: scenario === 'NORMAL' ? 0 : 1,
          activeCampaigns: scenario === 'MULTI_HOST_CAMPAIGN' ? 1 : 0,
          detectionLatencyMs: 1.85,
        });

        // 2. Update Simulation Status
        setLocalSimulation({
          isRunning: true,
          scenario,
          elapsedSeconds: elapsed,
          durationSeconds,
          stage: `ATTACKING_${scenario}`,
          packetsGenerated: packetCountRef.current,
          flowsGenerated: Math.floor(packetCountRef.current / 45),
        });

        // 3. Elevate Host Risk Scores
        setLocalHosts((prev) =>
          prev.map((h) => {
            if (
              h.ip === params.targetHost ||
              (scenario === 'MULTI_HOST_CAMPAIGN' &&
                ['10.0.0.50', '10.0.0.21', '10.0.0.31'].includes(h.ip))
            ) {
              return {
                ...h,
                riskScore: Math.min(99.0, params.riskTarget + (Math.random() * 2 - 1)),
                riskLevel: params.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
                riskTrend: 15.0,
                riskTrendDirection: 'RISING',
                packetRate: ppsDelta,
                bytesRate: bpsDelta,
                lastSeen: new Date().toISOString(),
                activeThreats: [params.threatType],
              };
            }
            return h;
          })
        );
      }, 1000);

      // Attempt FastAPI backend trigger
      try {
        await fetch('http://localhost:8000/api/v1/simulation/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario, duration_seconds: durationSeconds }),
        });
      } catch {
        // Handled gracefully in-memory
      }
    },
    [localAlerts.length, stopSimulation]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, []);

  // Merge WebSocket state with local overlay (local overrides if active simulation)
  const isSimulating = Boolean(localSimulation?.isRunning);

  const mergedMetrics = isSimulating && localMetrics ? localMetrics : wsState.metrics;
  const mergedSimulation = localSimulation || wsState.simulation;
  const mergedHosts = isSimulating ? localHosts : wsState.hosts.length > 0 ? wsState.hosts : localHosts;
  const mergedAlerts = [
    ...localAlerts,
    ...wsState.alerts.filter((a) => !localAlerts.some((la) => la.id === a.id)),
  ];
  const mergedThreatStream = [
    ...localThreatStream,
    ...wsState.threatStream.filter((t) => !localThreatStream.some((lt) => lt.id === t.id)),
  ];

  const value: MirageContextValue = {
    ...wsState,
    metrics: mergedMetrics,
    simulation: mergedSimulation,
    hosts: mergedHosts,
    alerts: mergedAlerts,
    threatStream: mergedThreatStream,
    wsState,
    on,
    startSimulation,
    stopSimulation,
    isSimulating,
    activeScenario,
  };

  return <MirageContext.Provider value={value}>{children}</MirageContext.Provider>;
}

export function useMirage(): MirageContextValue {
  const ctx = useContext(MirageContext);
  if (!ctx) {
    throw new Error('useMirage must be used within a MirageProvider');
  }
  return ctx;
}

