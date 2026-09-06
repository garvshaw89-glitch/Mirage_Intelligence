"""
MIRAGE Unidirectional Optical Diode / Tap Emulator
Multi-resolution Intelligent Risk & Adaptive Graph Engine
Problem Statement ID: 26145 (NTRO)

Strictly enforces unidirectional IP traffic:
- Physical/Architectural simulation of hardware data diode: Tx is isolated; only Rx exists.
- The simulator or external tap can ONLY write into the bounded ingress queue.
- The sensor can ONLY read from the queue — zero reverse communication path.
- Ingress rate tracking, dropped packet metrics, buffer saturation defenses.
- Every packet record contains provenance metadata: REAL_CAPTURE, PCAP_REPLAY, SIMULATION, TEST_FIXTURE.
"""
from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any

logger = logging.getLogger("mirage.tap")


class TrafficProvenance(str, Enum):
    REAL_CAPTURE = "REAL_CAPTURE"
    PCAP_REPLAY = "PCAP_REPLAY"
    SIMULATION = "SIMULATION"
    TEST_FIXTURE = "TEST_FIXTURE"


@dataclass(slots=True)
class RawPacketRecord:
    timestamp: float
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str  # TCP, UDP, ICMP, DNS
    packet_size: int
    tcp_flags: str = ""  # SYN, ACK, FIN, RST, PSH, URG
    ttl: int = 64
    payload_entropy: float = 0.0
    dns_query: str = ""
    dns_qtype: str = ""
    simulation_run_id: str | None = None
    provenance: TrafficProvenance = TrafficProvenance.SIMULATION
    metadata: dict[str, Any] = field(default_factory=dict)


class OneWayTapQueue:
    """
    Asymmetric Unidirectional Channel.
    Enforces that producers can only write (put_nowait) and consumers can only read (get).
    Provides metrics for hardware diode monitoring.
    """

    def __init__(self, maxsize: int = 10_000) -> None:
        self._queue: asyncio.Queue[RawPacketRecord] = asyncio.Queue(maxsize=maxsize)
        self._total_ingress_packets: int = 0
        self._total_ingress_bytes: int = 0
        self._total_dropped_packets: int = 0
        self._last_second_packets: int = 0
        self._last_second_bytes: int = 0
        self._last_tick: float = time.monotonic()
        self._current_pps: float = 0.0
        self._current_bps: float = 0.0

    @property
    def queue_depth(self) -> int:
        return self._queue.qsize()

    @property
    def total_ingress_packets(self) -> int:
        return self._total_ingress_packets

    @property
    def total_dropped_packets(self) -> int:
        return self._total_dropped_packets

    @property
    def pps(self) -> float:
        self._update_rates()
        return self._current_pps

    @property
    def bps(self) -> float:
        self._update_rates()
        return self._current_bps

    def _update_rates(self) -> None:
        now = time.monotonic()
        elapsed = now - self._last_tick
        if elapsed >= 1.0:
            self._current_pps = self._last_second_packets / elapsed
            self._current_bps = (self._last_second_bytes * 8) / elapsed
            self._last_second_packets = 0
            self._last_second_bytes = 0
            self._last_tick = now

    def write_packet(self, record: RawPacketRecord) -> bool:
        """
        Write-only interface used exclusively by the external network simulator / tap.
        Non-blocking. Drops with counter if queue is saturated (backpressure protection).
        """
        self._total_ingress_packets += 1
        self._total_ingress_bytes += record.packet_size
        self._last_second_packets += 1
        self._last_second_bytes += record.packet_size

        try:
            self._queue.put_nowait(record)
            return True
        except asyncio.QueueFull:
            self._total_dropped_packets += 1
            if self._total_dropped_packets % 1000 == 1:
                logger.warning(
                    f"[DATA DIODE OVERFLOW] Queue full ({self._queue.maxsize}). Dropping packet. "
                    f"Total dropped: {self._total_dropped_packets}"
                )
            return False

    async def read_packet(self) -> RawPacketRecord:
        """
        Read-only interface used exclusively by the Passive Sensor inside the monitoring enclave.
        """
        return await self._queue.get()


# Global Unidirectional Hardware Diode Instance
_diode_tap = OneWayTapQueue(maxsize=20_000)


def get_traffic_tap() -> OneWayTapQueue:
    return _diode_tap
