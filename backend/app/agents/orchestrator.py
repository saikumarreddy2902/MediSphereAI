"""
MediSphere AI — LangGraph Agent Orchestrator
Coordinates all 14 specialized AI agents.
"""
import asyncio
from collections import deque
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone

from app.agents.base_agent import BaseAgent, AgentOutput
from app.agents.executive_agent import ExecutiveDecisionAgent
from app.agents.patient_flow_agent import PatientFlowAgent
from app.agents.appointment_agent import AppointmentOptimizationAgent
from app.agents.bed_intelligence_agent import BedIntelligenceAgent
from app.agents.emergency_agent import EmergencyResponseAgent
from app.agents.staff_allocation_agent import StaffAllocationAgent
from app.agents.laboratory_agent import LaboratoryIntelligenceAgent
from app.agents.pharmacy_agent import PharmacyIntelligenceAgent
from app.agents.equipment_agent import MedicalEquipmentAgent
from app.agents.billing_agent import BillingIntelligenceAgent
from app.agents.insurance_agent import InsuranceAgent
from app.agents.revenue_agent import RevenueOptimizationAgent
from app.agents.predictive_analytics_agent import PredictiveAnalyticsAgent
from app.agents.root_cause_agent import RootCauseAnalysisAgent
from app.agents.recommendation_agent import RecommendationAgent


def _dump_output(out: Any) -> Optional[Dict[str, Any]]:
    """Safely convert AgentOutput to a dictionary."""
    if out is None:
        return None
    if hasattr(out, "model_dump"):
        return out.model_dump()
    if hasattr(out, "to_dict"):
        return out.to_dict()
    if hasattr(out, "__dict__"):
        return {k: v for k, v in out.__dict__.items() if not k.startswith("_")}
    if isinstance(out, dict):
        return out
    return dict(out)


