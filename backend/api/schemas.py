"""
MIRAGE Pydantic Schemas
All API request/response types with strict validation.
"""
from __future__ import annotations

import re
from datetime import datetime
from enum import Enum
from typing import Annotated, Any

from pydantic import BaseModel, Field, field_validator, model_validator


# ─────────────────────────────────────────────────────────────────────────────
# Enumerations
# ─────────────────────────────────────────────────────────────────────────────

class Severity(str, Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ThreatType(str, Enum):
    NORMAL = "NORMAL"
    SYN_FLOOD = "SYN_FLOOD"
    UDP_FLOOD = "UDP_FLOOD"
    SLOWLORIS = "SLOWLORIS"
    DNS_TUNNEL = "DNS_TUNNEL"
    DGA = "DGA"
    C2_BEACON = "C2_BEACON"
    PORT_SCAN = "PORT_SCAN"
    MULTI_HOST_CAMPAIGN = "MULTI_HOST_CAMPAIGN"
    UNKNOWN_ANOMALY = "UNKNOWN_ANOMALY"


class SimulationScenario(str, Enum):
    """Strictly allowlisted scenario identifiers. No arbitrary commands accepted."""
    NORMAL = "NORMAL"
    SYN_FLOOD = "SYN_FLOOD"
    UDP_FLOOD = "UDP_FLOOD"
    SLOWLORIS = "SLOWLORIS"
    DNS_TUNNEL = "DNS_TUNNEL"
    DGA = "DGA"
    C2_BEACON = "C2_BEACON"
    MULTI_HOST_CAMPAIGN = "MULTI_HOST_CAMPAIGN"


class DetectionEngine(str, Enum):
    PACKET = "PACKET"
    CONNECTION = "CONNECTION"
    SESSION = "SESSION"
    BASELINE = "BASELINE"
    ML = "ML"
    CORRELATION = "CORRELATION"
    HYBRID = "HYBRID"


class RiskLevel(str, Enum):
    NORMAL = "NORMAL"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Protocol(str, Enum):
    TCP = "TCP"
    UDP = "UDP"
    ICMP = "ICMP"
    DNS = "DNS"
    HTTP = "HTTP"
    HTTPS = "HTTPS"
    OTHER = "OTHER"


class SensorStatus(str, Enum):
    ONLINE = "ONLINE"
    DEGRADED = "DEGRADED"
    OFFLINE = "OFFLINE"


# ─────────────────────────────────────────────────────────────────────────────
# Core Models
# ─────────────────────────────────────────────────────────────────────────────

class HostSchema(BaseModel):
    id: str
    ip: str
    hostname: str | None = None
    first_seen: datetime
    last_seen: datetime
    risk_score: Annotated[float, Field(ge=0.0, le=100.0)]
    risk_level: RiskLevel
    risk_trend: float  # positive = increasing, negative = decreasing
    active_threats: list[str] = []
    packet_rate: float = 0.0
    bytes_rate: float = 0.0
    connection_count: int = 0
    is_baseline_ready: bool = False
    baseline_confidence: Annotated[float, Field(ge=0.0, le=1.0)] = 0.0


class FlowSchema(BaseModel):
    id: str
    src_ip: str
    dst_ip: str
    src_port: int | None = None
    dst_port: int | None = None
    protocol: Protocol
    start_time: datetime
    end_time: datetime | None = None
    packets: int = 0
    bytes: int = 0
    flags: str | None = None


class FeatureVectorSchema(BaseModel):
    host_id: str
    timestamp: datetime
    engine: DetectionEngine
    # Packet-level
    packets_per_sec: float | None = None
    bytes_per_sec: float | None = None
    syn_rate: float | None = None
    ack_rate: float | None = None
    syn_ack_ratio: float | None = None
    udp_rate: float | None = None
    packet_size_mean: float | None = None
    packet_size_variance: float | None = None
    packet_size_entropy: float | None = None
    ttl_mean: float | None = None
    src_concentration: float | None = None
    dst_concentration: float | None = None
    # Connection-level
    concurrent_connections: int | None = None
    incomplete_connections: int | None = None
    half_open_connections: int | None = None
    connection_rate: float | None = None
    # Session-level
    inter_arrival_mean: float | None = None
    inter_arrival_stddev: float | None = None
    inter_arrival_cv: float | None = None
    autocorrelation: float | None = None
    periodicity_score: float | None = None
    session_byte_count: int | None = None
    dns_query_entropy: float | None = None
    unique_subdomain_ratio: float | None = None
    # Baseline
    baseline_deviation_sigma: float | None = None


class EvidenceCardSchema(BaseModel):
    label: str
    value: str
    is_suspicious: bool
    weight: float = 1.0  # contribution to overall suspicion


class AlertSchema(BaseModel):
    id: str
    host_id: str
    src_ip: str
    dst_ip: str | None = None
    dst_domain: str | None = None
    protocol: Protocol
    threat_type: ThreatType
    severity: Severity
    confidence: Annotated[float, Field(ge=0.0, le=1.0)]
    risk_score: Annotated[float, Field(ge=0.0, le=100.0)]
    first_seen: datetime
    last_seen: datetime
    detection_engine: DetectionEngine
    evidence: list[EvidenceCardSchema] = []
    feature_vector: FeatureVectorSchema | None = None
    campaign_id: str | None = None
    model_version: str | None = None
    feature_version: str | None = None
    threshold_version: str | None = None
    is_active: bool = True


class CampaignNodeSchema(BaseModel):
    id: str
    type: str  # host | ip | domain | alert | campaign
    label: str
    risk_score: float = 0.0
    data: dict[str, Any] = {}


class CampaignEdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    relationship: str  # communicates_with | resolved_to | triggered | similar_behavior


class CampaignSchema(BaseModel):
    id: str
    title: str
    description: str
    start_time: datetime
    last_updated: datetime
    host_count: int
    event_count: int
    duration_seconds: float
    threat_types: list[ThreatType] = []
    severity: Severity
    nodes: list[CampaignNodeSchema] = []
    edges: list[CampaignEdgeSchema] = []
    shared_destinations: list[str] = []
    is_active: bool = True


class BaselineSnapshot(BaseModel):
    host_id: str
    metric: str
    ewma_mean: float
    ewma_variance: float
    rolling_mean: float
    rolling_stddev: float
    sample_count: int
    confidence: float
    last_updated: datetime


class RiskHistoryPoint(BaseModel):
    timestamp: datetime
    risk_score: float
    contributors: dict[str, float]


class SystemHealthSchema(BaseModel):
    sensor_status: SensorStatus
    pipeline_status: str
    detection_status: str
    one_way_enforced: bool
    ingestion_rate: float
    processing_rate: float
    queue_depth: int
    detection_latency_ms: float
    websocket_clients: int
    active_hosts: int
    active_sessions: int
    alerts_last_hour: int
    model_status: dict[str, str]
    uptime_seconds: float
    cpu_percent: float
    memory_mb: float
    timestamp: datetime


# ─────────────────────────────────────────────────────────────────────────────
# API Request/Response
# ─────────────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: Annotated[str, Field(min_length=1, max_length=64)]
    password: Annotated[str, Field(min_length=1, max_length=128)]

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_\-\.]+$", v):
            raise ValueError("Invalid username format")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class SimulationStartRequest(BaseModel):
    scenario: SimulationScenario  # strictly typed enum, no arbitrary input
    duration_seconds: Annotated[int, Field(ge=5, le=300)] = 120

    @model_validator(mode="after")
    def validate_scenario(self) -> "SimulationStartRequest":
        # Extra defensive check even though enum handles it
        allowed = {s.value for s in SimulationScenario}
        if self.scenario.value not in allowed:
            raise ValueError(f"Scenario '{self.scenario}' is not in the allowlist")
        return self


