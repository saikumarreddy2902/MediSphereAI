"""
MediSphere AI — WebSocket Real-Time Dashboard Telemetry

Pushes live hospital metrics to connected frontend clients every 5 seconds.
"""
import asyncio
import json
from datetime import datetime
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.models.operations import Bed, EmergencyCase
from app.models.hospital import Patient

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections with broadcast support."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        payload = json.dumps(message)
        dead = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead.add(connection)
        self.active_connections -= dead


manager = ConnectionManager()


async def _collect_telemetry() -> dict:
    """Gather live hospital metrics from MongoDB for a telemetry snapshot."""
    try:
        total_beds = await Bed.count()
        occupied_beds = await Bed.find({"status": "OCCUPIED"}).count()
        available_beds = await Bed.find({"status": "AVAILABLE"}).count()
        maintenance_beds = await Bed.find({"status": "MAINTENANCE"}).count()

        active_emergency = await EmergencyCase.find(
            {"case_status": {"$in": ["ACTIVE", "CRITICAL"]}}
        ).count()
        critical_emergency = await EmergencyCase.find(
            {"severity": "CRITICAL", "case_status": {"$ne": "RESOLVED"}}
        ).count()

        total_patients = await Patient.count()

        occupancy_rate = round((occupied_beds / total_beds * 100), 1) if total_beds else 0.0

        return {
            "type": "telemetry",
            "timestamp": datetime.utcnow().isoformat(),
            "beds": {
                "total": total_beds,
                "occupied": occupied_beds,
                "available": available_beds,
                "maintenance": maintenance_beds,
                "occupancy_rate": occupancy_rate,
            },
            "emergency": {
                "active_cases": active_emergency,
                "critical_cases": critical_emergency,
            },
            "patients": {
                "total": total_patients,
            },
        }
    except Exception as e:
        return {
            "type": "telemetry",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
        }


@router.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time dashboard telemetry.

    Clients connect and receive a live JSON snapshot every 5 seconds:
    - Bed occupancy stats (total / occupied / available / rate)
    - Emergency case counts (active / critical)
    - Total patient count

    The connection stays open until the client disconnects.
    """
    await manager.connect(websocket)
    try:
        # Send an immediate snapshot on connect
        snapshot = await _collect_telemetry()
        await websocket.send_text(json.dumps(snapshot))

        # Loop: push updates every 5 seconds
        while True:
            await asyncio.sleep(5)
            snapshot = await _collect_telemetry()
            await websocket.send_text(json.dumps(snapshot))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
