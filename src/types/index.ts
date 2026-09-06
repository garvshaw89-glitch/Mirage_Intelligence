/**
 * MIRAGE TypeScript Type Definitions
 * Strict types for all domain objects, API contracts, and WebSocket events.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enumerations
// ─────────────────────────────────────────────────────────────────────────────

export type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ThreatType =
  | 'NORMAL'
  | 'SYN_FLOOD'
  | 'UDP_FLOOD'
  | 'SLOWLORIS'
  | 'DNS_TUNNEL'
  | 'DGA'
  | 'C2_BEACON'
  | 'PORT_SCAN'
  | 'MULTI_HOST_CAMPAIGN'
  | 'UNKNOWN_ANOMALY';

/** Strictly allowlisted — no arbitrary commands ever accepted */
export type SimulationScenario =
  | 'NORMAL'
  | 'SYN_FLOOD'
  | 'UDP_FLOOD'
  | 'SLOWLORIS'
  | 'DNS_TUNNEL'
  | 'DGA'
  | 'C2_BEACON'
  | 'MULTI_HOST_CAMPAIGN';

export type DetectionEngine =
  | 'PACKET'
  | 'CONNECTION'
  | 'SESSION'
  | 'BASELINE'
  | 'ML'
  | 'CORRELATION'
  | 'HYBRID';

export type RiskLevel = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Protocol = 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'HTTP' | 'HTTPS' | 'OTHER';

export type SensorStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE';

export type RiskTrend = 'RISING' | 'STABLE' | 'FALLING';

// ─────────────────────────────────────────────────────────────────────────────
// Core Domain Objects
// ─────────────────────────────────────────────────────────────────────────────

export interface Host {
  id: string;
  ip: string;
  hostname: string | null;
  firstSeen: string; // ISO datetime
  lastSeen: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  riskTrend: number; // positive = rising, negative = falling
  riskTrendDirection: RiskTrend;
  activeThreats: string[];
  packetRate: number;
  bytesRate: number;
  connectionCount: number;
  isBaselineReady: boolean;
  baselineConfidence: number; // 0-1
  tags: string[];
}

export interface Flow {
  id: string;
  srcIp: string;
  dstIp: string;
  srcPort: number | null;
  dstPort: number | null;
  protocol: Protocol;
  startTime: string;
  endTime: string | null;
  packets: number;
  bytes: number;
  flags: string | null;
  hostId: string;
}

export interface FeatureVector {
  hostId: string;
  timestamp: string;
  engine: DetectionEngine;
  // Packet-level
  packetsPerSec?: number;
  bytesPerSec?: number;
  synRate?: number;
  ackRate?: number;
  synAckRatio?: number;
  udpRate?: number;
  packetSizeMean?: number;
  packetSizeVariance?: number;
  packetSizeEntropy?: number;
  ttlMean?: number;
  srcConcentration?: number;
  dstConcentration?: number;
  // Connection-level
  concurrentConnections?: number;
  incompleteConnections?: number;
  halfOpenConnections?: number;
  connectionRate?: number;
  // Session-level
  interArrivalMean?: number;
  interArrivalStddev?: number;
  interArrivalCv?: number;
  autocorrelation?: number;
  periodicityScore?: number;
  sessionByteCount?: number;
  dnsQueryEntropy?: number;
  uniqueSubdomainRatio?: number;
  // Baseline
  baselineDeviationSigma?: number;
}

export interface EvidenceCard {
  label: string;
  value: string;
  isSuspicious: boolean;
  weight: number; // contribution to suspicion
}

export interface Alert {
  id: string;
  hostId: string;
  srcIp: string;
  dstIp: string | null;
  dstDomain: string | null;
  protocol: Protocol;
  threatType: ThreatType;
  severity: Severity;
  confidence: number; // 0-1
  riskScore: number;  // 0-100
  firstSeen: string;
  lastSeen: string;
  detectionEngine: DetectionEngine;
  evidence: EvidenceCard[];
  featureVector: FeatureVector | null;
  campaignId: string | null;
  modelVersion: string | null;
  featureVersion: string | null;
  thresholdVersion: string | null;
  isActive: boolean;
}

