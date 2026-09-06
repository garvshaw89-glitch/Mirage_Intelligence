"""
PostgreSQL Production Schema for MIRAGE
Multi-resolution Intelligent Risk & Adaptive Graph Engine
Problem Statement ID: 26145 (NTRO)

Strictly models the actual cybersecurity detection pipeline:
hosts, flows, sessions, traffic_features, alerts, alert_evidence,
risk_scores, campaigns, campaign_members, graph_edges, dns_events,
simulation_runs, models, audit_events.
"""

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. hosts: Every observed IP/endpoint
CREATE TABLE IF NOT EXISTS hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL UNIQUE,
    hostname VARCHAR(255),
    host_type VARCHAR(50) DEFAULT 'unknown',
    -- user, server, gateway, attacker, dns, c2, unknown
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_internal BOOLEAN DEFAULT TRUE,
    baseline_status VARCHAR(30) DEFAULT 'learning',
    -- learning, established, degraded
    baseline_samples BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. simulation_runs: Tracks test fixtures, traffic generation & replays
CREATE TABLE IF NOT EXISTS simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'running',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    traffic_source VARCHAR(100),
    -- iperf3, Ostinato, TRex, hping3, slowloris, dnscat2, dga, c2_emulator
    attack_type VARCHAR(100),
    seed INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. flows: Five-tuple observed traffic aggregation
