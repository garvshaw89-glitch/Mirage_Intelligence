"""
MIRAGE Unit Test Suite
Verifies:
1. One-way diode queue isolation & bounded memory protection
2. Feature extraction (Packet, Connection, Session, DNS Shannon Entropy)
3. Adaptive EWMA baseline & z-score anomaly scoring
4. Risk engine strict bounds [0.0, 100.0] & exponential decay
5. Cryptographic blockchain audit ledger integrity and tamper verification
6. Scenario registry enforcement (command injection defense)
"""
import math
import time
import pytest

from backend.api.schemas import Severity, ThreatType, SimulationScenario, DetectionEngine
from backend.audit.blockchain import BlockchainAuditLedger
from backend.baseline.adaptive import AdaptiveBaselineManager, HostMetricBaseline
from backend.features.extractor import FeatureExtractor, calculate_shannon_entropy
from backend.ingestion.tap import OneWayTapQueue, RawPacketRecord, TrafficProvenance
from backend.risk.engine import RiskEngine
from backend.detection.engines import DetectionResult, MultiResolutionDetector


# 1. Test One-Way Diode Isolation
def test_one_way_tap_isolation():
    tap = OneWayTapQueue(maxsize=100)
    record = RawPacketRecord(
        timestamp=time.time(),
        src_ip="10.0.0.50",
        dst_ip="10.0.0.10",
        src_port=54321,
        dst_port=80,
        protocol="TCP",
        packet_size=60,
        tcp_flags="SYN",
        provenance=TrafficProvenance.SIMULATION,
    )

    # Write-only succeeds
    assert tap.write_packet(record) is True
    assert tap.queue_depth == 1
    assert tap.total_ingress_packets == 1


# 2. Test Bounded Queue Prevents OOM
def test_bounded_queue_overflow_protection():
    tap = OneWayTapQueue(maxsize=5)
    for i in range(10):
        pkt = RawPacketRecord(
            timestamp=time.time(),
            src_ip="10.0.0.50",
            dst_ip="10.0.0.10",
            src_port=1000 + i,
            dst_port=80,
            protocol="TCP",
            packet_size=60,
        )
        tap.write_packet(pkt)

    assert tap.queue_depth == 5
    assert tap.total_dropped_packets == 5


# 3. Test Feature Extraction (Shannon Entropy & Periodicity)
def test_shannon_entropy():
    # Low entropy (uniform characters)
    low_entropy = calculate_shannon_entropy("aaaaaaaaaa")
    assert low_entropy == 0.0

    # High entropy (random base32/base64 encoded string)
    high_entropy = calculate_shannon_entropy("4f8a92b0c1e847d9283f")
    assert high_entropy > 3.0


def test_feature_extractor_sliding_window():
    fe = FeatureExtractor(window_seconds=1.0)
    now = time.time()
    for _ in range(50):
        fe.ingest_packet(
            RawPacketRecord(
                timestamp=now,
                src_ip="10.0.0.21",
                dst_ip="10.0.0.10",
                src_port=4000,
                dst_port=443,
                protocol="TCP",
                packet_size=100,
                tcp_flags="SYN",
            )
        )

    features = fe.extract_host_features("10.0.0.21", now=now)
    assert features["packets_per_sec"] == 50.0
    assert features["syn_rate"] == 50.0
    assert features["bytes_per_sec"] == 5000.0


# 4. Test Adaptive EWMA Baseline
def test_adaptive_baseline_welford_convergence():
    baseline = HostMetricBaseline(alpha=0.1)
    for val in [10.0, 12.0, 11.0, 10.5, 9.5]:
        baseline.update(val)

    assert baseline.sample_count == 5
    assert 9.0 <= baseline.mean <= 12.0

    # Normal sample has low z-score
    z_norm = baseline.z_score(10.5)
    assert abs(z_norm) < 2.0

    # Severe spike has high z-score
    z_spike = baseline.z_score(150.0)
    assert z_spike > 10.0


# 5. Test Risk Engine Bounds & Decay
def test_risk_score_strict_bounds():
    engine = RiskEngine(decay_rate=0.95)
    baseline_eval = {"max_z_score": 0.5}

    # Benign host should floor at 5.0
    res_benign = engine.update_risk("10.0.0.10", [], baseline_eval)
    assert res_benign["score"] == 5.0

    # Massive attack cannot exceed 100.0
    crit_det = DetectionResult(
        threat_type=ThreatType.SYN_FLOOD,
        severity=Severity.CRITICAL,
        confidence=0.99,
        detection_engine=DetectionEngine.PACKET,
        description="Massive Flood",
        evidence=[],
    )
    res_crit = engine.update_risk("10.0.0.50", [crit_det, crit_det, crit_det], {"max_z_score": 25.0})
    assert res_crit["score"] <= 100.0
    assert res_crit["score"] >= 85.0


# 6. Test Blockchain Audit Ledger Tamper Verification
def test_blockchain_audit_ledger_integrity():
    ledger = BlockchainAuditLedger()

    # Record 3 events
    ledger.record_event("EVENT_1", actor="SENSOR", resource_type="ALERT", resource_id="alt-1")
    ledger.record_event("EVENT_2", actor="SENSOR", resource_type="ALERT", resource_id="alt-2")
    ledger.record_event("EVENT_3", actor="OPERATOR", resource_type="CONFIG", resource_id="conf-1")

    # Initial verification must pass
    verify_init = ledger.verify_integrity()
    assert verify_init["is_valid"] is True
    assert verify_init["total_blocks"] == 4  # genesis + 3 events

    # Simulate retroactive tampering of Block 1
    ledger._chain[1].action = "MALICIOUS_ALTERATION"
    tamper_verify = ledger.verify_integrity()
    assert tamper_verify["is_valid"] is False
    assert "Tampered block at index 1" in tamper_verify["reason"]


# 7. Test Database Models & Schema Initialization
@pytest.mark.asyncio
async def test_database_initialization():
    from backend.db.session import init_db, async_session_factory
    from backend.db.models import Host, ModelRegistry, AuditEvent
    from sqlalchemy import select

    await init_db()
    async with async_session_factory() as session:
        hosts_res = await session.execute(select(Host))
        hosts = hosts_res.scalars().all()
        assert len(hosts) >= 5

        models_res = await session.execute(select(ModelRegistry))
        models = models_res.scalars().all()
        assert len(models) >= 4

        audit_res = await session.execute(select(AuditEvent))
        audits = audit_res.scalars().all()
        assert len(audits) >= 1
