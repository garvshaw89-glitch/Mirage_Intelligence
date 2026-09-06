"""
MIRAGE Continuous Risk Engine
Computes 0-100 bounded risk scores with component decomposition and exponential decay.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from backend.api.schemas import RiskLevel, Severity
from backend.core.config import get_settings
from backend.detection.engines import DetectionResult

settings = get_settings()


@dataclass
class HostRiskState:
    host_ip: str
    current_score: float = 5.0
    packet_component: float = 0.0
    connection_component: float = 0.0
    session_component: float = 0.0
    ml_component: float = 0.0
    baseline_component: float = 0.0
    correlation_component: float = 0.0
    last_updated: float = field(default_factory=time.monotonic)
    history: list[dict[str, Any]] = field(default_factory=list)


class RiskEngine:
    """
    Evaluates detections, baseline deviations, and campaign memberships
    to compute composite risk scores. Strictly bounded [0.0, 100.0].
    """

    def __init__(self, decay_rate: float = 0.95) -> None:
        self.decay_rate = decay_rate
        self._host_states: dict[str, HostRiskState] = {}

    def get_or_create_state(self, host_ip: str) -> HostRiskState:
        if host_ip not in self._host_states:
            self._host_states[host_ip] = HostRiskState(host_ip=host_ip)
        return self._host_states[host_ip]

    def update_risk(
        self,
        host_ip: str,
        detections: list[DetectionResult],
        baseline_eval: dict[str, Any],
        is_in_campaign: bool = False,
    ) -> dict[str, Any]:
        state = self.get_or_create_state(host_ip)
        now = time.monotonic()
        elapsed = now - state.last_updated
        state.last_updated = now

        # 1. Apply Exponential Decay to existing score
        if elapsed > 0:
            decay_factor = self.decay_rate ** min(10.0, elapsed)
            state.packet_component *= decay_factor
            state.connection_component *= decay_factor
            state.session_component *= decay_factor
            state.ml_component *= decay_factor
            state.baseline_component *= decay_factor
            state.correlation_component *= decay_factor

        # 2. Accumulate incoming detection impacts
        for det in detections:
            sev_multiplier = {
                Severity.INFO: 5.0,
                Severity.LOW: 15.0,
                Severity.MEDIUM: 35.0,
                Severity.HIGH: 65.0,
                Severity.CRITICAL: 90.0,
            }.get(det.severity, 20.0)

            impact = sev_multiplier * det.confidence

            if det.detection_engine.value == "PACKET":
                state.packet_component = max(state.packet_component, impact)
            elif det.detection_engine.value == "CONNECTION":
                state.connection_component = max(state.connection_component, impact)
            elif det.detection_engine.value == "SESSION":
                state.session_component = max(state.session_component, impact)
            elif det.detection_engine.value == "ML":
                state.ml_component = max(state.ml_component, impact)

        # 3. Baseline deviation component
        max_z = baseline_eval.get("max_z_score", 0.0)
        baseline_impact = min(30.0, max_z * 4.0)
        state.baseline_component = max(state.baseline_component, baseline_impact)

        # 4. Campaign correlation bonus
        if is_in_campaign:
            state.correlation_component = max(state.correlation_component, 25.0)

        # 5. Composite Risk Fusion
        # Blended weighted max: highest signal dominates, plus incremental contributors
        components = [
            state.packet_component,
            state.connection_component,
            state.session_component,
            state.ml_component,
            state.baseline_component,
            state.correlation_component,
        ]
        max_c = max(components) if components else 0.0
        remaining_sum = sum(c for c in components if c != max_c)
        composite = max_c + (remaining_sum * 0.15)

        # Floor of 5.0 for active host baseline, strictly capped at 100.0
        clamped_score = max(5.0, min(100.0, composite))
        state.current_score = round(clamped_score, 1)

        # Classify Level
        if state.current_score >= 85.0:
            level = RiskLevel.CRITICAL
        elif state.current_score >= 70.0:
            level = RiskLevel.HIGH
        elif state.current_score >= 40.0:
            level = RiskLevel.MEDIUM
        elif state.current_score >= 20.0:
            level = RiskLevel.LOW
        else:
            level = RiskLevel.NORMAL

        # Record history
        hist_point = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "score": state.current_score,
            "packet": round(state.packet_component, 1),
            "connection": round(state.connection_component, 1),
            "session": round(state.session_component, 1),
            "ml": round(state.ml_component, 1),
            "baseline": round(state.baseline_component, 1),
            "correlation": round(state.correlation_component, 1),
        }
        state.history.append(hist_point)
        if len(state.history) > 60:
            state.history.pop(0)

        return {
            "host_ip": host_ip,
            "score": state.current_score,
            "level": level,
            "components": {
                "packet": round(state.packet_component, 1),
                "connection": round(state.connection_component, 1),
                "session": round(state.session_component, 1),
                "ml": round(state.ml_component, 1),
                "baseline": round(state.baseline_component, 1),
                "correlation": round(state.correlation_component, 1),
            },
            "history": state.history[-20:],
        }
