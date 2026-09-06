/**
 * MIRAGE API Client
 * Typed, authenticated API layer. Never exposes backend internals to browser.
 */
import type {
  Host,
  Alert,
  Campaign,
  MetricsSnapshot,
  SystemHealth,
  SimulationStatus,
  SimulationStartRequest,
  SimulationScenario,
  ForensicRecord,
  RiskHistoryPoint,
  BaselineSnapshot,
  LoginRequest,
  TokenResponse,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ─── Token storage ────────────────────────────────────────────────────────────
// Stored in memory — not localStorage — to avoid XSS token theft
let authToken: string | null = null;

export function setToken(token: string): void {
  authToken = token;
}

export function clearToken(): void {
  authToken = null;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    // Prevent CSRF by ensuring same-origin for mutation requests
    credentials: 'omit',
  });

  if (!response.ok) {
    // Never expose server internals — just the status
    throw new ApiError(response.status, `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function login(req: LoginRequest): Promise<TokenResponse> {
  const data = await apiFetch<{ access_token: string; token_type: string; expires_in: number }>(
    '/api/auth/token',
    {
      method: 'POST',
      body: JSON.stringify(req),
    },
  );
  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
  };
}

// ─── System ───────────────────────────────────────────────────────────────────
export async function getStatus(): Promise<{ status: string; version: string }> {
  return apiFetch('/api/status');
}

export async function getSystemHealth(): Promise<SystemHealth> {
  return apiFetch('/api/system/health');
}

export async function getMetrics(): Promise<MetricsSnapshot> {
  return apiFetch('/api/metrics');
}

// ─── Hosts ────────────────────────────────────────────────────────────────────
export async function getHosts(): Promise<Host[]> {
  return apiFetch('/api/hosts');
}

export async function getHost(id: string): Promise<Host> {
  // Validate ID format before sending
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(id)) throw new Error('Invalid host ID');
  return apiFetch(`/api/hosts/${encodeURIComponent(id)}`);
}

export async function getHostRiskHistory(id: string): Promise<RiskHistoryPoint[]> {
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(id)) throw new Error('Invalid host ID');
  return apiFetch(`/api/risk/${encodeURIComponent(id)}`);
}

export async function getHostBaseline(id: string): Promise<BaselineSnapshot[]> {
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(id)) throw new Error('Invalid host ID');
  return apiFetch(`/api/hosts/${encodeURIComponent(id)}/baseline`);
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export async function getAlerts(limit = 100): Promise<Alert[]> {
  const l = Math.min(Math.max(1, limit), 1000);
  return apiFetch(`/api/alerts?limit=${l}`);
}

export async function getAlert(id: string): Promise<Alert> {
  if (!/^[a-zA-Z0-9_\-]+$/.test(id)) throw new Error('Invalid alert ID');
  return apiFetch(`/api/alerts/${encodeURIComponent(id)}`);
}

// ─── Campaigns ────────────────────────────────────────────────────────────────
export async function getCampaigns(): Promise<Campaign[]> {
  return apiFetch('/api/campaigns');
}

export async function getCampaign(id: string): Promise<Campaign> {
  if (!/^[a-zA-Z0-9_\-]+$/.test(id)) throw new Error('Invalid campaign ID');
  return apiFetch(`/api/campaigns/${encodeURIComponent(id)}`);
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
export async function getTimeline(limit = 100): Promise<Alert[]> {
  const l = Math.min(Math.max(1, limit), 1000);
  return apiFetch(`/api/timeline?limit=${l}`);
}

// ─── Simulation ───────────────────────────────────────────────────────────────

const ALLOWED_SCENARIOS: Set<SimulationScenario> = new Set([
  'NORMAL', 'SYN_FLOOD', 'UDP_FLOOD', 'SLOWLORIS',
  'DNS_TUNNEL', 'DGA', 'C2_BEACON', 'MULTI_HOST_CAMPAIGN',
]);

export async function startSimulation(req: SimulationStartRequest): Promise<{ status: string }> {
  // Client-side allowlist check — backend enforces the same
  if (!ALLOWED_SCENARIOS.has(req.scenario)) {
    throw new Error(`Scenario '${req.scenario}' is not allowed`);
  }
  const duration = Math.min(Math.max(5, req.durationSeconds), 300);

  return apiFetch('/api/simulation/start', {
    method: 'POST',
    body: JSON.stringify({ scenario: req.scenario, duration_seconds: duration }),
  });
}

export async function stopSimulation(): Promise<{ status: string }> {
  return apiFetch('/api/simulation/stop', { method: 'POST' });
}

export async function getSimulationStatus(): Promise<SimulationStatus> {
  return apiFetch('/api/simulation/status');
}

// ─── Forensics ────────────────────────────────────────────────────────────────
export async function getForensicRecords(alertId?: string): Promise<ForensicRecord[]> {
  const query = alertId ? `?alert_id=${encodeURIComponent(alertId)}` : '';
  return apiFetch(`/api/forensics${query}`);
}
