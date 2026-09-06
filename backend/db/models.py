"""
SQLAlchemy 2.0 ORM Models for MIRAGE
Multi-resolution Intelligent Risk & Adaptive Graph Engine

Supports PostgreSQL in production and SQLite for zero-dependency local runs.
Implements the full 14-entity telemetry & detection architecture:
1. Host
2. SimulationRun
3. Flow
4. Session
5. TrafficFeature
6. ModelRegistry
7. Alert
8. AlertEvidence
9. RiskScore
10. Campaign
11. CampaignMember
12. GraphEdge
13. DNSEvent
14. AuditEvent (Tamper-evident SHA-256 chain)
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    Index,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def gen_uuid_str() -> str:
    return str(uuid.uuid4())


# 1. Host
class Host(Base):
    __tablename__ = "hosts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid_str)
    ip_address: Mapped[str] = mapped_column(String(45), unique=True, index=True, nullable=False)
    hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    host_type: Mapped[str] = mapped_column(String(50), default="unknown")  # user, server, gateway, attacker, dns, c2
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    is_internal: Mapped[bool] = mapped_column(Boolean, default=True)
    baseline_status: Mapped[str] = mapped_column(String(30), default="learning")  # learning, established, degraded
    baseline_samples: Mapped[int] = mapped_column(BigInteger, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    flows_as_source: Mapped[list["Flow"]] = relationship("Flow", foreign_keys="Flow.source_host_id", back_populates="source_host")
    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="source_host")
    risk_scores: Mapped[list["RiskScore"]] = relationship("RiskScore", back_populates="host")


# 2. SimulationRun
class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid_str)
    scenario: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="running")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    traffic_source: Mapped[str | None] = mapped_column(String(100), nullable=True)  # iperf3, Ostinato, TRex, hping3, slowloris, etc.
    attack_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    seed: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


# 3. Flow
class Flow(Base):
    __tablename__ = "flows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    src_ip: Mapped[str] = mapped_column(String(45), index=True, nullable=False)
    src_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dst_ip: Mapped[str] = mapped_column(String(45), index=True, nullable=False)
    dst_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protocol: Mapped[str] = mapped_column(String(20), nullable=False)
    packets: Mapped[int] = mapped_column(BigInteger, default=0)
    bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    duration_ms: Mapped[float] = mapped_column(Float, default=0.0)
    tcp_flags: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ttl_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ttl_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    packet_size_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    packet_size_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    packet_size_mean: Mapped[float | None] = mapped_column(Float, nullable=True)
    packet_size_stddev: Mapped[float | None] = mapped_column(Float, nullable=True)

    source_host_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hosts.id", ondelete="SET NULL"), nullable=True)
    destination_host_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hosts.id", ondelete="SET NULL"), nullable=True)
    simulation_run_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("simulation_runs.id", ondelete="SET NULL"), nullable=True)
    provenance: Mapped[str] = mapped_column(String(50), default="SIMULATION")  # REAL_CAPTURE, PCAP_REPLAY, SIMULATION, TEST_FIXTURE
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    source_host: Mapped[Host | None] = relationship("Host", foreign_keys=[source_host_id], back_populates="flows_as_source")
    features: Mapped[list["TrafficFeature"]] = relationship("TrafficFeature", back_populates="flow", cascade="all, delete-orphan")


# 4. Session
class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid_str)
    src_ip: Mapped[str] = mapped_column(String(45), index=True, nullable=False)
    dst_ip: Mapped[str] = mapped_column(String(45), index=True, nullable=False)
    src_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dst_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protocol: Mapped[str | None] = mapped_column(String(20), nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[float] = mapped_column(Float, default=0.0)
    packet_count: Mapped[int] = mapped_column(BigInteger, default=0)
    byte_count: Mapped[int] = mapped_column(BigInteger, default=0)
    request_count: Mapped[int] = mapped_column(Integer, default=0)
    incomplete_count: Mapped[int] = mapped_column(Integer, default=0)
    inter_arrival_mean: Mapped[float | None] = mapped_column(Float, nullable=True)
    inter_arrival_stddev: Mapped[float | None] = mapped_column(Float, nullable=True)
    coefficient_of_variation: Mapped[float | None] = mapped_column(Float, nullable=True)
    periodicity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    source_host_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hosts.id", ondelete="SET NULL"), nullable=True)
    destination_host_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hosts.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


# 5. TrafficFeature
class TrafficFeature(Base):
    __tablename__ = "traffic_features"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    flow_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("flows.id", ondelete="CASCADE"), nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    window_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    window_resolution_seconds: Mapped[int] = mapped_column(Integer, default=1)

    packets_per_second: Mapped[float] = mapped_column(Float, default=0.0)
    bytes_per_second: Mapped[float] = mapped_column(Float, default=0.0)
    syn_rate: Mapped[float] = mapped_column(Float, default=0.0)
    ack_rate: Mapped[float] = mapped_column(Float, default=0.0)
    syn_ack_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    udp_rate: Mapped[float] = mapped_column(Float, default=0.0)
    connection_rate: Mapped[float] = mapped_column(Float, default=0.0)
    concurrent_connections: Mapped[int] = mapped_column(Integer, default=0)
    incomplete_connection_rate: Mapped[float] = mapped_column(Float, default=0.0)
    packet_size_entropy: Mapped[float] = mapped_column(Float, default=0.0)
    ttl_entropy: Mapped[float] = mapped_column(Float, default=0.0)
    protocol_entropy: Mapped[float] = mapped_column(Float, default=0.0)
    dns_query_length_mean: Mapped[float] = mapped_column(Float, default=0.0)
    dns_entropy: Mapped[float] = mapped_column(Float, default=0.0)
    unique_domain_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    destination_frequency: Mapped[float] = mapped_column(Float, default=0.0)
    destination_rarity: Mapped[float] = mapped_column(Float, default=0.0)
    inter_arrival_mean: Mapped[float] = mapped_column(Float, default=0.0)
    inter_arrival_stddev: Mapped[float] = mapped_column(Float, default=0.0)
    inter_arrival_cv: Mapped[float] = mapped_column(Float, default=0.0)
    autocorrelation_score: Mapped[float] = mapped_column(Float, default=0.0)
    fft_periodicity_score: Mapped[float] = mapped_column(Float, default=0.0)
    session_byte_mean: Mapped[float] = mapped_column(Float, default=0.0)
    session_byte_stddev: Mapped[float] = mapped_column(Float, default=0.0)
    baseline_deviation: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    flow: Mapped[Flow | None] = relationship("Flow", back_populates="features")


# 6. ModelRegistry
class ModelRegistry(Base):
    __tablename__ = "models"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid_str)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    model_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # isolation_forest, random_forest, ewma_stat
    training_dataset: Mapped[str | None] = mapped_column(String(255), nullable=True)
    feature_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    precision: Mapped[float | None] = mapped_column(Float, nullable=True)
    recall: Mapped[float | None] = mapped_column(Float, nullable=True)
    f1_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


# 7. Alert
class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid_str)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    alert_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    source_ip: Mapped[str | None] = mapped_column(String(45), index=True, nullable=True)
    destination_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    source_host_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hosts.id", ondelete="SET NULL"), nullable=True)
    detection_engine: Mapped[str | None] = mapped_column(String(50), nullable=True)  # packet, connection, session, ml, correlation
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    feature_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active")
    first_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    source_host: Mapped[Host | None] = relationship("Host", back_populates="alerts")
    evidence: Mapped[list["AlertEvidence"]] = relationship("AlertEvidence", back_populates="alert", cascade="all, delete-orphan")


# 8. AlertEvidence
class AlertEvidence(Base):
    __tablename__ = "alert_evidence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[str] = mapped_column(String(36), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False)
    feature_name: Mapped[str] = mapped_column(String(100), nullable=False)
    observed_value: Mapped[float] = mapped_column(Float, nullable=False)
    baseline_value: Mapped[float] = mapped_column(Float, nullable=False)
    deviation: Mapped[float] = mapped_column(Float, nullable=False)
    contribution: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    alert: Mapped[Alert] = relationship("Alert", back_populates="evidence")


# 9. RiskScore
class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    host_id: Mapped[str] = mapped_column(String(36), ForeignKey("hosts.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    packet_component: Mapped[float] = mapped_column(Float, default=0.0)
    connection_component: Mapped[float] = mapped_column(Float, default=0.0)
    session_component: Mapped[float] = mapped_column(Float, default=0.0)
    ml_component: Mapped[float] = mapped_column(Float, default=0.0)
    baseline_component: Mapped[float] = mapped_column(Float, default=0.0)
    correlation_component: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    host: Mapped[Host] = relationship("Host", back_populates="risk_scores")


# 10. Campaign
class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid_str)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    campaign_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active", index=True)
    first_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    suspicious_hosts: Mapped[int] = mapped_column(Integer, default=0)
    correlated_alerts: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    members: Mapped[list["CampaignMember"]] = relationship("CampaignMember", back_populates="campaign", cascade="all, delete-orphan")
    edges: Mapped[list["GraphEdge"]] = relationship("GraphEdge", back_populates="campaign", cascade="all, delete-orphan")


# 11. CampaignMember
class CampaignMember(Base):
    __tablename__ = "campaign_members"

    campaign_id: Mapped[str] = mapped_column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), primary_key=True)
    host_id: Mapped[str] = mapped_column(String(36), ForeignKey("hosts.id", ondelete="CASCADE"), primary_key=True)
    role: Mapped[str | None] = mapped_column(String(50), nullable=True)  # infected_host, c2, destination, dns, source
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    first_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    campaign: Mapped[Campaign] = relationship("Campaign", back_populates="members")


# 12. GraphEdge
class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campaign_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=True)
    source_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    relationship_type: Mapped[str | None] = mapped_column("relationship", String(100), nullable=True)  # COMMUNICATES_WITH, etc.
    destination_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    destination_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    first_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    campaign: Mapped[Campaign | None] = relationship("Campaign", back_populates="edges")


# 13. DNSEvent
class DNSEvent(Base):
    __tablename__ = "dns_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    source_ip: Mapped[str | None] = mapped_column(String(45), index=True, nullable=True)
    resolver_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    query_domain: Mapped[str] = mapped_column(Text, nullable=False)
    query_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    query_length: Mapped[int | None] = mapped_column(Integer, nullable=True)
    label_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    entropy: Mapped[float | None] = mapped_column(Float, nullable=True)
    unique_subdomain_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    suspicious_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_dga: Mapped[bool] = mapped_column(Boolean, default=False)
    is_tunnel: Mapped[bool] = mapped_column(Boolean, default=False)
    host_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hosts.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


# 14. AuditEvent (Tamper-evident blockchain-style hash chain)
class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    actor: Mapped[str] = mapped_column(String(255), default="SYSTEM")
    resource_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    action: Mapped[str | None] = mapped_column(String(100), nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON serialized string
    previous_hash: Mapped[str] = mapped_column(Text, nullable=False)
    event_hash: Mapped[str] = mapped_column(Text, index=True, nullable=False)
