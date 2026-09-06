'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  WSEvent,
  WSEventType,
  ConnectionState,
  Alert,
  Host,
  Campaign,
  MetricsSnapshot,
  SystemHealth,
  SimulationStatus,
  ThreatEventDisplay,
} from '@/types';
import { getSeverityColor } from '@/lib/utils';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws/live';
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;
const MAX_THREAT_EVENTS = 200;

export interface MirageWebSocketState {
  connection: ConnectionState;
  metrics: MetricsSnapshot | null;
  hosts: Host[];
  alerts: Alert[];
  campaigns: Campaign[];
  health: SystemHealth | null;
  simulation: SimulationStatus | null;
  threatStream: ThreatEventDisplay[];
}

type EventHandler<T> = (data: T) => void;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const [state, setState] = useState<MirageWebSocketState>({
    connection: { status: 'connecting', reconnectAttempts: 0, lastConnected: null },
    metrics: null,
    hosts: [],
    alerts: [],
    campaigns: [],
    health: null,
    simulation: null,
    threatStream: [],
  });

  const handlers = useRef<Map<WSEventType, EventHandler<unknown>>>(new Map());

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      setState(prev => ({
        ...prev,
        connection: {
          ...prev.connection,
          status: 'connecting',
          reconnectAttempts: reconnectAttemptsRef.current,
        },
      }));

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        reconnectAttemptsRef.current = 0;
        setState(prev => ({
          ...prev,
          connection: {
            status: 'connected',
            reconnectAttempts: 0,
            lastConnected: new Date().toISOString(),
          },
        }));
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data as string) as WSEvent;
          handleEvent(msg);
        } catch {
          // Silently discard malformed WS messages — never crash the UI
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        wsRef.current = null;
        setState(prev => ({
          ...prev,
          connection: { ...prev.connection, status: 'disconnected' },
        }));
        scheduleReconnect();
      };

      ws.onerror = () => {
        // onerror always followed by onclose, so just update status
        setState(prev => ({
          ...prev,
          connection: { ...prev.connection, status: 'error' },
        }));
      };
    } catch {
      scheduleReconnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) return;

    const delay = Math.min(
      INITIAL_RETRY_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current),
      MAX_RETRY_DELAY_MS,
    );
    reconnectAttemptsRef.current += 1;

    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, delay);
  }, [connect]);

  const handleEvent = useCallback((event: WSEvent) => {
    const type = event.type as WSEventType;
    const raw = event.data as Record<string, any>;
    if (!raw) return;

    switch (type) {
      case 'traffic_update':
      case 'feature_update': {
        const normalized: MetricsSnapshot = {
          timestamp: raw.timestamp || new Date().toISOString(),
          packetsPerSec: Number(raw.packetsPerSec ?? raw.packets_per_sec ?? raw.pps ?? 0),
          bytesPerSec: Number(raw.bytesPerSec ?? raw.bytes_per_sec ?? raw.bps ?? 0),
          activeHosts: Number(raw.activeHosts ?? raw.active_hosts ?? 0),
          activeSessions: Number(raw.activeSessions ?? raw.active_sessions ?? 0),
          alertsTotal: Number(raw.alertsTotal ?? raw.alerts_total ?? 0),
          criticalHosts: Number(raw.criticalHosts ?? raw.critical_hosts ?? 0),
          activeCampaigns: Number(raw.activeCampaigns ?? raw.active_campaigns ?? 0),
          detectionLatencyMs: Number(raw.detectionLatencyMs ?? raw.detection_latency_ms ?? 1.45),
        };
        setState(prev => ({ ...prev, metrics: normalized }));
        break;
      }

      case 'host_update':
      case 'risk_update': {
        const ip = String(raw.ip || raw.id || '10.0.0.1');
        const score = Number(raw.riskScore ?? raw.risk_score ?? 0);
        const level = (raw.riskLevel || raw.risk_level || (score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MEDIUM' : score >= 20 ? 'LOW' : 'NORMAL')) as Host['riskLevel'];

        setState(prev => {
          const existing = prev.hosts.find(h => h.id === ip || h.ip === ip);
          const updatedHost: Host = {
            id: ip,
            ip: ip,
            hostname: raw.hostname ?? existing?.hostname ?? (ip === '10.0.0.50' ? 'unknown-threat-node' : ip === '10.0.0.21' ? 'ws-engineering-04' : ip === '10.0.0.31' ? 'ws-finance-12' : ip === '10.0.0.10' ? 'auth-dc01' : 'border-gateway'),
            firstSeen: existing?.firstSeen ?? new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            riskScore: score,
            riskLevel: level,
            riskTrend: Number(raw.riskTrend ?? raw.risk_trend ?? existing?.riskTrend ?? 0),
            riskTrendDirection: score > (existing?.riskScore ?? 0) ? 'RISING' : 'STABLE',
            activeThreats: raw.activeThreats ?? raw.active_threats ?? existing?.activeThreats ?? [],
            packetRate: Number(raw.packetRate ?? raw.packet_rate ?? existing?.packetRate ?? 0),
            bytesRate: Number(raw.bytesRate ?? raw.bytes_rate ?? existing?.bytesRate ?? 0),
            connectionCount: Number(raw.connectionCount ?? raw.connection_count ?? existing?.connectionCount ?? 0),
            isBaselineReady: true,
            baselineConfidence: 0.95,
            tags: raw.tags ?? existing?.tags ?? [level],
          };

          const exists = prev.hosts.some(h => h.id === ip || h.ip === ip);
          return {
            ...prev,
            hosts: exists
              ? prev.hosts.map(h => (h.id === ip || h.ip === ip ? updatedHost : h))
              : [...prev.hosts, updatedHost],
          };
        });
        break;
      }

      case 'alert_created': {
        const alert: Alert = {
          id: String(raw.id || `alt-${Date.now()}`),
          hostId: String(raw.hostId || raw.host_id || raw.srcIp || raw.src_ip || '10.0.0.50'),
          srcIp: String(raw.srcIp || raw.src_ip || '10.0.0.50'),
          dstIp: raw.dstIp ?? raw.dst_ip ?? null,
          dstDomain: raw.dstDomain ?? raw.dst_domain ?? null,
          protocol: raw.protocol || 'TCP',
          threatType: (raw.threatType || raw.threat_type || 'UNKNOWN_ANOMALY'),
          severity: (raw.severity || 'HIGH'),
          confidence: Number(raw.confidence ?? 0.95),
          riskScore: Number(raw.riskScore ?? raw.risk_score ?? 85.0),
          firstSeen: raw.firstSeen || raw.first_seen || raw.timestamp || new Date().toISOString(),
          lastSeen: raw.lastSeen || raw.last_seen || raw.timestamp || new Date().toISOString(),
          detectionEngine: raw.detectionEngine || raw.detection_engine || 'PACKET',
          evidence: raw.evidence || [],
          featureVector: raw.featureVector || raw.feature_vector || null,
          campaignId: raw.campaignId || raw.campaign_id || null,
          modelVersion: raw.modelVersion || raw.model_version || null,
          featureVersion: raw.featureVersion || raw.feature_version || null,
          thresholdVersion: raw.thresholdVersion || raw.threshold_version || null,
          isActive: raw.isActive ?? raw.is_active ?? true,
        };

        setState(prev => ({
          ...prev,
          alerts: [alert, ...prev.alerts.filter(a => a.id !== alert.id)].slice(0, 500),
        }));
        addThreatEvent(alert.severity, alert.threatType, alert.srcIp, alert.dstIp ?? alert.dstDomain ?? '');
        break;
      }

      case 'alert_updated': {
        const id = String(raw.id);
        setState(prev => ({
          ...prev,
          alerts: prev.alerts.map(a => a.id === id ? { ...a, ...raw, isActive: raw.isActive ?? raw.is_active ?? a.isActive } : a),
        }));
        break;
      }

      case 'campaign_created':
      case 'campaign_updated': {
        const campaign: Campaign = {
          id: String(raw.id || `camp-${Date.now()}`),
          title: String(raw.title || 'CAMPAIGN-APT-CORRELATED'),
          description: String(raw.description || 'Multi-host coordinated intrusion detected'),
          startTime: raw.startTime || raw.start_time || new Date().toISOString(),
          lastUpdated: raw.lastUpdated || raw.last_updated || new Date().toISOString(),
          hostCount: Number(raw.hostCount ?? raw.host_count ?? 3),
          eventCount: Number(raw.eventCount ?? raw.event_count ?? 12),
          durationSeconds: Number(raw.durationSeconds ?? raw.duration_seconds ?? 60),
          threatTypes: raw.threatTypes ?? raw.threat_types ?? ['SYN_FLOOD', 'C2_BEACON'],
          severity: raw.severity || 'CRITICAL',
          nodes: raw.nodes || [],
          edges: raw.edges || [],
          sharedDestinations: raw.sharedDestinations ?? raw.shared_destinations ?? [],
          isActive: raw.isActive ?? raw.is_active ?? true,
        };

        setState(prev => ({
          ...prev,
          campaigns: [campaign, ...prev.campaigns.filter(c => c.id !== campaign.id)],
        }));
        if (type === 'campaign_created') {
          addThreatEvent('CRITICAL', 'MULTI_HOST_CAMPAIGN', '', '');
        }
        break;
      }

      case 'simulation_status': {
        const sim: SimulationStatus = {
          isRunning: Boolean(raw.isRunning ?? raw.is_running),
          scenario: raw.scenario || null,
          elapsedSeconds: Number(raw.elapsedSeconds ?? raw.elapsed_seconds ?? 0),
          durationSeconds: Number(raw.durationSeconds ?? raw.duration_seconds ?? 60),
          stage: String(raw.stage || 'IDLE'),
          packetsGenerated: Number(raw.packetsGenerated ?? raw.packets_generated ?? 0),
          flowsGenerated: Number(raw.flowsGenerated ?? raw.flows_generated ?? 0),
        };
        setState(prev => ({ ...prev, simulation: sim }));
        break;
      }

      case 'system_health': {
        setState(prev => ({ ...prev, health: raw as SystemHealth }));
        break;
      }

      default:
        // Unknown event — call registered handler if any
        handlers.current.get(type)?.(event.data);
    }

    function addThreatEvent(
      severity: string,
      threatType: string,
      srcIp: string,
      dstIp: string,
    ) {
      const threatMessages: Record<string, string> = {
        NORMAL: 'Normal traffic observed',
        SYN_FLOOD: 'SYN flood attack detected',
        UDP_FLOOD: 'UDP flood attack detected',
        SLOWLORIS: 'Slowloris connection exhaustion detected',
        DNS_TUNNEL: 'DNS tunneling behavior detected',
        DGA: 'Domain generation algorithm (DGA) detected',
        C2_BEACON: 'C2 beaconing pattern detected',
        PORT_SCAN: 'Port scan detected',
        MULTI_HOST_CAMPAIGN: 'ATTACK CAMPAIGN CORRELATED — Multiple hosts compromised',
        UNKNOWN_ANOMALY: 'Unknown anomaly detected',
      };

      const display: ThreatEventDisplay = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: event.timestamp,
        message: threatMessages[threatType] ?? `${threatType} detected`,
        severity: severity as ThreatEventDisplay['severity'],
        srcIp: srcIp || undefined,
        dstIp: dstIp || undefined,
        threatType: threatType as ThreatEventDisplay['threatType'],
      };

      setState(prev => ({
        ...prev,
        threatStream: [display, ...prev.threatStream].slice(0, MAX_THREAT_EVENTS),
      }));
    }
  }, []);

  // Register a custom event handler
  const on = useCallback(<T>(type: WSEventType, handler: EventHandler<T>) => {
    handlers.current.set(type, handler as EventHandler<unknown>);
    return () => handlers.current.delete(type);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on intentional close
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { state, on };
}
