"""
MIRAGE Passive Sensor & Pipeline Orchestrator
Multi-resolution Intelligent Risk & Adaptive Graph Engine
Problem Statement ID: 26145 · NTRO

Runs as the primary consumer inside the secure monitoring enclave.
Reads from the write-isolated Unidirectional Tap, extracts features,
runs detection engines, tracks adaptive baselines, computes risk,
correlates campaigns, logs cryptographic audit blocks, and broadcasts
live WebSocket updates.
"""
from __future__ import annotations

import asyncio
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any

from backend.api.schemas import Severity, ThreatType
from backend.audit.blockchain import get_audit_ledger
from backend.baseline.adaptive import AdaptiveBaselineManager
from backend.correlation.campaign import CampaignCorrelationEngine
from backend.detection.engines import MultiResolutionDetector
from backend.features.extractor import FeatureExtractor
from backend.ingestion.tap import RawPacketRecord, get_traffic_tap
from backend.risk.engine import RiskEngine

logger = logging.getLogger("mirage.sensor")


class PassiveSensorEnclave:
    def __init__(self) -> None:
        self.feature_extractor = FeatureExtractor(window_seconds=2.0)
        self.baseline_manager = AdaptiveBaselineManager(warmup_samples=15)
        self.detector = MultiResolutionDetector()
        self.risk_engine = RiskEngine(decay_rate=0.96)
        self.campaign_engine = CampaignCorrelationEngine()
        self.audit_ledger = get_audit_ledger()

        self._is_running: bool = False
        self._loop_task: asyncio.Task[None] | None = None
        self._ws_broadcast_callback: Any | None = None

        # Telemetry metrics
        self.total_processed_packets: int = 0
        self.start_time: float = time.monotonic()
        self.last_eval_time: float = time.monotonic()
        self.latest_alerts: list[dict[str, Any]] = []
        self.latest_host_risks: dict[str, dict[str, Any]] = {}
        self.observed_hosts: set[str] = {"10.0.0.1", "10.0.0.10", "10.0.0.21", "10.0.0.31", "10.0.0.50"}

    def set_ws_broadcaster(self, callback: Any) -> None:
        self._ws_broadcast_callback = callback

    async def broadcast_ws(self, event_type: str, data: dict[str, Any]) -> None:
        if self._ws_broadcast_callback:
            try:
                await self._ws_broadcast_callback(event_type, data)
            except Exception as e:
                logger.debug(f"WS broadcast skipped: {e}")

    async def start(self) -> None:
        self._is_running = True
        self._loop_task = asyncio.create_task(self._sensor_loop())
        logger.info("Passive Sensor Enclave started on Unidirectional Diode.")

    async def stop(self) -> None:
        self._is_running = False
        if self._loop_task and not self._loop_task.done():
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
        logger.info("Passive Sensor Enclave stopped.")

    async def _sensor_loop(self) -> None:
        tap = get_traffic_tap()

        while self._is_running:
            try:
                # 1. Drain available packets from one-way diode tap
                pkt = await tap.read_packet()
                self.total_processed_packets += 1
                self.observed_hosts.add(pkt.src_ip)

                # Feed packet to feature extractor
                self.feature_extractor.ingest_packet(pkt)

                # 2. Periodic periodic evaluation tick (every 1.0s)
                now = time.monotonic()
                if now - self.last_eval_time >= 1.0:
                    eval_start = time.monotonic()
                    await self._evaluate_enclave_hosts()
                    latency_ms = (time.monotonic() - eval_start) * 1000.0

                    # Broadcast high-resolution aggregate metrics
                    active_threats = len([a for a in self.latest_alerts if a.get("is_active", True)])
                    crit_hosts = sum(1 for r in self.latest_host_risks.values() if r.get("score", 0) >= 80.0)
                    await self.broadcast_ws(
                        "traffic_update",
                        {
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "pps": round(tap.pps, 1),
                            "bps": round(tap.bps, 1),
                            "packetsPerSec": round(tap.pps, 1),
                            "bytesPerSec": round(tap.bps, 1),
                            "packets_per_sec": round(tap.pps, 1),
                            "bytes_per_sec": round(tap.bps, 1),
                            "queue_depth": tap.queue_depth,
                            "dropped": tap.total_dropped_packets,
                            "detection_latency_ms": round(latency_ms, 2),
                            "detectionLatencyMs": round(latency_ms, 2),
                            "active_hosts": len(self.observed_hosts),
                            "activeHosts": len(self.observed_hosts),
                            "active_sessions": len(self.feature_extractor._active_sessions),
                            "activeSessions": len(self.feature_extractor._active_sessions),
                            "alerts_total": active_threats,
                            "alertsTotal": active_threats,
                            "critical_hosts": crit_hosts,
                            "criticalHosts": crit_hosts,
                            "active_campaigns": len(self.campaign_engine.get_all_campaigns()),
                            "activeCampaigns": len(self.campaign_engine.get_all_campaigns()),
                        },
                    )
                    self.last_eval_time = now

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in sensor processing loop: {e}", exc_info=True)
                await asyncio.sleep(0.1)

    async def _evaluate_enclave_hosts(self) -> None:
        """Evaluates features, baselines, risk, and correlation for all observed hosts."""
        for host_ip in list(self.observed_hosts):
            features = self.feature_extractor.extract_host_features(host_ip)
            if not features:
                continue

            # Update baseline
            self.baseline_manager.update_host(host_ip, features)
            baseline_eval = self.baseline_manager.evaluate_deviations(host_ip, features)

            # Detection analysis
            detections = self.detector.analyze(features, baseline_eval)

            # Risk calculation
            is_in_camp = self.campaign_engine.is_host_in_campaign(host_ip)
            risk_result = self.risk_engine.update_risk(host_ip, detections, baseline_eval, is_in_camp)
            self.latest_host_risks[host_ip] = risk_result

            # Process any new detections
            for det in detections:
                alert_id = str(uuid.uuid4())
                dst_ip = "10.0.0.10" if host_ip != "10.0.0.10" else "10.0.0.1"
                if det.threat_type == ThreatType.C2_BEACON:
                    dst_ip = "198.51.100.42"
                elif det.threat_type in (ThreatType.DNS_TUNNEL, ThreatType.DGA):
                    dst_ip = "1.1.1.1"

                # Correlate Campaign
                campaign_id = self.campaign_engine.process_alert(
                    alert_id=alert_id,
                    host_ip=host_ip,
                    dst_ip=dst_ip,
                    threat_type=det.threat_type,
                    severity=det.severity,
                    risk_score=risk_result["score"],
                )

                # Record Blockchain Audit Block for Forensics
                audit_block = self.audit_ledger.record_event(
                    event_type=f"ALERT_{det.threat_type.value}",
                    actor="PASSIVE_SENSOR",
                    resource_type="HOST",
                    resource_id=host_ip,
                    action="DETECTION_TRIGGERED",
                    metadata={
                        "alert_id": alert_id,
                        "threat_type": det.threat_type.value,
                        "severity": det.severity.value,
                        "confidence": det.confidence,
                        "risk_score": risk_result["score"],
                        "engine": det.detection_engine.value,
                        "campaign_id": campaign_id,
                    },
                )

                alert_record = {
                    "id": alert_id,
                    "host_id": host_ip,
                    "hostId": host_ip,
                    "src_ip": host_ip,
                    "srcIp": host_ip,
                    "dst_ip": dst_ip,
                    "dstIp": dst_ip,
                    "threat_type": det.threat_type.value,
                    "threatType": det.threat_type.value,
                    "severity": det.severity.value,
                    "confidence": round(det.confidence, 2),
                    "risk_score": risk_result["score"],
                    "riskScore": risk_result["score"],
                    "detection_engine": det.detection_engine.value,
                    "detectionEngine": det.detection_engine.value,
                    "description": det.description,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "evidence": det.evidence,
                    "campaign_id": campaign_id,
                    "campaignId": campaign_id,
                    "model_version": det.model_version,
                    "modelVersion": det.model_version,
                    "evidence_hash": audit_block.event_hash[:16],
                    "evidenceHash": audit_block.event_hash[:16],
                    "is_active": True,
                    "isActive": True,
                }

                self.latest_alerts.insert(0, alert_record)
                if len(self.latest_alerts) > 100:
                    self.latest_alerts.pop()

                # Broadcast live Alert & Risk update
                await self.broadcast_ws("alert_created", alert_record)

            # Broadcast host risk update
            await self.broadcast_ws("host_update", {
                "id": host_ip,
                "ip": host_ip,
                "risk_score": risk_result["score"],
                "riskScore": risk_result["score"],
                "risk_level": risk_result["level"].value,
                "riskLevel": risk_result["level"].value,
                "components": risk_result["components"],
                "baseline_status": baseline_eval["status"],
                "baseline_samples": baseline_eval["samples"],
            })


# Global passive sensor instance
sensor_enclave = PassiveSensorEnclave()


def get_sensor_enclave() -> PassiveSensorEnclave:
    return sensor_enclave
