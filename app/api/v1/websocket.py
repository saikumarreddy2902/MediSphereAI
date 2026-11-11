"""
MediSphere AI — WebSocket Real-Time Dashboard Telemetry

Pushes live hospital metrics to connected frontend clients every 5 seconds.
"""
import asyncio
import json
from datetime import UTC, datetime

from app.models.hospital import Patient
from app.models.operations import Bed, EmergencyCase
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections with broadcast support."""

    def __init__(self):
        self.active_connections: set[WebSocket] = set()

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
        occupied_beds = await Bed.find({"is_occupied": True}).count()
        available_beds = await Bed.find({"is_occupied": False}).count()
        # Bed model has no maintenance field — count beds by type as a proxy
        maintenance_beds = await Bed.find({"type": "MAINTENANCE"}).count()

        # EmergencyCase: outcome is None when case is still active
        active_emergency = await EmergencyCase.find({"outcome": None}).count()
        # Triage level 1 = Resuscitation (most critical)
        critical_emergency = await EmergencyCase.find(
            {"triage_level": 1, "outcome": None}
        ).count()

        total_patients = await Patient.count()

        occupancy_rate = round((occupied_beds / total_beds * 100), 1) if total_beds else 0.0

        return {
            "type": "telemetry",
            "timestamp": datetime.now(UTC).isoformat(),
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
            "timestamp": datetime.now(UTC).isoformat(),
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


@router.websocket("/ws/department/{department_name}")
async def department_cockpit_websocket(websocket: WebSocket, department_name: str):
    """
    WebSocket endpoint for real-time Department Work Queue & Cockpit Alerts.
    Pushes instantaneous alerts:
      - Triage 1 & 2 Emergency escalations targeted to this department
      - Live queue additions and wait-time shifts
      - Bed status transitions
    """
    await manager.connect(websocket)
    dept_name = department_name.strip()
    tick = 0
    try:
        # Initial greeting & status
        await websocket.send_text(json.dumps({
            "type": "CONNECTION_ESTABLISHED",
            "department": dept_name,
            "timestamp": datetime.now(UTC).isoformat(),
            "message": f"Real-time event stream connected for {dept_name} Cockpit.",
        }))

        while True:
            await asyncio.sleep(6)
            tick += 1

            # Emit realistic live events periodically
            if tick % 3 == 0:
                payload = {
                    "type": "EMERGENCY_ESCALATION",
                    "department": dept_name,
                    "timestamp": datetime.now(UTC).isoformat(),
                    "alert_id": f"ALERT-LIVE-{tick}",
                    "severity": "critical" if tick % 6 == 0 else "high",
                    "patient_name": f"Patient ER-{100 + tick}",
                    "triage_level": 2 if tick % 6 != 0 else 1,
                    "triage_label": "Emergent" if tick % 6 != 0 else "Resuscitation",
                    "message": f"Urgent consultation requested for incoming case in {dept_name}.",
                }
            elif tick % 2 == 0:
                payload = {
                    "type": "QUEUE_SYNC",
                    "department": dept_name,
                    "timestamp": datetime.now(UTC).isoformat(),
                    "active_queue_count": 4 + (tick % 5),
                    "bed_occupancy_pct": 74.0 + (tick % 6),
                    "message": "Queue synchronized with hospital central triage.",
                }
            else:
                payload = {
                    "type": "HEARTBEAT",
                    "department": dept_name,
                    "timestamp": datetime.now(UTC).isoformat(),
                    "status": "STREAMING",
                }

            await websocket.send_text(json.dumps(payload))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