class SimulationStatusResponse(BaseModel):
    is_running: bool
    scenario: SimulationScenario | None = None
    elapsed_seconds: float = 0.0
    duration_seconds: int = 0
    stage: str = ""
    packets_generated: int = 0
    flows_generated: int = 0


class MetricsResponse(BaseModel):
    timestamp: datetime
    packets_per_sec: float
    bytes_per_sec: float
    active_hosts: int
    active_sessions: int
    alerts_total: int
    critical_hosts: int
    active_campaigns: int
    detection_latency_ms: float


# ─────────────────────────────────────────────────────────────────────────────
# WebSocket Events
# ─────────────────────────────────────────────────────────────────────────────

class WSEventType(str, Enum):
    TRAFFIC_UPDATE = "traffic_update"
    FEATURE_UPDATE = "feature_update"
    HOST_UPDATE = "host_update"
    RISK_UPDATE = "risk_update"
    ALERT_CREATED = "alert_created"
    ALERT_UPDATED = "alert_updated"
    CAMPAIGN_CREATED = "campaign_created"
    CAMPAIGN_UPDATED = "campaign_updated"
    SIMULATION_STATUS = "simulation_status"
    SYSTEM_HEALTH = "system_health"
    BASELINE_UPDATE = "baseline_update"


class WSEvent(BaseModel):
    type: WSEventType
    timestamp: datetime
    data: dict[str, Any]

    model_config = {"arbitrary_types_allowed": True}


# ─────────────────────────────────────────────────────────────────────────────
# Forensics
# ─────────────────────────────────────────────────────────────────────────────

class ForensicRecord(BaseModel):
    id: str
    alert_id: str
    timestamp: datetime
    evidence_hash: str  # SHA-256 of evidence bundle
    model_version: str
    feature_version: str
    risk_score: float
    analyst_note: str | None = None
    chain_hash: str | None = None  # hash of previous record + this record
