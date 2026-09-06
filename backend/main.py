"""
MIRAGE Backend Application Entry Point
Multi-resolution Intelligent Risk & Adaptive Graph Engine
Problem Statement ID: 26145 · NTRO

Runs FastAPI ASGI server with security headers, CORS policy,
async lifespan manager (starts passive sensor, initializes DB tables),
REST API endpoints, and live WebSocket feed.
"""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api.routes import router as api_router
from backend.api.websocket import get_ws_broadcaster
from backend.core.config import get_settings
from backend.db.session import init_db
from backend.ingestion.sensor import get_sensor_enclave

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("mirage.main")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup & shutdown events."""
    logger.info(f"Booting {settings.app_name} v{settings.app_version}...")

    # 1. Initialize DB schema and foundational seeds
    try:
        await init_db()
    except Exception as e:
        logger.warning(f"DB auto-init encountered notice (continuing with in-memory resilient state): {e}")

    # 2. Wire up WebSocket broadcaster to Passive Sensor
    sensor = get_sensor_enclave()
    ws_mgr = get_ws_broadcaster()
    sensor.set_ws_broadcaster(ws_mgr.broadcast)

    # 3. Start Passive Sensor Enclave loop
    await sensor.start()

    yield

    # Shutdown
    logger.info("Gracefully stopping MIRAGE Passive Sensor...")
    await sensor.stop()


app = FastAPI(
    title="MIRAGE Intelligence API",
    description="Multi-resolution Intelligent Risk & Adaptive Graph Engine — NTRO Unidirectional IP Detection",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security Response Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    )
    return response


# Include API Routes
app.include_router(api_router)


# WebSocket Route for Live Telemetry
@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket) -> None:
    ws_mgr = get_ws_broadcaster()
    await ws_mgr.connect(websocket)
    try:
        while True:
            # Keep-alive receive loop
            data = await websocket.receive_text()
            # Optionally handle client heartbeats
            if data == "ping":
                await websocket.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        ws_mgr.disconnect(websocket)
    except Exception as e:
        logger.debug(f"WS error: {e}")
        ws_mgr.disconnect(websocket)


@app.get("/")
async def root_status() -> dict[str, str]:
    return {
        "status": "ONLINE",
        "service": "MIRAGE Secure Monitoring Enclave",
        "version": "1.0.0",
        "diode_isolation": "HARDWARE_SIMULATED_ENFORCED",
        "theme": "Blockchain & Cybersecurity",
    }
