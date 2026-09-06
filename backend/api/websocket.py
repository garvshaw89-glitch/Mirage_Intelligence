"""
MIRAGE Real-Time WebSocket Manager
Multi-resolution Intelligent Risk & Adaptive Graph Engine
"""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("mirage.ws")


class WebSocketBroadcaster:
    def __init__(self) -> None:
        self._active_connections: set[WebSocket] = set()

    @property
    def client_count(self) -> int:
        return len(self._active_connections)

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Active: {len(self._active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        self._active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Active: {len(self._active_connections)}")

    async def broadcast(self, event_type: str, data: dict[str, Any]) -> None:
        if not self._active_connections:
            return

        message = json.dumps({
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": data,
        })

        dead_connections = set()
        for ws in self._active_connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead_connections.add(ws)

        for ws in dead_connections:
            self.disconnect(ws)


ws_broadcaster = WebSocketBroadcaster()


def get_ws_broadcaster() -> WebSocketBroadcaster:
    return ws_broadcaster
