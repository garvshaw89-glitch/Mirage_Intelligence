"""
MIRAGE Cyber Range & Traffic Synthesis Engine
Multi-resolution Intelligent Risk & Adaptive Graph Engine
Problem Statement ID: 26145 · NTRO

Generates the exact traffic classes required by NTRO:
- Benign: iperf3, Ostinato, TRex (bulk, bursty, multi-protocol background)
- Attacks:
  * hping3 SYN / UDP Floods
  * Slowloris (HTTP socket exhaustion)
  * dnscat2 / iodine DNS Tunneling
  * DGA (Domain Generation Algorithm samples)
  * Sandboxed C2 Emulator (realistic beaconing with jitter)
  * Multi-Host Coordinated Campaign

Strictly writes outward into the Unidirectional Data Diode Tap.
"""
from __future__ import annotations

import asyncio
import logging
import random
import string
import time
import uuid
from typing import Any

from backend.api.schemas import SimulationScenario
from backend.api.websocket import get_ws_broadcaster
from backend.ingestion.tap import RawPacketRecord, TrafficProvenance, get_traffic_tap

logger = logging.getLogger("mirage.range")


def gen_dga_domain() -> str:
    """Generates a high-entropy pseudo-random domain resembling Conficker/Kraken DGA."""
    length = random.randint(10, 22)
    chars = string.ascii_lowercase + string.digits
    sub = "".join(random.choice(chars) for _ in range(length))
    tld = random.choice(["biz", "info", "cc", "top", "xyz", "ru"])
    return f"{sub}.{tld}"


def gen_tunnel_domain() -> str:
    """Generates base32/base64 encoded DNS tunneling queries resembling dnscat2/iodine."""
    encoded_chunk = "".join(random.choice("abcdefghijklmnopqrstuvwxyz012345") for _ in range(32))
    return f"{encoded_chunk}.stage1.tunnel.internal-corp-sync.net"


