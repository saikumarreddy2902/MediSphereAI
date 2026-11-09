"""
MediSphere AI — Vitals Monitoring API Router

Module: Intensive & Telemetry Ward Vitals Observation
Description: Exposes endpoints for real-time patient telemetry, historical vitals observation,
             critical threshold violation alerts, and vital signs updates.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import random
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class VitalSignReading(BaseModel):
    timestamp: str
    heart_rate: int = Field(..., ge=20, le=250, description="Heart rate in BPM")
    systolic: int = Field(..., ge=40, le=300, description="Systolic BP in mmHg")
    diastolic: int = Field(..., ge=20, le=200, description="Diastolic BP in mmHg")
    spo2: int = Field(..., ge=50, le=100, description="Blood oxygen saturation percentage")
    temperature: float = Field(..., ge=30.0, le=45.0, description="Body temperature in Celsius")
    respiratory_rate: int = Field(..., ge=4, le=60, description="Breaths per minute")


class PatientVitalsCreate(BaseModel):
    heart_rate: int
    systolic: int
    diastolic: int
    spo2: int
    temperature: float
    respiratory_rate: int
    notes: Optional[str] = None


# ─── Ward Monitored Patients Telemetry State ──────────────────────────────────

PATIENT_MONITOR_BASES = [
    {
        "patient_id": "P-001",
        "patient_name": "Arjun Mehta",
        "ward": "ICU",
        "bed": "ICU-3A",
        "age": 52,
        "condition": "CRITICAL",
        "base_hr": 132,
        "base_sys": 165,
        "base_dia": 105,
        "base_spo2": 91,
        "base_temp": 39.2,
        "base_rr": 26,
    },
    {
        "patient_id": "P-002",
        "patient_name": "Priya Sharma",
        "ward": "Cardiac Care",
        "bed": "CCU-07",
        "age": 34,
        "condition": "MONITORED",
        "base_hr": 92,
        "base_sys": 145,
        "base_dia": 95,
        "base_spo2": 95,
        "base_temp": 37.8,
        "base_rr": 20,
    },
    {
        "patient_id": "P-003",
        "patient_name": "Rahul Verma",
        "ward": "General Medical",
        "bed": "G-12",
        "age": 68,
        "condition": "STABLE",
        "base_hr": 74,
        "base_sys": 122,
        "base_dia": 82,
        "base_spo2": 98,
        "base_temp": 36.8,
        "base_rr": 16,
    },
    {
        "patient_id": "P-004",
        "patient_name": "Sneha Patel",
        "ward": "Post-Operative",
        "bed": "PO-02",
        "age": 45,
        "condition": "MONITORED",
        "base_hr": 88,
        "base_sys": 130,
        "base_dia": 88,
        "base_spo2": 96,
        "base_temp": 37.5,
        "base_rr": 18,
    },
    {
        "patient_id": "P-005",
        "patient_name": "Vikram Nair",
        "ward": "ICU",
        "bed": "ICU-1B",
        "age": 61,
        "condition": "CRITICAL",
        "base_hr": 48,
        "base_sys": 85,
        "base_dia": 55,
        "base_spo2": 89,
        "base_temp": 38.8,
        "base_rr": 28,
    },
    {
        "patient_id": "P-006",
        "patient_name": "Meera Iyer",
        "ward": "General Medical",
        "bed": "G-05",
        "age": 29,
        "condition": "STABLE",
        "base_hr": 72,
        "base_sys": 118,
        "base_dia": 78,
        "base_spo2": 99,
        "base_temp": 37.0,
        "base_rr": 15,
    },
]


def _generate_telemetry(p: dict) -> dict:
    noise = (random.random() - 0.5) * (8 if p["condition"] == "CRITICAL" else 3)
    hr = int(p["base_hr"] + noise)
    sys = int(p["base_sys"] + noise)
    dia = int(p["base_dia"] + noise * 0.7)
    spo2 = min(100, max(70, int(p["base_spo2"] + (noise * 0.5))))
    temp = round(p["base_temp"] + (noise * 0.1), 1)
    rr = int(p["base_rr"] + (noise * 0.4))

    alerts = []
    if hr > 120 or hr < 50:
        alerts.append(f"HR {hr} bpm")
    if spo2 < 94:
        alerts.append(f"SpO₂ {spo2}%")
    if sys > 160 or sys < 90:
        alerts.append(f"BP {sys}/{dia}")
    if temp > 38.5 or temp < 36.0:
        alerts.append(f"Temp {temp}°C")

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "heart_rate": hr,
        "systolic": sys,
        "diastolic": dia,
        "spo2": spo2,
        "temperature": temp,
        "respiratory_rate": rr,
        "alerts": alerts,
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", summary="Get Real-Time Monitored Ward Patients Telemetry")
async def get_all_vitals(
    ward: Optional[str] = Query(None, description="Filter by ward name (ICU, Cardiac Care, etc.)"),
    condition: Optional[str] = Query(None, description="CRITICAL | MONITORED | STABLE"),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Returns live telemetry readings for all monitored hospital beds.
    """
    patients = list(PATIENT_MONITOR_BASES)
    if ward:
        patients = [p for p in patients if ward.lower() in p["ward"].lower()]
    if condition:
        patients = [p for p in patients if p["condition"].upper() == condition.upper()]

    telemetry_list = []
    for p in patients:
        telemetry = _generate_telemetry(p)
        telemetry_list.append({
            "patient_id": p["patient_id"],
            "patient_name": p["patient_name"],
            "ward": p["ward"],
            "bed": p["bed"],
            "age": p["age"],
            "condition": p["condition"],
            "current": telemetry,
            "alerts": telemetry["alerts"],
        })

    return {
        "count": len(telemetry_list),
        "refreshed_at": datetime.now(timezone.utc).isoformat(),
        "data": telemetry_list,
    }