CREATE TABLE IF NOT EXISTS flows (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    src_ip INET NOT NULL,
    src_port INTEGER,
    dst_ip INET NOT NULL,
    dst_port INTEGER,
    protocol VARCHAR(20) NOT NULL,
    packets BIGINT DEFAULT 0,
    bytes BIGINT DEFAULT 0,
    duration_ms DOUBLE PRECISION DEFAULT 0.0,
    tcp_flags VARCHAR(50),
    ttl_min INTEGER,
    ttl_max INTEGER,
    packet_size_min INTEGER,
    packet_size_max INTEGER,
    packet_size_mean DOUBLE PRECISION,
    packet_size_stddev DOUBLE PRECISION,
    source_host_id UUID REFERENCES hosts(id) ON DELETE SET NULL,
    destination_host_id UUID REFERENCES hosts(id) ON DELETE SET NULL,
    simulation_run_id UUID REFERENCES simulation_runs(id) ON DELETE SET NULL,
    provenance VARCHAR(50) DEFAULT 'SIMULATION',
    -- REAL_CAPTURE, PCAP_REPLAY, SIMULATION, TEST_FIXTURE
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. sessions: Behavioral connection sessions (crucial for C2 & Slowloris)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    src_ip INET NOT NULL,
    dst_ip INET NOT NULL,
    src_port INTEGER,
    dst_port INTEGER,
    protocol VARCHAR(20),
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_ms DOUBLE PRECISION DEFAULT 0.0,
    packet_count BIGINT DEFAULT 0,
    byte_count BIGINT DEFAULT 0,
    request_count INTEGER DEFAULT 0,
    incomplete_count INTEGER DEFAULT 0,
    inter_arrival_mean DOUBLE PRECISION,
    inter_arrival_stddev DOUBLE PRECISION,
    coefficient_of_variation DOUBLE PRECISION,
    periodicity_score DOUBLE PRECISION,
    source_host_id UUID REFERENCES hosts(id) ON DELETE SET NULL,
    destination_host_id UUID REFERENCES hosts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. traffic_features: Multi-resolution feature vectors
CREATE TABLE IF NOT EXISTS traffic_features (
    id BIGSERIAL PRIMARY KEY,
    flow_id BIGINT REFERENCES flows(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    window_resolution_seconds INTEGER DEFAULT 1,
    -- 1s, 5s, 30s, 60s
    packets_per_second DOUBLE PRECISION DEFAULT 0.0,
    bytes_per_second DOUBLE PRECISION DEFAULT 0.0,
    syn_rate DOUBLE PRECISION DEFAULT 0.0,
    ack_rate DOUBLE PRECISION DEFAULT 0.0,
    syn_ack_ratio DOUBLE PRECISION DEFAULT 0.0,
    udp_rate DOUBLE PRECISION DEFAULT 0.0,
    connection_rate DOUBLE PRECISION DEFAULT 0.0,
    concurrent_connections INTEGER DEFAULT 0,
    incomplete_connection_rate DOUBLE PRECISION DEFAULT 0.0,
    packet_size_entropy DOUBLE PRECISION DEFAULT 0.0,
    ttl_entropy DOUBLE PRECISION DEFAULT 0.0,
    protocol_entropy DOUBLE PRECISION DEFAULT 0.0,
    dns_query_length_mean DOUBLE PRECISION DEFAULT 0.0,
    dns_entropy DOUBLE PRECISION DEFAULT 0.0,
    unique_domain_ratio DOUBLE PRECISION DEFAULT 0.0,
    destination_frequency DOUBLE PRECISION DEFAULT 0.0,
    destination_rarity DOUBLE PRECISION DEFAULT 0.0,
    inter_arrival_mean DOUBLE PRECISION DEFAULT 0.0,
    inter_arrival_stddev DOUBLE PRECISION DEFAULT 0.0,
    inter_arrival_cv DOUBLE PRECISION DEFAULT 0.0,
    autocorrelation_score DOUBLE PRECISION DEFAULT 0.0,
    fft_periodicity_score DOUBLE PRECISION DEFAULT 0.0,
    session_byte_mean DOUBLE PRECISION DEFAULT 0.0,
    session_byte_stddev DOUBLE PRECISION DEFAULT 0.0,
    baseline_deviation DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. models: Versioned tracking of detection engines and ML models
CREATE TABLE IF NOT EXISTS models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    model_type VARCHAR(50),
    training_dataset VARCHAR(255),
    feature_version VARCHAR(50),
    precision DOUBLE PRECISION,
    recall DOUBLE PRECISION,
    f1_score DOUBLE PRECISION,
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. alerts: Verifiable detection records
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL,
    source_ip INET,
    destination_ip INET,
    source_host_id UUID REFERENCES hosts(id) ON DELETE SET NULL,
    detection_engine VARCHAR(50),
    -- packet, connection, session, ml, correlation
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    feature_version VARCHAR(50),
    status VARCHAR(30) DEFAULT 'active',
    first_seen TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. alert_evidence: Explainability cards ("WHY WE FLAGGED THIS")
CREATE TABLE IF NOT EXISTS alert_evidence (
    id BIGSERIAL PRIMARY KEY,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    observed_value DOUBLE PRECISION NOT NULL,
    baseline_value DOUBLE PRECISION NOT NULL,
    deviation DOUBLE PRECISION NOT NULL,
    contribution DOUBLE PRECISION NOT NULL,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. risk_scores: Continuous time-series risk evolution per host
CREATE TABLE IF NOT EXISTS risk_scores (
    id BIGSERIAL PRIMARY KEY,
    host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    score DOUBLE PRECISION NOT NULL,
    packet_component DOUBLE PRECISION DEFAULT 0.0,
    connection_component DOUBLE PRECISION DEFAULT 0.0,
    session_component DOUBLE PRECISION DEFAULT 0.0,
    ml_component DOUBLE PRECISION DEFAULT 0.0,
    baseline_component DOUBLE PRECISION DEFAULT 0.0,
    correlation_component DOUBLE PRECISION DEFAULT 0.0,
    risk_level VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. campaigns: Multi-host and persistent attack correlation
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(100),
    confidence DOUBLE PRECISION,
    risk_score DOUBLE PRECISION,
    status VARCHAR(30) DEFAULT 'active',
    first_seen TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    suspicious_hosts INTEGER DEFAULT 0,
    correlated_alerts INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. campaign_members: Membership and assigned roles
CREATE TABLE IF NOT EXISTS campaign_members (
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
    role VARCHAR(50),
    -- infected_host, c2, destination, dns, source
    confidence DOUBLE PRECISION,
    first_seen TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    PRIMARY KEY (campaign_id, host_id)
);

-- 12. graph_edges: Attack correlation graph edges
CREATE TABLE IF NOT EXISTS graph_edges (
    id BIGSERIAL PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    source_type VARCHAR(50),
    source_id VARCHAR(255),
    relationship VARCHAR(100),
    -- COMMUNICATES_WITH, RESOLVES_TO, SIMILAR_BEHAVIOR, SHARED_DESTINATION, TRIGGERED, CORRELATED_WITH
    destination_type VARCHAR(50),
    destination_id VARCHAR(255),
    confidence DOUBLE PRECISION,
    first_seen TIMESTAMPTZ,
    last_seen TIMESTAMPTZ
);

-- 13. dns_events: Dedicated DNS tunneling and DGA event tracking
CREATE TABLE IF NOT EXISTS dns_events (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_ip INET,
    resolver_ip INET,
    query_domain TEXT NOT NULL,
    query_type VARCHAR(20),
    query_length INTEGER,
    label_count INTEGER,
    entropy DOUBLE PRECISION,
    unique_subdomain_ratio DOUBLE PRECISION,
    suspicious_score DOUBLE PRECISION,
    is_dga BOOLEAN DEFAULT FALSE,
    is_tunnel BOOLEAN DEFAULT FALSE,
    host_id UUID REFERENCES hosts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. audit_events: Cryptographically chained blockchain-style tamper-evident log
CREATE TABLE IF NOT EXISTS audit_events (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    event_type VARCHAR(100) NOT NULL,
    actor VARCHAR(255) DEFAULT 'SYSTEM',
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    action VARCHAR(100),
    metadata JSONB,
    previous_hash TEXT NOT NULL,
    event_hash TEXT NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_flows_timestamp ON flows(timestamp);
CREATE INDEX IF NOT EXISTS idx_flows_src_ip ON flows(src_ip);
CREATE INDEX IF NOT EXISTS idx_flows_dst_ip ON flows(dst_ip);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_src_ip ON sessions(src_ip);
CREATE INDEX IF NOT EXISTS idx_sessions_dst_ip ON sessions(dst_ip);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_source_ip ON alerts(source_ip);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_risk_scores_host_time ON risk_scores(host_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_dns_events_timestamp ON dns_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_dns_events_source_ip ON dns_events(source_ip);
CREATE INDEX IF NOT EXISTS idx_audit_events_hash ON audit_events(event_hash);
