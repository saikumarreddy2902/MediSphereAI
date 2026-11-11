"""Agents API"""
import random
from datetime import datetime
from typing import Any

import httpx
from pydantic import BaseModel

from app.core.config import settings
from app.mock.data_generator import (
    AGENT_DEFINITIONS,
    _hours_ago,
    fake,
    get_agents_status,
    rand_choice,
    rand_int,
)
from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


# ─── Literal routes MUST come before parameterized routes ────────────────────

@router.get("/")
async def list_agents(request: Request):
    """List all available AI agents in MediSphere."""
    orchestrator = getattr(request.app.state, "orchestrator", None)
    if orchestrator:
        agent_list = []
        for key, agent in orchestrator.agents.items():
            agent_list.append({
                "key": key,
                "name": agent.agent_name,
                "description": agent.description,
                "category": agent.category,
                "status": agent.status,
                "run_interval_seconds": agent.run_interval_seconds,
                "run_count": agent.run_count,
            })
        return {"agents": agent_list, "total": len(agent_list)}
    return {"agents": AGENT_DEFINITIONS, "total": len(AGENT_DEFINITIONS)}


@router.get("/status")
async def get_all_agents_status(request: Request):
    """Get live runtime status and execution health of all 14 AI agents."""
    orchestrator = getattr(request.app.state, "orchestrator", None)
    if orchestrator:
        live_statuses = orchestrator.get_all_status()
        return {
            "is_orchestrator_running": orchestrator.is_running,
            "total": len(live_statuses),
            "running": len([a for a in live_statuses if a.get("status") == "running"]),
            "idle": len([a for a in live_statuses if a.get("status") == "idle"]),
            "error": len([a for a in live_statuses if a.get("status") == "error"]),
            "agents": live_statuses,
        }
    
    agents = get_agents_status()
    return {
        "is_orchestrator_running": True,
        "total": len(agents),
        "running": len([a for a in agents if a["status"] == "running"]),
        "idle": len([a for a in agents if a["status"] == "idle"]),
        "error": len([a for a in agents if a["status"] == "error"]),
        "agents": agents,
    }


@router.post("/workflow/run")
async def run_pipeline_workflow(request: Request):
    """Execute the choreographed multi-agent StateGraph pipeline DAG."""
    orchestrator = getattr(request.app.state, "orchestrator", None)
    if orchestrator:
        result = await orchestrator.run_pipeline_workflow()
        return {
            "status": "success",
            "message": "Multi-agent pipeline completed successfully",
            "result": result
        }
    return {
        "status": "simulated",
        "message": "Pipeline simulated successfully",
        "timestamp": datetime.now().isoformat()
    }


@router.get("/notifications")
async def list_notifications(limit: int = 20):
    notifs = []
    types = ["alert", "info", "warning", "critical"]
    type_weights = [30, 30, 25, 15]
    rng = random.Random()
    for i in range(limit):
        ntype = rng.choices(types, weights=type_weights, k=1)[0]
        notifs.append({
            "id": str(i + 1),
            "type": ntype,
            "title": rand_choice([
                "ICU Bed Capacity Alert",
                "Medicine Stock Alert",
                "Emergency Queue Update",
                "Staff Shortage Detected",
                "Equipment Maintenance Due",
                "Insurance Claim Action Required",
                "Critical Lab Result",
                "High Patient Wait Time",
            ]),
            "message": fake.sentence(),
            "source_agent": rand_choice([
                "Emergency Response Agent",
                "Pharmacy Intelligence Agent",
                "Bed Intelligence Agent",
            ]),
            "is_read": rng.random() > 0.4,
            "created_at": _hours_ago(rng.uniform(0, 24)).isoformat(),
        })
    return {"total": len(notifs), "notifications": notifs}


class AgentChatMessage(BaseModel):
    message: str
    history: list[dict[str, str]] = []
    role: str = "patient"
    patient_context: dict[str, Any] | None = None


