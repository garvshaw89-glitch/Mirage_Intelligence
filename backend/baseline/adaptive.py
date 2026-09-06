"""
MIRAGE Adaptive Host Baseline Engine
Maintains Exponentially Weighted Moving Averages (EWMA) per host.
Provides dynamic, zero-training-drift profiling with statistical anomaly detection.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class HostMetricBaseline:
    mean: float = 0.0
    variance: float = 0.0
    sample_count: int = 0
    alpha: float = 0.05  # EWMA smoothing factor

    def update(self, observed: float) -> None:
        self.sample_count += 1
        if self.sample_count == 1:
            self.mean = observed
            self.variance = 1.0
            return

        diff = observed - self.mean
        # Update mean
        self.mean = (1 - self.alpha) * self.mean + self.alpha * observed
        # Update variance (Welford-style EWMA variance)
        self.variance = (1 - self.alpha) * self.variance + self.alpha * (diff**2)

    @property
    def stddev(self) -> float:
        return math.sqrt(max(1e-4, self.variance))

    def z_score(self, observed: float) -> float:
        if self.sample_count < 5:
            return 0.0
        return (observed - self.mean) / self.stddev


class AdaptiveBaselineManager:
    """
    Per-host multi-metric baseline tracker.
    Tracks: packets_per_sec, bytes_per_sec, syn_rate, udp_rate, concurrent_connections.
    """

    def __init__(self, warmup_samples: int = 30) -> None:
        self.warmup_samples = warmup_samples
        self._baselines: dict[str, dict[str, HostMetricBaseline]] = {}

    def get_or_create_host(self, host_ip: str) -> dict[str, HostMetricBaseline]:
        if host_ip not in self._baselines:
            self._baselines[host_ip] = {
                "packets_per_sec": HostMetricBaseline(alpha=0.03),
                "bytes_per_sec": HostMetricBaseline(alpha=0.03),
                "syn_rate": HostMetricBaseline(alpha=0.05),
                "udp_rate": HostMetricBaseline(alpha=0.05),
                "concurrent_connections": HostMetricBaseline(alpha=0.05),
                "inter_arrival_mean": HostMetricBaseline(alpha=0.05),
                "dns_entropy": HostMetricBaseline(alpha=0.05),
            }
        return self._baselines[host_ip]

    def update_host(self, host_ip: str, features: dict[str, Any]) -> None:
        host_metrics = self.get_or_create_host(host_ip)
        for key, metric in host_metrics.items():
            if key in features and isinstance(features[key], (int, float)):
                metric.update(float(features[key]))

    def evaluate_deviations(self, host_ip: str, features: dict[str, Any]) -> dict[str, Any]:
        """
        Compares observed values against baseline and returns deviation metrics.
        """
        host_metrics = self.get_or_create_host(host_ip)
        deviations: dict[str, float] = {}
        max_z = 0.0
        is_ready = True

        for key, metric in host_metrics.items():
            if metric.sample_count < self.warmup_samples:
                is_ready = False
            if key in features and isinstance(features[key], (int, float)):
                val = float(features[key])
                z = metric.z_score(val)
                deviations[key] = round(z, 2)
                if abs(z) > max_z:
                    max_z = abs(z)

        samples = min(m.sample_count for m in host_metrics.values()) if host_metrics else 0
        status = "established" if samples >= self.warmup_samples else "learning"

        return {
            "status": status,
            "samples": samples,
            "is_baseline_ready": is_ready,
            "max_z_score": round(max_z, 2),
            "metric_z_scores": deviations,
        }

    def get_baseline_snapshot(self, host_ip: str) -> dict[str, Any]:
        host_metrics = self.get_or_create_host(host_ip)
        return {
            key: {
                "mean": round(m.mean, 2),
                "stddev": round(m.stddev, 2),
                "samples": m.sample_count,
            }
            for key, m in host_metrics.items()
        }
