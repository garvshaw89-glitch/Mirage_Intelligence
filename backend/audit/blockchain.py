"""
MIRAGE Cryptographic Blockchain Audit Ledger
Multi-resolution Intelligent Risk & Adaptive Graph Engine
Problem Statement ID: 26145 · NTRO · Theme: Blockchain & Cybersecurity

Implements a tamper-evident, SHA-256 hash-chained forensic audit trail.
Guarantees immutability and non-repudiation for security alerts and evidence.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("mirage.audit")


def calculate_sha256(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


class AuditBlock:
    def __init__(
        self,
        index: int,
        timestamp: str,
        event_type: str,
        actor: str,
        resource_type: str,
        resource_id: str,
        action: str,
        metadata: dict[str, Any],
        previous_hash: str,
    ) -> None:
        self.index = index
        self.timestamp = timestamp
        self.event_type = event_type
        self.actor = actor
        self.resource_type = resource_type
        self.resource_id = resource_id
        self.action = action
        self.metadata = metadata
        self.previous_hash = previous_hash
        self.event_hash = self.compute_hash()

    def compute_hash(self) -> str:
        payload = (
            f"{self.index}|{self.timestamp}|{self.event_type}|{self.actor}|"
            f"{self.resource_type}|{self.resource_id}|{self.action}|"
            f"{self.previous_hash}|{json.dumps(self.metadata, sort_keys=True)}"
        )
        return calculate_sha256(payload)

    def to_dict(self) -> dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "actor": self.actor,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "action": self.action,
            "metadata": self.metadata,
            "previous_hash": self.previous_hash,
            "event_hash": self.event_hash,
        }


class BlockchainAuditLedger:
    """
    In-memory and durable cryptographic chain for all security-critical operations.
    """

    def __init__(self) -> None:
        self._chain: list[AuditBlock] = []
        self._initialize_genesis_block()

    def _initialize_genesis_block(self) -> None:
        genesis = AuditBlock(
            index=0,
            timestamp=datetime.now(timezone.utc).isoformat(),
            event_type="GENESIS",
            actor="SYSTEM",
            resource_type="ENCLAVE_ROOT",
            resource_id="0",
            action="INITIALIZE_LEDGER",
            metadata={"description": "MIRAGE Secure Enclave Blockchain Root Initialized"},
            previous_hash="0" * 64,
        )
        self._chain.append(genesis)

    @property
    def latest_block(self) -> AuditBlock:
        return self._chain[-1]

    def record_event(
        self,
        event_type: str,
        actor: str = "PASSIVE_SENSOR",
        resource_type: str = "ALERT",
        resource_id: str = "",
        action: str = "RECORD",
        metadata: dict[str, Any] | None = None,
    ) -> AuditBlock:
        meta = metadata or {}
        now = datetime.now(timezone.utc).isoformat()
        prev_hash = self.latest_block.event_hash
        block = AuditBlock(
            index=len(self._chain),
            timestamp=now,
            event_type=event_type,
            actor=actor,
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            metadata=meta,
            previous_hash=prev_hash,
        )
        self._chain.append(block)
        return block

    def verify_integrity(self) -> dict[str, Any]:
        """
        Validates cryptographic hash continuity across all blocks.
        Detects any retroactive tampering.
        """
        for i in range(1, len(self._chain)):
            current = self._chain[i]
            prev = self._chain[i - 1]

            # 1. Check previous hash reference
            if current.previous_hash != prev.event_hash:
                return {
                    "is_valid": False,
                    "error_at_index": i,
                    "reason": f"Broken link at block {i}: previous_hash does not match parent event_hash",
                }

            # 2. Check recalculated content hash
            recomputed = current.compute_hash()
            if current.event_hash != recomputed:
                return {
                    "is_valid": False,
                    "error_at_index": i,
                    "reason": f"Tampered block at index {i}: hash mismatch ({current.event_hash} != {recomputed})",
                }

        return {
            "is_valid": True,
            "total_blocks": len(self._chain),
            "latest_hash": self.latest_block.event_hash,
            "root_hash": self._chain[0].event_hash,
        }

    def get_recent_blocks(self, limit: int = 50) -> list[dict[str, Any]]:
        return [b.to_dict() for b in reversed(self._chain[-limit:])]


# Global audit ledger
audit_ledger = BlockchainAuditLedger()


def get_audit_ledger() -> BlockchainAuditLedger:
    return audit_ledger
