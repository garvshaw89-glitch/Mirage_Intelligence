"""
MIRAGE Attack Campaign Correlation & Temporal Graph Engine
Correlates multi-host threats, shared infrastructure, and stage progression
into interactive temporal attack graphs.
"""
from __future__ import annotations

import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from backend.api.schemas import Severity, ThreatType


class CampaignCorrelationEngine:
    """
    Maintains graph topologies of active campaigns, linking suspicious hosts,
    external infrastructure, and correlated alerts.
    """

    def __init__(self) -> None:
        self._campaigns: dict[str, dict[str, Any]] = {}
        self._host_campaign_map: dict[str, str] = {}  # host_ip -> campaign_id

    def is_host_in_campaign(self, host_ip: str) -> bool:
        return host_ip in self._host_campaign_map

    def process_alert(
        self,
        alert_id: str,
        host_ip: str,
        dst_ip: str | None,
        threat_type: ThreatType,
        severity: Severity,
        risk_score: float,
    ) -> str | None:
        """
        Correlates an incoming alert into an existing or new campaign.
        Returns the campaign_id if correlated.
        """
        now_dt = datetime.now(timezone.utc)
        now_iso = now_dt.isoformat()

        # Find existing campaign by shared destination or active host
        campaign_id = self._host_campaign_map.get(host_ip)

        if not campaign_id and dst_ip:
            # Check if another campaign targets this destination
            for c_id, c_data in self._campaigns.items():
                if dst_ip in c_data.get("shared_destinations", []):
                    campaign_id = c_id
                    break

        # If C2 beacon or multi-host threat and no campaign, instantiate one
        if not campaign_id and threat_type in (
            ThreatType.C2_BEACON,
            ThreatType.MULTI_HOST_CAMPAIGN,
            ThreatType.SYN_FLOOD,
            ThreatType.DNS_TUNNEL,
        ):
            campaign_id = str(uuid.uuid4())
            c_name = f"CAMPAIGN-{threat_type.value}-{campaign_id[:6].upper()}"
            self._campaigns[campaign_id] = {
                "id": campaign_id,
                "title": c_name,
                "description": f"Coordinated {threat_type.value} operation identified across network enclave.",
                "start_time": now_iso,
                "last_updated": now_iso,
                "host_count": 0,
                "event_count": 0,
                "threat_types": [threat_type.value],
                "severity": severity.value,
                "risk_score": risk_score,
                "is_active": True,
                "shared_destinations": [dst_ip] if dst_ip else [],
                "nodes": [],
                "edges": [],
            }

        if campaign_id:
            c = self._campaigns[campaign_id]
            c["last_updated"] = now_iso
            c["event_count"] += 1
            c["risk_score"] = max(c["risk_score"], risk_score)
            if threat_type.value not in c["threat_types"]:
                c["threat_types"].append(threat_type.value)
            if dst_ip and dst_ip not in c["shared_destinations"]:
                c["shared_destinations"].append(dst_ip)

            self._host_campaign_map[host_ip] = campaign_id

            # Update Graph Nodes
            node_ids = {n["id"] for n in c["nodes"]}
            if host_ip not in node_ids:
                c["nodes"].append({
                    "id": host_ip,
                    "type": "host",
                    "label": f"Infected ({host_ip})",
                    "risk_score": risk_score,
                })
                c["host_count"] = len([n for n in c["nodes"] if n["type"] == "host"])

            if dst_ip and dst_ip not in node_ids:
                node_type = "c2" if threat_type == ThreatType.C2_BEACON else "server"
                c["nodes"].append({
                    "id": dst_ip,
                    "type": node_type,
                    "label": f"Endpoint ({dst_ip})",
                    "risk_score": 90.0 if node_type == "c2" else 40.0,
                })

            # Update Graph Edges
            if dst_ip:
                edge_id = f"{host_ip}->{dst_ip}"
                if not any(e["id"] == edge_id for e in c["edges"]):
                    c["edges"].append({
                        "id": edge_id,
                        "source": host_ip,
                        "target": dst_ip,
                        "relationship": "COMMUNICATES_WITH" if threat_type != ThreatType.C2_BEACON else "BEACONS_TO",
                    })

            # Alert node
            alert_node_id = f"alert-{alert_id[:8]}"
            if alert_node_id not in node_ids:
                c["nodes"].append({
                    "id": alert_node_id,
                    "type": "alert",
                    "label": threat_type.value,
                    "risk_score": risk_score,
                })
                c["edges"].append({
                    "id": f"{host_ip}->{alert_node_id}",
                    "source": host_ip,
                    "target": alert_node_id,
                    "relationship": "TRIGGERED",
                })

        return campaign_id

    def get_campaign(self, campaign_id: str) -> dict[str, Any] | None:
        return self._campaigns.get(campaign_id)

    def get_all_campaigns(self) -> list[dict[str, Any]]:
        return list(self._campaigns.values())