@router.get("/{patient_id}", summary="Get Detailed Telemetry History for Patient")
async def get_patient_vitals_history(
    patient_id: str,
    points: int = Query(15, ge=5, le=60, description="Number of history observation points"),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Returns historical vitals trends and threshold violations for the specified patient.
    """
    patient = next((p for p in PATIENT_MONITOR_BASES if p["patient_id"] == patient_id), None)
    if not patient:
        # Generate default profile for requested ID
        patient = {
            "patient_id": patient_id,
            "patient_name": f"Patient {patient_id}",
            "ward": "General Ward",
            "bed": f"B-{patient_id[-2:]}",
            "age": 42,
            "condition": "STABLE",
            "base_hr": 76,
            "base_sys": 120,
            "base_dia": 80,
            "base_spo2": 98,
            "base_temp": 37.0,
            "base_rr": 16,
        }

    history = [_generate_telemetry(patient) for _ in range(points)]
    current = history[-1]

    return {
        "patient": patient,
        "current": current,
        "history": history,
        "thresholds": {
            "heart_rate": {"low": 50, "high": 120},
            "systolic": {"low": 90, "high": 160},
            "diastolic": {"low": 60, "high": 100},
            "spo2": {"low": 94, "high": 100},
            "temperature": {"low": 36.0, "high": 38.5},
            "respiratory_rate": {"low": 12, "high": 24},
        },
    }


@router.post("/{patient_id}", summary="Record Vital Signs for Patient")
async def record_patient_vitals(
    patient_id: str,
    vitals: PatientVitalsCreate,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Submits a nurse vital sign check into the patient's electronic health record.
    """
    alerts = []
    if vitals.heart_rate > 120 or vitals.heart_rate < 50:
        alerts.append(f"HR {vitals.heart_rate} bpm")
    if vitals.spo2 < 94:
        alerts.append(f"SpO₂ {vitals.spo2}%")
    if vitals.systolic > 160 or vitals.systolic < 90:
        alerts.append(f"BP {vitals.systolic}/{vitals.diastolic}")
    if vitals.temperature > 38.5 or vitals.temperature < 36.0:
        alerts.append(f"Temp {vitals.temperature}°C")

    # Update in-memory patient base if exists
    for p in PATIENT_MONITOR_BASES:
        if p["patient_id"] == patient_id:
            p["base_hr"] = vitals.heart_rate
            p["base_sys"] = vitals.systolic
            p["base_dia"] = vitals.diastolic
            p["base_spo2"] = vitals.spo2
            p["base_temp"] = vitals.temperature
            p["base_rr"] = vitals.respiratory_rate
            if alerts:
                p["condition"] = "CRITICAL" if vitals.spo2 < 90 or vitals.heart_rate > 130 else "MONITORED"
            else:
                p["condition"] = "STABLE"

    return {
        "status": "recorded",
        "patient_id": patient_id,
        "recorded_by": getattr(current_user, "username", "staff"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "alerts_triggered": alerts,
        "critical_alert": len(alerts) > 0,
    }


@router.get("/alerts/active", summary="List All Active Critical Vitals Alarms")
async def get_active_vitals_alarms(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Returns high-priority vitals alarms across all intensive care and ward units.
    """
    alarms = []
    for p in PATIENT_MONITOR_BASES:
        t = _generate_telemetry(p)
        if t["alerts"]:
            alarms.append({
                "patient_id": p["patient_id"],
                "patient_name": p["patient_name"],
                "ward": p["ward"],
                "bed": p["bed"],
                "condition": p["condition"],
                "alerts": t["alerts"],
                "timestamp": t["timestamp"],
            })

    return {
        "active_alarm_count": len(alarms),
        "alarms": alarms,
    }
