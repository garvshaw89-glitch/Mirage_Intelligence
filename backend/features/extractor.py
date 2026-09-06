"""
MIRAGE Multi-Resolution Feature Extraction Engine
Extracts packet-level, connection-level, session-level, and DNS-level features
over rolling behavioral time windows.
"""
from __future__ import annotations

import math
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from backend.ingestion.tap import RawPacketRecord


def calculate_shannon_entropy(text: str) -> float:
    """Calculates Shannon entropy in bits for string characters."""
    if not text:
        return 0.0
    freq = defaultdict(int)
    for char in text:
        freq[char] += 1
    length = len(text)
    entropy = 0.0
    for count in freq.values():
        p = count / length
        entropy -= p * math.log2(p)
    return entropy


@dataclass
class HostWindowStats:
    window_start: float
    window_end: float
    packets: int = 0
    bytes: int = 0
    syn_count: int = 0
    ack_count: int = 0
    udp_count: int = 0
    packet_sizes: list[int] = field(default_factory=list)
    ttls: list[int] = field(default_factory=list)
    dst_ips: set[str] = field(default_factory=set)
    dst_ports: set[int] = field(default_factory=set)
    dns_queries: list[str] = field(default_factory=list)
    timestamps: list[float] = field(default_factory=list)


@dataclass
class ConnectionSessionState:
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    start_time: float
    last_seen: float
    packet_count: int = 0
    byte_count: int = 0
    syn_seen: bool = False
    ack_seen: bool = False
    fin_or_rst_seen: bool = False
    inter_arrivals: list[float] = field(default_factory=list)