class AgentOrchestrator:
    """
    Central orchestrator that coordinates all AI agents.

    Architecture:
    - Each agent runs on its own schedule
    - Critical agents (Emergency, Beds) run every 30s
    - Analytical agents run every 5 minutes
    - Executive agent aggregates all outputs every 10 minutes

    LangGraph Integration Point:
        # Uncomment to enable full LangGraph workflow:
        # from langgraph.graph import StateGraph, END
        # workflow = StateGraph(HospitalState)
        # workflow.add_node("emergency", emergency_agent.run)
        # workflow.add_node("beds", bed_agent.run)
        # workflow.add_edge("emergency", "beds")
        # workflow.add_edge("beds", END)
        # graph = workflow.compile()
    """

    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {
            "executive":      ExecutiveDecisionAgent(),
            "patient_flow":   PatientFlowAgent(),
            "appointment":    AppointmentOptimizationAgent(),
            "beds":           BedIntelligenceAgent(),
            "emergency":      EmergencyResponseAgent(),
            "staff":          StaffAllocationAgent(),
            "laboratory":     LaboratoryIntelligenceAgent(),
            "pharmacy":       PharmacyIntelligenceAgent(),
            "equipment":      MedicalEquipmentAgent(),
            "billing":        BillingIntelligenceAgent(),
            "insurance":      InsuranceAgent(),
            "revenue":        RevenueOptimizationAgent(),
            "predictive":     PredictiveAnalyticsAgent(),
            "root_cause":     RootCauseAnalysisAgent(),
            "recommendation": RecommendationAgent(),
        }

        # Tiered scheduling: interval in seconds per agent
        self._schedules: Dict[str, int] = {
            "emergency":      30,     # Critical ops — every 30 seconds
            "beds":           30,
            "patient_flow":   60,
            "appointment":    120,
            "staff":          120,
            "pharmacy":       300,    # Analytical — every 5 minutes
            "laboratory":     300,
            "equipment":      300,
            "billing":        300,
            "insurance":      300,
            "revenue":        600,    # Strategic — every 10 minutes
            "predictive":     600,
            "root_cause":     600,
            "recommendation": 600,
            "executive":      600,
        }
        self.is_running = False
        self.run_tasks: List[asyncio.Task] = []
        # Bounded deque: keeps only the last 1000 agent output records to prevent
        # unbounded memory growth in long-running production deployments.
        self.all_outputs: deque = deque(maxlen=1000)

    async def start(self):
        """Start all agent loops as recurring background asyncio tasks."""
        self.is_running = True
        print(f"Starting {len(self.agents)} AI agents with tiered scheduling...")

        # Launch recurring background tasks immediately (non-blocking startup)
        for name, agent in self.agents.items():
            interval = self._schedules.get(name, 300)
            task = asyncio.create_task(
                self._agent_loop(name, agent, interval),
                name=f"agent-{name}",
            )
            self.run_tasks.append(task)

        # Fire initial analysis passes as a separate background task (non-blocking)
        asyncio.create_task(self._initial_run_all(), name="agents-initial-run")

        print("All agent background loops started")

    async def _initial_run_all(self) -> None:
        """Run all agents once in the background after startup (delayed, non-blocking)."""
        await asyncio.sleep(10) # Let the server accept requests first
        for name, agent in self.agents.items():
            try:
                await asyncio.sleep(0.5)
                output = await agent.run()
                self._apply_output(output)
            except Exception as e:
                pass

    async def _agent_loop(self, name: str, agent: BaseAgent, interval: int) -> None:
        """Recurring loop: wait interval seconds, then run the agent, repeat."""
        try:
            while self.is_running:
                await asyncio.sleep(interval)
                if not self.is_running:
                    break
                try:
                    output = await agent.run()
                    if output:
                        self._apply_output(output)
                except Exception as e:
                    print(f"Agent loop '{name}' cycle error: {e}")
        except asyncio.CancelledError:
            pass

    def _apply_output(self, output: AgentOutput) -> None:
        """
        Store agent output and flag critical recommendations for human review.
        Critical recommendations require explicit staff approval before action.
        """
        if not output:
            return

        # Flag critical recommendations — AI governance / human-in-the-loop gate
        if hasattr(output, "recommendations") and output.recommendations:
            for rec in output.recommendations:
                if rec.get("priority") == "critical":
                    rec["requires_review"] = True
                    rec["reviewed"] = False
                    rec["reviewed_by"] = None
                    rec["reviewed_at"] = None

        self.all_outputs.append(output)

    async def stop(self):
        """Stop all agent loops gracefully."""
        self.is_running = False
        for task in self.run_tasks:
            if not task.done():
                task.cancel()
        if self.run_tasks:
            await asyncio.gather(*self.run_tasks, return_exceptions=True)
        self.run_tasks.clear()

    async def trigger_agent(self, agent_key: str) -> Optional[AgentOutput]:
        """Manually trigger a specific agent."""
        agent = self.agents.get(agent_key)
        if not agent:
            return None
        output = await agent.run()
        if output:
            self._apply_output(output)
        return output

    def get_all_status(self) -> List[Dict]:
        """Get status of all agents."""
        return [agent.get_status() for agent in self.agents.values()]

    def get_all_recommendations(self) -> List[Dict]:
        """Aggregate recommendations from all agents with safe priority sorting."""
        all_recs = []
        for output in self.all_outputs:
            if hasattr(output, "recommendations") and output.recommendations:
                all_recs.extend(output.recommendations)
        
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
        all_recs.sort(key=lambda x: priority_order.get(str(x.get("priority", "low")).lower(), 5))
        return all_recs

    def get_all_alerts(self) -> List[Dict]:
        """Aggregate alerts from all agents."""
        all_alerts = []
        for output in self.all_outputs:
            if hasattr(output, "alerts") and output.alerts:
                all_alerts.extend(output.alerts)
        return all_alerts

    def get_latest_insights(self) -> Dict[str, Any]:
        """Aggregate latest insights per agent."""
        insights = {}
        for key, agent in self.agents.items():
            if agent.last_output and hasattr(agent.last_output, "insights"):
                insights[key] = agent.last_output.insights
        return insights

    async def run_pipeline_workflow(self, state: Optional[Dict] = None) -> Dict:
        """
        Execute a choreographed multi-agent workflow DAG.
        Triage Emergency -> Allocate Beds -> Optimize Staff -> Synthesize Recommendations -> Executive Approval.
        Supports LangGraph StateGraph when available, with resilient native async DAG fallback.
        """
        workflow_state = state or {"timestamp": datetime.now(timezone.utc).isoformat(), "stages": {}}
        if "stages" not in workflow_state:
            workflow_state["stages"] = {}

        try:
            from langgraph.graph import StateGraph, END
            # pyrefly: ignore[bad-specialization]
            builder = StateGraph(dict)
            
            async def emergency_node(st: dict):
                out = await self.agents["emergency"].run()
                if out:
                    self._apply_output(out)
                    st["stages"]["emergency"] = _dump_output(out)
                return st
                
            async def beds_node(st: dict):
                out = await self.agents["beds"].run()
                if out:
                    self._apply_output(out)
                    st["stages"]["beds"] = _dump_output(out)
                return st
                
            async def staff_node(st: dict):
                out = await self.agents["staff"].run()
                if out:
                    self._apply_output(out)
                    st["stages"]["staff"] = _dump_output(out)
                return st
                
            async def recommendation_node(st: dict):
                out = await self.agents["recommendation"].run()
                if out:
                    self._apply_output(out)
                    st["stages"]["recommendation"] = _dump_output(out)
                return st
                
            async def executive_node(st: dict):
                out = await self.agents["executive"].run()
                if out:
                    self._apply_output(out)
                    st["stages"]["executive"] = _dump_output(out)
                return st

            # pyrefly: ignore[bad-argument-type]
            builder.add_node("emergency", emergency_node)
            # pyrefly: ignore[bad-argument-type]
            builder.add_node("beds", beds_node)
            # pyrefly: ignore[bad-argument-type]
            builder.add_node("staff", staff_node)
            # pyrefly: ignore[bad-argument-type]
            builder.add_node("recommendation", recommendation_node)
            # pyrefly: ignore[bad-argument-type]
            builder.add_node("executive", executive_node)
            
            builder.set_entry_point("emergency")
            builder.add_edge("emergency", "beds")
            builder.add_edge("beds", "staff")
            builder.add_edge("staff", "recommendation")
            builder.add_edge("recommendation", "executive")
            builder.add_edge("executive", END)
            
            compiled_graph = builder.compile()
            result = await compiled_graph.ainvoke(workflow_state)
            return result
        except Exception:
            # Resilient native async DAG execution fallback
            pipeline = ["emergency", "beds", "staff", "recommendation", "executive"]
            for step in pipeline:
                if step in self.agents:
                    try:
                        out = await self.agents[step].run()
                        if out:
                            self._apply_output(out)
                            workflow_state["stages"][step] = _dump_output(out)
                    except Exception as step_err:
                        workflow_state["stages"][step] = {"error": str(step_err)}
            return workflow_state

