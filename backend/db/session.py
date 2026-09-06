"""
MIRAGE Database Session & Initialization
Supports async SQLAlchemy with SQLite (local dev) and PostgreSQL (production).
Provides resilient fallback and automatic table creation + initial seed.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
from collections.abc import AsyncGenerator
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import select, func

from backend.core.config import get_settings
from backend.db.models import (
    Base,
    Host,
    ModelRegistry,
    AuditEvent,
    SimulationRun,
)

logger = logging.getLogger("mirage.db")

settings = get_settings()

# Engine creation with sensible connection limits
# If database_url starts with sqlite, we use standard sqlite connect_args
is_sqlite = "sqlite" in settings.database_url

connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args=connect_args,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI route handlers."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def compute_sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


async def init_db() -> None:
    """Initialize database tables and seed foundational data."""
    logger.info("Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default baseline hosts and models if empty
    async with async_session_factory() as session:
        result = await session.execute(select(func.count(Host.id)))
        host_count = result.scalar() or 0

        if host_count == 0:
            logger.info("Seeding initial network hosts and ML models...")
            now = datetime.now(timezone.utc)

            # 1. Seed Hosts
            seed_hosts = [
                Host(
                    ip_address="10.0.0.1",
                    hostname="border-gateway.corp.internal",
                    host_type="gateway",
                    is_internal=True,
                    baseline_status="established",
                    baseline_samples=14200,
                    first_seen=now,
                    last_seen=now,
                ),
                Host(
                    ip_address="10.0.0.10",
                    hostname="auth-dc01.corp.internal",
                    host_type="server",
                    is_internal=True,
                    baseline_status="established",
                    baseline_samples=25800,
                    first_seen=now,
                    last_seen=now,
                ),
                Host(
                    ip_address="10.0.0.21",
                    hostname="ws-engineering-04.corp.internal",
                    host_type="user",
                    is_internal=True,
                    baseline_status="established",
                    baseline_samples=8940,
                    first_seen=now,
                    last_seen=now,
                ),
                Host(
                    ip_address="10.0.0.31",
                    hostname="ws-finance-12.corp.internal",
                    host_type="user",
                    is_internal=True,
                    baseline_status="established",
                    baseline_samples=6200,
                    first_seen=now,
                    last_seen=now,
                ),
                Host(
                    ip_address="10.0.0.50",
                    hostname="unknown-threat-node",
                    host_type="attacker",
                    is_internal=False,
                    baseline_status="learning",
                    baseline_samples=120,
                    first_seen=now,
                    last_seen=now,
                ),
                Host(
                    ip_address="198.51.100.42",
                    hostname="external-c2-staging.net",
                    host_type="c2",
                    is_internal=False,
                    baseline_status="learning",
                    baseline_samples=45,
                    first_seen=now,
                    last_seen=now,
                ),
                Host(
                    ip_address="1.1.1.1",
                    hostname="cloudflare-dns",
                    host_type="dns",
                    is_internal=False,
                    baseline_status="established",
                    baseline_samples=41000,
                    first_seen=now,
                    last_seen=now,
                ),
            ]
            session.add_all(seed_hosts)

            # 2. Seed AI Detection Models
            seed_models = [
                ModelRegistry(
                    name="IsolationForest_NetAnomaly",
                    version="v1.4.2",
                    model_type="isolation_forest",
                    training_dataset="NTRO_Unidirectional_Benchmark_v1",
                    feature_version="fv3_temporal_fft",
                    precision=0.962,
                    recall=0.941,
                    f1_score=0.951,
                    status="active",
                ),
                ModelRegistry(
                    name="RandomForest_SignatureEnsemble",
                    version="v2.1.0",
                    model_type="random_forest",
                    training_dataset="NTRO_CyberRange_SyntheticFloods",
                    feature_version="fv3_temporal_fft",
                    precision=0.978,
                    recall=0.965,
                    f1_score=0.971,
                    status="active",
                ),
                ModelRegistry(
                    name="EWMA_AdaptiveBaseline",
                    version="v1.0.0",
                    model_type="ewma_stat",
                    training_dataset="Passive_Continuous_Stream",
                    feature_version="fv1_packet_flow",
                    precision=0.920,
                    recall=0.895,
                    f1_score=0.907,
                    status="active",
                ),
                ModelRegistry(
                    name="Entropy_DNSTunnel_Classifier",
                    version="v1.2.0",
                    model_type="shannon_entropy",
                    training_dataset="dnscat2_iodine_dga_corpus",
                    feature_version="fv2_dns_labels",
                    precision=0.985,
                    recall=0.970,
                    f1_score=0.977,
                    status="active",
                ),
            ]
            session.add_all(seed_models)

            # 3. Seed Blockchain Genesis Block for Audit Events
            genesis_meta = json.dumps({"description": "MIRAGE Secure Enclave Audit Chain Initialized"})
            genesis_prev = "0" * 64
            genesis_hash = compute_sha256(f"{now.isoformat()}|SYSTEM_BOOT|SYSTEM|{genesis_prev}|{genesis_meta}")
            genesis_audit = AuditEvent(
                timestamp=now,
                event_type="GENESIS_BLOCK",
                actor="SYSTEM",
                resource_type="ENCLAVE",
                resource_id="ENCLAVE_ROOT",
                action="INITIALIZE",
                metadata_json=genesis_meta,
                previous_hash=genesis_prev,
                event_hash=genesis_hash,
            )
            session.add(genesis_audit)

            await session.commit()
            logger.info("Database successfully seeded.")