class CyberRangeManager:
    def __init__(self) -> None:
        self._current_task: asyncio.Task[None] | None = None
        self._is_running: bool = False
        self._current_scenario: SimulationScenario = SimulationScenario.NORMAL
        self._simulation_run_id: str | None = None
        self._start_time: float = 0.0
        self._duration_seconds: int = 120
        self._packets_generated: int = 0
        self._flows_generated: int = 0
        self._stage: str = "IDLE"

    @property
    def is_running(self) -> bool:
        return self._is_running

    def get_status(self) -> dict[str, Any]:
        elapsed = time.monotonic() - self._start_time if self._is_running else 0.0
        return {
            "is_running": self._is_running,
            "isRunning": self._is_running,
            "scenario": self._current_scenario.value if self._is_running else None,
            "simulation_run_id": self._simulation_run_id,
            "simulationRunId": self._simulation_run_id,
            "elapsed_seconds": round(elapsed, 1),
            "elapsedSeconds": round(elapsed, 1),
            "duration_seconds": self._duration_seconds,
            "durationSeconds": self._duration_seconds,
            "stage": self._stage,
            "packets_generated": self._packets_generated,
            "packetsGenerated": self._packets_generated,
            "flows_generated": self._flows_generated,
            "flowsGenerated": self._flows_generated,
        }

    async def start_scenario(
        self,
        scenario: SimulationScenario,
        duration_seconds: int = 120,
    ) -> str:
        """Starts a background scenario generator task."""
        if self._is_running:
            await self.stop_scenario()

        self._is_running = True
        self._current_scenario = scenario
        self._simulation_run_id = str(uuid.uuid4())
        self._start_time = time.monotonic()
        self._duration_seconds = duration_seconds
        self._packets_generated = 0
        self._flows_generated = 0
        self._stage = f"INIT_{scenario.value}"

        self._current_task = asyncio.create_task(self._run_loop())
        logger.info(f"Cyber range launched scenario {scenario.value} (ID: {self._simulation_run_id})")
        try:
            ws = get_ws_broadcaster()
            await ws.broadcast("simulation_status", self.get_status())
        except Exception:
            pass
        return self._simulation_run_id

    async def stop_scenario(self) -> None:
        self._is_running = False
        if self._current_task and not self._current_task.done():
            self._current_task.cancel()
            try:
                await self._current_task
            except asyncio.CancelledError:
                pass
        self._stage = "STOPPED"
        logger.info("Cyber range scenario stopped.")
        try:
            ws = get_ws_broadcaster()
            await ws.broadcast("simulation_status", self.get_status())
        except Exception:
            pass

    async def _run_loop(self) -> None:
        tap = get_traffic_tap()
        end_time = self._start_time + self._duration_seconds

        # Continuous background simulation hosts
        user_ip = "10.0.0.21"
        server_ip = "10.0.0.10"
        attacker_ip = "10.0.0.50"
        c2_ip = "198.51.100.42"
        dns_ip = "1.1.1.1"

        try:
            while self._is_running and time.monotonic() < end_time:
                now_ts = time.time()
                self._stage = f"RUNNING_{self._current_scenario.value}"

                # 1. Base Benign Traffic (simulating TRex / iperf3 enterprise normal)
                for _ in range(random.randint(5, 12)):
                    pkt = RawPacketRecord(
                        timestamp=now_ts,
                        src_ip=user_ip,
                        dst_ip=server_ip,
                        src_port=random.randint(49152, 65535),
                        dst_port=443,
                        protocol="TCP",
                        packet_size=random.randint(64, 1460),
                        tcp_flags="ACK",
                        ttl=64,
                        simulation_run_id=self._simulation_run_id,
                        provenance=TrafficProvenance.SIMULATION,
                        metadata={"generator": "TRex_Enterprise"},
                    )
                    tap.write_packet(pkt)
                    self._packets_generated += 1

                # 2. Scenario-specific generation
                if self._current_scenario == SimulationScenario.SYN_FLOOD:
                    # hping3 SYN flood emulation: 150-300 SYN packets per batch
                    for _ in range(random.randint(120, 250)):
                        pkt = RawPacketRecord(
                            timestamp=now_ts,
                            src_ip=attacker_ip,
                            dst_ip=server_ip,
                            src_port=random.randint(1024, 65535),
                            dst_port=80,
                            protocol="TCP",
                            packet_size=60,
                            tcp_flags="SYN",
                            ttl=128,
                            simulation_run_id=self._simulation_run_id,
                            provenance=TrafficProvenance.SIMULATION,
                            metadata={"generator": "hping3_SYN_Flood"},
                        )
                        tap.write_packet(pkt)
                        self._packets_generated += 1

                elif self._current_scenario == SimulationScenario.UDP_FLOOD:
                    # hping3 UDP flood emulation: 180-350 UDP packets per batch
                    for _ in range(random.randint(150, 300)):
                        pkt = RawPacketRecord(
                            timestamp=now_ts,
                            src_ip=attacker_ip,
                            dst_ip=server_ip,
                            src_port=random.randint(1024, 65535),
                            dst_port=random.choice([53, 123, 5060, 3724]),
                            protocol="UDP",
                            packet_size=random.randint(512, 1400),
                            ttl=64,
                            simulation_run_id=self._simulation_run_id,
                            provenance=TrafficProvenance.SIMULATION,
                            metadata={"generator": "hping3_UDP_Flood"},
                        )
                        tap.write_packet(pkt)
                        self._packets_generated += 1

                elif self._current_scenario == SimulationScenario.SLOWLORIS:
                    # Slowloris: periodic stalled partial HTTP request packets across sockets
                    for port in range(3001, 3045):
                        pkt = RawPacketRecord(
                            timestamp=now_ts,
                            src_ip=attacker_ip,
                            dst_ip=server_ip,
                            src_port=port,
                            dst_port=80,
                            protocol="TCP",
                            packet_size=74,
                            tcp_flags="SYN+ACK",
                            ttl=64,
                            simulation_run_id=self._simulation_run_id,
                            provenance=TrafficProvenance.SIMULATION,
                            metadata={"generator": "Slowloris_HTTP_Stall"},
                        )
                        tap.write_packet(pkt)
                        self._packets_generated += 1

                elif self._current_scenario == SimulationScenario.C2_BEACON:
                    # C2 beaconing: precise periodic intervals (CV ~ 0.05, 1-2s simulated tick)
                    pkt = RawPacketRecord(
                        timestamp=now_ts,
                        src_ip=user_ip,
                        dst_ip=c2_ip,
                        src_port=49812,
                        dst_port=8443,
                        protocol="TCP",
                        packet_size=256,
                        tcp_flags="PSH+ACK",
                        ttl=64,
                        simulation_run_id=self._simulation_run_id,
                        provenance=TrafficProvenance.SIMULATION,
                        metadata={"generator": "Sandboxed_C2_Beacon"},
                    )
                    tap.write_packet(pkt)
                    self._packets_generated += 1

                elif self._current_scenario == SimulationScenario.DNS_TUNNEL:
                    # dnscat2 / iodine tunneling: high entropy domain queries
                    for _ in range(8):
                        tunnel_query = gen_tunnel_domain()
                        pkt = RawPacketRecord(
                            timestamp=now_ts,
                            src_ip=user_ip,
                            dst_ip=dns_ip,
                            src_port=random.randint(40000, 60000),
                            dst_port=53,
                            protocol="DNS",
                            packet_size=random.randint(120, 240),
                            dns_query=tunnel_query,
                            dns_qtype="TXT",
                            ttl=64,
                            simulation_run_id=self._simulation_run_id,
                            provenance=TrafficProvenance.SIMULATION,
                            metadata={"generator": "dnscat2_Tunnel"},
                        )
                        tap.write_packet(pkt)
                        self._packets_generated += 1

                elif self._current_scenario == SimulationScenario.DGA:
                    # DGA: high entropy pseudo-random domain queries
                    for _ in range(10):
                        dga_query = gen_dga_domain()
                        pkt = RawPacketRecord(
                            timestamp=now_ts,
                            src_ip=attacker_ip,
                            dst_ip=dns_ip,
                            src_port=random.randint(40000, 60000),
                            dst_port=53,
                            protocol="DNS",
                            packet_size=90,
                            dns_query=dga_query,
                            dns_qtype="A",
                            ttl=64,
                            simulation_run_id=self._simulation_run_id,
                            provenance=TrafficProvenance.SIMULATION,
                            metadata={"generator": "DGA_Generator"},
                        )
                        tap.write_packet(pkt)
                        self._packets_generated += 1

                elif self._current_scenario == SimulationScenario.MULTI_HOST_CAMPAIGN:
                    # Multi-host coordinated attack across Host 21, Host 31, and Host 50
                    # Attacker floods gateway
                    for _ in range(60):
                        tap.write_packet(
                            RawPacketRecord(
                                timestamp=now_ts,
                                src_ip=attacker_ip,
                                dst_ip=server_ip,
                                src_port=random.randint(1024, 65535),
                                dst_port=80,
                                protocol="TCP",
                                packet_size=60,
                                tcp_flags="SYN",
                                simulation_run_id=self._simulation_run_id,
                                provenance=TrafficProvenance.SIMULATION,
                                metadata={"generator": "Campaign_Flood"},
                            )
                        )
                        self._packets_generated += 1

                    # Compromised internal user beacons to C2
                    tap.write_packet(
                        RawPacketRecord(
                            timestamp=now_ts,
                            src_ip=user_ip,
                            dst_ip=c2_ip,
                            src_port=50123,
                            dst_port=8443,
                            protocol="TCP",
                            packet_size=312,
                            tcp_flags="PSH+ACK",
                            simulation_run_id=self._simulation_run_id,
                            provenance=TrafficProvenance.SIMULATION,
                            metadata={"generator": "Campaign_C2"},
                        )
                    )
                    self._packets_generated += 1

                    # Finance workstation performs DNS exfiltration
                    for _ in range(4):
                        tap.write_packet(
                            RawPacketRecord(
                                timestamp=now_ts,
                                src_ip="10.0.0.31",
                                dst_ip=dns_ip,
                                src_port=random.randint(30000, 50000),
                                dst_port=53,
                                protocol="DNS",
                                packet_size=150,
                                dns_query=gen_tunnel_domain(),
                                dns_qtype="TXT",
                                simulation_run_id=self._simulation_run_id,
                                provenance=TrafficProvenance.SIMULATION,
                                metadata={"generator": "Campaign_Exfil"},
                            )
                        )
                        self._packets_generated += 1

                # Broadcast simulation status to WebSocket subscribers
                try:
                    ws = get_ws_broadcaster()
                    await ws.broadcast("simulation_status", self.get_status())
                except Exception:
                    pass

                # Pace the simulation loop: 1 tick every ~0.5 seconds
                await asyncio.sleep(0.5)

        except asyncio.CancelledError:
            pass
        finally:
            self._is_running = False
            self._stage = "COMPLETED"
            try:
                ws = get_ws_broadcaster()
                await ws.broadcast("simulation_status", self.get_status())
            except Exception:
                pass


# Global cyber range instance
cyber_range = CyberRangeManager()


def get_cyber_range() -> CyberRangeManager:
    return cyber_range