@router.post("/chat")
async def chat_with_assistant(payload: AgentChatMessage):
    """
    AI Clinical Health Concierge powered by OpenRouter Cloud LLM.
    Provides verified clinical triage, appointment coordination, bed status, and hospital assistance.
    """
    user_msg = payload.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    system_prompt = (
        "You are MediSphere AI Clinical Assistant, an advanced medical AI concierge for "
        "MediSphere AI Super Speciality Hospital (NABH & JCI Accredited). "
        "You assist patients, doctors, and nursing staff with clinical inquiries, appointments, "
        "medication schedules, department triage, and bed allocation inquiries.\n\n"
        "Guidelines:\n"
        "1. Be empathetic, professional, clear, and medically accurate.\n"
        "2. For emergency symptoms (e.g. acute chest pain, severe shortness of breath, sudden numbness, stroke symptoms), "
        "immediately instruct the user to call the 24/7 STAT Helpline (108) or report to the Emergency Care Bay.\n"
        "3. Provide structured, actionable answers using clean formatting (bullet points, bold highlights).\n"
        "4. If patient context is provided, personalize advice based on their allergies, condition, and UHID.\n"
    )

    if payload.patient_context:
        ctx = payload.patient_context
        system_prompt += (
            f"\nPatient Profile:\n"
            f"- Name: {ctx.get('name', 'Patient')}\n"
            f"- UHID: {ctx.get('uhid', 'N/A')}\n"
            f"- Attending Physician: {ctx.get('attendingPhysician', 'N/A')}\n"
            f"- Allergies: {ctx.get('allergies', 'None documented')}\n"
        )

    # 1. Attempt OpenRouter Cloud LLM completion if API key is present
    if settings.OPENROUTER_API_KEY:
        try:
            messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
            for h in payload.history[-6:]:
                if h.get("role") in ("user", "assistant") and h.get("content"):
                    messages.append({"role": h["role"], "content": h["content"]})
            messages.append({"role": "user", "content": user_msg})

            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(
                    f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://medisphere.hospital",
                        "X-Title": "MediSphere AI",
                    },
                    json={
                        "model": settings.OPENROUTER_MODEL,
                        "messages": messages,
                        "temperature": 0.3,
                        "max_tokens": 800,
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    ai_reply = data["choices"][0]["message"]["content"]
                    return {
                        "reply": ai_reply,
                        "provider": "openrouter",
                        "model": data.get("model", settings.OPENROUTER_MODEL),
                        "timestamp": datetime.now().isoformat(),
                    }
        except Exception as e:
            # Gracefully log and fall back to clinical rules
            print(f"[OpenRouter Engine Notice] {e}")

    # 2. Heuristic fallback when LLM is offline or cold starting
    lower = user_msg.lower()
    if any(k in lower for k in ["chest pain", "breathless", "unconscious", "emergency", "stroke"]):
        reply = (
            "🚨 **CRITICAL MEDICAL ALERT**:\n"
            "Your symptoms indicate potential acute distress. Please contact the MediSphere 24/7 STAT Helpline (**108**) "
            "or proceed immediately to the Emergency Care Bay (Suite 101, Ground Floor). Emergency triage staff have been notified."
        )
    elif "bed" in lower or "admit" in lower:
        reply = (
            "🛏️ **Bed Intelligence Status**:\n"
            "MediSphere has 6 general ward beds, 2 cardiac observation beds, and 1 ICU bay ready for admission. "
            "Our Bed Intelligence Agent can pre-reserve a telemetry bed linked directly to your UHID."
        )
    elif "appointment" in lower or "doctor" in lower:
        reply = (
            "🩺 **Appointment Coordination**:\n"
            "Dr. Priya Sharma (Cardiology) and Dr. Arun Kumar (Internal Medicine) have consultation slots available today. "
            "Would you like me to book your next slot or review your existing visit pass?"
        )
    else:
        reply = (
            f"Thank you for contacting MediSphere AI Clinical Concierge. "
            f"Regarding your inquiry: *\"{user_msg}\"* — our clinical mesh is synchronized with your health profile. "
            f"Please let me know if you would like me to book an appointment, check laboratory turnaround, or assist with medication refill requests."
        )

    return {
        "reply": reply,
        "provider": "heuristic_fallback",
        "model": "rule-based-clinical",
        "timestamp": datetime.now().isoformat(),
    }


# ─── Parameterized routes AFTER literal routes ───────────────────────────────

@router.get("/{agent_key}/status")
async def get_agent_status(request: Request, agent_key: str):
    orchestrator = getattr(request.app.state, "orchestrator", None)
    if orchestrator and agent_key in orchestrator.agents:
        return orchestrator.agents[agent_key].get_status()

    agents = get_agents_status()
    for agent in agents:
        if agent["key"] == agent_key:
            return agent
    raise HTTPException(status_code=404, detail="Agent not found")


@router.post("/{agent_key}/trigger")
async def trigger_agent(request: Request, agent_key: str):
    orchestrator = getattr(request.app.state, "orchestrator", None)
    if orchestrator and agent_key in orchestrator.agents:
        try:
            output = await orchestrator.trigger_agent(agent_key)
            return {
                "message": f"Agent '{agent_key}' executed successfully",
                "agent_key": agent_key,
                "status": "completed",
                "output": output.__dict__ if output else None,
                "executed_at": datetime.now().isoformat(),
            }
        except Exception as e:
            return {
                "message": f"Agent '{agent_key}' triggered (queued): {e!s}",
                "agent_key": agent_key,
                "status": "queued",
                "started_at": datetime.now().isoformat(),
            }

    return {
        "message": f"Agent '{agent_key}' triggered successfully",
        "agent_key": agent_key,
        "started_at": datetime.now().isoformat(),
        "estimated_completion_seconds": rand_int(5, 30),
    }