export interface CampaignNode {
  id: string;
  type: 'host' | 'ip' | 'domain' | 'alert' | 'campaign';
  label: string;
  riskScore: number;
  data: Record<string, unknown>;
}

export interface CampaignEdge {
  id: string;
  source: string;
  target: string;
  relationship:
    | 'communicates_with'
    | 'resolved_to'
    | 'triggered'
    | 'similar_behavior'
    | 'shared_destination'
    | 'temporal_correlation';
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  startTime: string;
  lastUpdated: string;
  hostCount: number;
  eventCount: number;
  durationSeconds: number;
  threatTypes: ThreatType[];
  severity: Severity;
  nodes: CampaignNode[];
  edges: CampaignEdge[];
  sharedDestinations: string[];
  isActive: boolean;
}

export interface BaselineSnapshot {
  hostId: string;
  metric: string;
  ewmaMean: number;
  ewmaVariance: number;
  rollingMean: number;
  rollingStddev: number;
  sampleCount: number;
  confidence: number; // 0-1
  lastUpdated: string;
}

export interface RiskHistoryPoint {
  timestamp: string;
  riskScore: number;
  contributors: Record<string, number>;
}

export interface SystemHealth {
  sensorStatus: SensorStatus;
  pipelineStatus: string;
  detectionStatus: string;
  oneWayEnforced: boolean;
  ingestionRate: number;
  processingRate: number;
  queueDepth: number;
  detectionLatencyMs: number;
  websocketClients: number;
  activeHosts: number;
  activeSessions: number;
  alertsLastHour: number;
  modelStatus: Record<string, string>;
  uptimeSeconds: number;
  cpuPercent: number;
  memoryMb: number;
  timestamp: string;
}

export interface SimulationStatus {
  isRunning: boolean;
  scenario: SimulationScenario | null;
  elapsedSeconds: number;
  durationSeconds: number;
  stage: string;
  packetsGenerated: number;
  flowsGenerated: number;
}

export interface MetricsSnapshot {
  timestamp: string;
  packetsPerSec: number;
  bytesPerSec: number;
  activeHosts: number;
  activeSessions: number;
  alertsTotal: number;
  criticalHosts: number;
  activeCampaigns: number;
  detectionLatencyMs: number;
}

export interface ForensicRecord {
  id: string;
  alertId: string;
  timestamp: string;
  evidenceHash: string;
  modelVersion: string;
  featureVersion: string;
  riskScore: number;
  analystNote: string | null;
  chainHash: string | null;
}

export type HostRisk = Host;

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket Events
// ─────────────────────────────────────────────────────────────────────────────

export type WSEventType =
  | 'traffic_update'
  | 'feature_update'
  | 'host_update'
  | 'risk_update'
  | 'alert_created'
  | 'alert_updated'
  | 'campaign_created'
  | 'campaign_updated'
  | 'simulation_status'
  | 'system_health'
  | 'baseline_update';

export interface WSEvent<T = unknown> {
  type: WSEventType;
  timestamp: string;
  data: T;
}

export interface TrafficUpdateData {
  packetsPerSec: number;
  bytesPerSec: number;
  activeHosts: number;
  activeSessions: number;
  protocols: Record<string, number>;
}