class FeatureExtractor:
    """
    Maintains sliding state and extracts comprehensive telemetry feature vectors.
    """

    def __init__(self, window_seconds: float = 2.0) -> None:
        self.window_seconds = window_seconds
        self._host_windows: dict[str, deque[RawPacketRecord]] = defaultdict(deque)
        self._active_sessions: dict[tuple[str, str, int, int, str], ConnectionSessionState] = {}

    def ingest_packet(self, packet: RawPacketRecord) -> None:
        """Adds a packet to sliding window buffers."""
        src_ip = packet.src_ip
        queue = self._host_windows[src_ip]
        queue.append(packet)

        # Evict packets older than window_seconds
        cutoff = packet.timestamp - self.window_seconds
        while queue and queue[0].timestamp < cutoff:
            queue.popleft()

        # Update session tracking
        sess_key = (packet.src_ip, packet.dst_ip, packet.src_port, packet.dst_port, packet.protocol)
        now = packet.timestamp
        if sess_key not in self._active_sessions:
            self._active_sessions[sess_key] = ConnectionSessionState(
                src_ip=packet.src_ip,
                dst_ip=packet.dst_ip,
                src_port=packet.src_port,
                dst_port=packet.dst_port,
                protocol=packet.protocol,
                start_time=now,
                last_seen=now,
            )

        sess = self._active_sessions[sess_key]
        delta = now - sess.last_seen
        if delta > 0:
            sess.inter_arrivals.append(delta)
            if len(sess.inter_arrivals) > 50:
                sess.inter_arrivals.pop(0)

        sess.last_seen = now
        sess.packet_count += 1
        sess.byte_count += packet.packet_size
        if "SYN" in packet.tcp_flags:
            sess.syn_seen = True
        if "ACK" in packet.tcp_flags:
            sess.ack_seen = True
        if "FIN" in packet.tcp_flags or "RST" in packet.tcp_flags:
            sess.fin_or_rst_seen = True

    def extract_host_features(self, host_ip: str, now: float | None = None) -> dict[str, Any]:
        """
        Computes the consolidated feature vector for a host over the current window.
        """
        queue = self._host_windows.get(host_ip)
        if not queue:
            return {}

        now = now or queue[-1].timestamp
        count = len(queue)
        duration = max(0.1, self.window_seconds)

        packets_per_sec = count / duration
        total_bytes = sum(p.packet_size for p in queue)
        bytes_per_sec = total_bytes / duration

        syn_count = sum(1 for p in queue if "SYN" in p.tcp_flags and "ACK" not in p.tcp_flags)
        ack_count = sum(1 for p in queue if "ACK" in p.tcp_flags)
        syn_rate = syn_count / duration
        ack_rate = ack_count / duration
        syn_ack_ratio = (syn_count / max(1, ack_count)) if ack_count > 0 else (float(syn_count) if syn_count > 0 else 0.0)

        udp_count = sum(1 for p in queue if p.protocol == "UDP")
        udp_rate = udp_count / duration

        # Packet size stats
        sizes = [p.packet_size for p in queue]
        size_mean = sum(sizes) / count if count else 0.0
        size_var = sum((s - size_mean) ** 2 for s in sizes) / count if count > 1 else 0.0
        size_stddev = math.sqrt(size_var)

        # Entropy of packet sizes
        size_freq = defaultdict(int)
        for s in sizes:
            size_freq[s] += 1
        size_entropy = 0.0
        for c in size_freq.values():
            p = c / count
            size_entropy -= p * math.log2(p)

        # TTL stats
        ttls = [p.ttl for p in queue]
        ttl_mean = sum(ttls) / count if count else 64.0
        ttl_entropy = calculate_shannon_entropy("".join(str(t) for t in ttls[:100]))

        # Connection & Session Stats
        active_for_host = [
            s for k, s in self._active_sessions.items()
            if s.src_ip == host_ip and (now - s.last_seen) < 60.0
        ]
        concurrent_connections = len(active_for_host)
        half_open = sum(1 for s in active_for_host if s.syn_seen and not s.ack_seen and not s.fin_or_rst_seen)
        incomplete_rate = (half_open / max(1, concurrent_connections)) if concurrent_connections else 0.0

        # Timing analysis / Periodicity (for C2 beaconing)
        all_deltas: list[float] = []
        for s in active_for_host:
            all_deltas.extend(s.inter_arrivals)

        inter_arrival_mean = 0.0
        inter_arrival_stddev = 0.0
        inter_arrival_cv = 1.0
        periodicity_score = 0.0

        if len(all_deltas) >= 4:
            inter_arrival_mean = sum(all_deltas) / len(all_deltas)
            if inter_arrival_mean > 0.001:
                var = sum((d - inter_arrival_mean) ** 2 for d in all_deltas) / len(all_deltas)
                inter_arrival_stddev = math.sqrt(var)
                inter_arrival_cv = inter_arrival_stddev / inter_arrival_mean
                # Periodicity score: CV near 0 means extremely regular intervals (e.g., CV < 0.15 => > 0.8 score)
                periodicity_score = max(0.0, min(1.0, 1.0 - (inter_arrival_cv / 0.5)))

        # DNS features
        dns_packets = [p for p in queue if p.dns_query]
        dns_query_len_mean = 0.0
        dns_entropy = 0.0
        unique_subdomain_ratio = 0.0

        if dns_packets:
            lengths = [len(p.dns_query) for p in dns_packets]
            dns_query_len_mean = sum(lengths) / len(lengths)
            dns_entropy = sum(calculate_shannon_entropy(p.dns_query) for p in dns_packets) / len(dns_packets)
            unique_domains = {p.dns_query for p in dns_packets}
            unique_subdomain_ratio = len(unique_domains) / len(dns_packets)

        # Destination rarity & frequency
        dst_set = {p.dst_ip for p in queue}
        destination_rarity = min(1.0, len(dst_set) / max(1, count))

        return {
            "host_ip": host_ip,
            "window_duration": duration,
            "packets_per_sec": round(packets_per_sec, 2),
            "bytes_per_sec": round(bytes_per_sec, 2),
            "syn_rate": round(syn_rate, 2),
            "ack_rate": round(ack_rate, 2),
            "syn_ack_ratio": round(syn_ack_ratio, 2),
            "udp_rate": round(udp_rate, 2),
            "packet_size_mean": round(size_mean, 2),
            "packet_size_stddev": round(size_stddev, 2),
            "packet_size_entropy": round(size_entropy, 3),
            "ttl_mean": round(ttl_mean, 1),
            "ttl_entropy": round(ttl_entropy, 3),
            "concurrent_connections": concurrent_connections,
            "half_open_connections": half_open,
            "incomplete_connection_rate": round(incomplete_rate, 3),
            "inter_arrival_mean": round(inter_arrival_mean, 4),
            "inter_arrival_stddev": round(inter_arrival_stddev, 4),
            "inter_arrival_cv": round(inter_arrival_cv, 4),
            "periodicity_score": round(periodicity_score, 3),
            "dns_query_len_mean": round(dns_query_len_mean, 2),
            "dns_entropy": round(dns_entropy, 3),
            "unique_subdomain_ratio": round(unique_subdomain_ratio, 3),
            "destination_rarity": round(destination_rarity, 3),
        }
