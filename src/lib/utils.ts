/**
 * MIRAGE lib/utils.ts
 * Core utility functions used across the application.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RiskLevel, Severity, ThreatType } from '@/types';

// ─── Tailwind class merge ─────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Risk ─────────────────────────────────────────────────────────────────────
export function getRiskLevel(score: number): RiskLevel {
  if (score < 20) return 'NORMAL';
  if (score < 40) return 'LOW';
  if (score < 60) return 'MEDIUM';
  if (score < 80) return 'HIGH';
  return 'CRITICAL';
}

export function getRiskColor(level: RiskLevel | number): string {
  const l = typeof level === 'number' ? getRiskLevel(level) : level;
  switch (l) {
    case 'NORMAL':   return '#4ade80';
    case 'LOW':      return '#60a5fa';
    case 'MEDIUM':   return '#fbbf24';
    case 'HIGH':     return '#f97316';
    case 'CRITICAL': return '#ef4444';
  }
}

export function getRiskBadgeClass(level: RiskLevel): string {
  switch (level) {
    case 'NORMAL':   return 'badge-normal';
    case 'LOW':      return 'badge-low';
    case 'MEDIUM':   return 'badge-medium';
    case 'HIGH':     return 'badge-high';
    case 'CRITICAL': return 'badge-critical';
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

// ─── Threat labels ────────────────────────────────────────────────────────────
export function getThreatLabel(type: ThreatType): string {
  const map: Record<ThreatType, string> = {
    NORMAL: 'Normal',
    SYN_FLOOD: 'SYN Flood',
    UDP_FLOOD: 'UDP Flood',
    SLOWLORIS: 'Slowloris',
    DNS_TUNNEL: 'DNS Tunnel',
    DGA: 'DGA',
    C2_BEACON: 'C2 Beacon',
    PORT_SCAN: 'Port Scan',
    MULTI_HOST_CAMPAIGN: 'Campaign',
    UNKNOWN_ANOMALY: 'Anomaly',
  };
  return map[type] ?? type;
}

// ─── Number formatting ────────────────────────────────────────────────────────
export function formatNumber(n: number, decimals = 0): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(decimals);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatLatency(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// ─── Time ─────────────────────────────────────────────────────────────────────
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.abs(now - then);

  if (diff < 5000)   return 'just now';
  if (diff < 60000)  return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  return `${Math.round(diff / 3600000)}h ago`;
}

// ─── IP validation (client-side only) ────────────────────────────────────────
export function isValidIp(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
    ip.split('.').every(p => parseInt(p, 10) <= 255);
}

// ─── Confidence ───────────────────────────────────────────────────────────────
export function formatConfidence(c: number): string {
  return `${Math.round(c * 100)}%`;
}

// ─── Risk trend ───────────────────────────────────────────────────────────────
export function getTrendIcon(trend: number): string {
  if (trend > 2)  return '↑';
  if (trend < -2) return '↓';
  return '—';
}

export function getTrendColor(trend: number): string {
  if (trend > 2)  return '#f97316';
  if (trend < -2) return '#4ade80';
  return '#60a5fa';
}

// ─── Risk ring arc ────────────────────────────────────────────────────────────
export function getRiskArcPath(score: number, r: number): string {
  const angle = (score / 100) * 2 * Math.PI - Math.PI / 2;
  const x = r * Math.cos(angle);
  const y = r * Math.sin(angle);
  const largeArc = score > 50 ? 1 : 0;
  return `M 0 ${-r} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`;
}

// ─── Clamp ────────────────────────────────────────────────────────────────────
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}