export interface ThreatEventDisplay {
  id: string;
  timestamp: string;
  message: string;
  severity: Severity;
  srcIp?: string;
  dstIp?: string;
  threatType?: ThreatType;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Request Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface SimulationStartRequest {
  /** Must be one of the strictly allowlisted scenarios */
  scenario: SimulationScenario;
  durationSeconds: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI State
// ─────────────────────────────────────────────────────────────────────────────

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnectAttempts: number;
  lastConnected: string | null;
}

export interface DashboardState {
  metrics: MetricsSnapshot | null;
  hosts: Host[];
  alerts: Alert[];
  campaigns: Campaign[];
  health: SystemHealth | null;
  simulation: SimulationStatus | null;
  threatStream: ThreatEventDisplay[];
  connection: ConnectionState;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario Metadata for UI
// ─────────────────────────────────────────────────────────────────────────────

export interface ScenarioDefinition {
  id: SimulationScenario;
  label: string;
  description: string;
  targetEngine: DetectionEngine[];
  expectedRiskPeak: number;
  durationHint: string;
  severity: Severity;
}

export const SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  {
    id: 'NORMAL',
    label: 'Normal Traffic',
    description: 'Simulates baseline legitimate network activity across all hosts.',
    targetEngine: ['BASELINE'],
    expectedRiskPeak: 15,
    durationHint: '60s',
    severity: 'INFO',
  },
  {
    id: 'SYN_FLOOD',
    label: 'SYN Flood',
    description: 'TCP SYN flood attack — high packet rate with incomplete handshakes.',
    targetEngine: ['PACKET'],
    expectedRiskPeak: 92,
    durationHint: '30s',
    severity: 'CRITICAL',
  },
  {
    id: 'UDP_FLOOD',
    label: 'UDP Flood',
    description: 'High-volume UDP flood targeting random ports.',
    targetEngine: ['PACKET'],
    expectedRiskPeak: 88,
    durationHint: '30s',
    severity: 'HIGH',
  },
  {
    id: 'SLOWLORIS',
    label: 'Slowloris',
    description: 'Slow HTTP connection exhaustion — keeps connections half-open.',
    targetEngine: ['CONNECTION'],
    expectedRiskPeak: 75,
    durationHint: '60s',
    severity: 'HIGH',
  },
  {
    id: 'DNS_TUNNEL',
    label: 'DNS Tunneling',
    description: 'Covert channel via encoded DNS queries to a rogue resolver.',
    targetEngine: ['SESSION'],
    expectedRiskPeak: 78,
    durationHint: '90s',
    severity: 'HIGH',
  },
  {
    id: 'DGA',
    label: 'DGA (Domain Generation)',
    description: 'Algorithmically generated domain lookups — malware C2 evasion.',
    targetEngine: ['SESSION'],
    expectedRiskPeak: 72,
    durationHint: '90s',
    severity: 'HIGH',
  },
  {
    id: 'C2_BEACON',
    label: 'C2 Beaconing',
    description: 'Periodic jittered callbacks to a C2 server. Stealthy by design.',
    targetEngine: ['SESSION', 'BASELINE'],
    expectedRiskPeak: 91,
    durationHint: '120s',
    severity: 'CRITICAL',
  },
  {
    id: 'MULTI_HOST_CAMPAIGN',
    label: 'Multi-Host Campaign',
    description: 'Coordinated attack across 3 hosts — C2 + lateral movement.',
    targetEngine: ['CORRELATION', 'SESSION', 'PACKET'],
    expectedRiskPeak: 97,
    durationHint: '180s',
    severity: 'CRITICAL',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

export function getRiskLevel(score: number): RiskLevel {
  if (score < 20) return 'NORMAL';
  if (score < 40) return 'LOW';
  if (score < 60) return 'MEDIUM';
  if (score < 80) return 'HIGH';
  return 'CRITICAL';
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'NORMAL':   return '#4ade80';
    case 'LOW':      return '#60a5fa';
    case 'MEDIUM':   return '#fbbf24';
    case 'HIGH':     return '#f97316';
    case 'CRITICAL': return '#ef4444';
  }
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'INFO':     return '#60a5fa';
    case 'LOW':      return '#60a5fa';
    case 'MEDIUM':   return '#fbbf24';
    case 'HIGH':     return '#f97316';
    case 'CRITICAL': return '#ef4444';
  }
}
