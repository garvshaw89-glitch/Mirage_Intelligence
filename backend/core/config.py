"""
MIRAGE Core Configuration
Manages all settings via environment variables.
Never exposes secrets.
"""
from __future__ import annotations

import os
import secrets
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "MIRAGE"
    app_version: str = "1.0.0"
    environment: Literal["development", "production", "test"] = "development"
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1

    # Security
    secret_key: str = secrets.token_urlsafe(32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    cors_allow_credentials: bool = True

    # Rate limiting
    rate_limit_default: str = "100/minute"
    rate_limit_simulation: str = "10/minute"
    rate_limit_websocket: int = 50  # max concurrent WS connections

    # Database
    database_url: str = "sqlite+aiosqlite:///./mirage.db"

    # Demo credentials (change in production)
    demo_username: str = "analyst"
    demo_password: str = "changeme-in-production"

    # Detection thresholds
    syn_flood_threshold: float = 500.0       # SYN packets/sec
    udp_flood_threshold: float = 1000.0      # UDP packets/sec
    slowloris_connection_threshold: int = 50  # half-open connections
    c2_periodicity_threshold: float = 0.7    # periodicity score (0-1)
    c2_min_observations: int = 5             # minimum intervals before C2 alert
    dns_entropy_threshold: float = 3.5       # Shannon entropy
    baseline_warmup_samples: int = 30        # samples before trusting baseline
    baseline_alert_sigma: float = 4.0        # std devs for baseline anomaly

    # Risk engine
    risk_decay_rate: float = 0.95            # per-second decay multiplier
    risk_max: float = 100.0
    risk_min: float = 0.0

    # Ingestion limits
    pcap_max_size_bytes: int = 50 * 1024 * 1024   # 50 MB
    pcap_max_packets: int = 100_000
    pcap_processing_timeout_seconds: int = 30
    packet_queue_maxsize: int = 10_000

    # Simulation
    simulation_max_duration_seconds: int = 300
    simulation_allowed_scenarios: list[str] = [
        "NORMAL",
        "SYN_FLOOD",
        "UDP_FLOOD",
        "SLOWLORIS",
        "DNS_TUNNEL",
        "DGA",
        "C2_BEACON",
        "MULTI_HOST_CAMPAIGN",
    ]

    # WebSocket
    websocket_max_connections: int = 50
    websocket_queue_maxsize: int = 1000
    websocket_ping_interval: int = 30


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
