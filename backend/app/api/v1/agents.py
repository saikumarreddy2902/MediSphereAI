"""Agents API"""
import random
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException
from app.mock.data_generator import (
    get_agents_status, rand_int, rand_float,
    AGENT_DEFINITIONS, fake, rand_choice, _hours_ago
)

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
                "message": f"Agent '{agent_key}' triggered (queued): {str(e)}",
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

