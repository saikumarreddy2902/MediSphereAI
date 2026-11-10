"""Patient Flow Agent — tracks patient journey and detects bottlenecks."""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import generate_patients, get_hourly_patient_flow


class PatientFlowAgent(BaseAgent):
    agent_name = "Patient Flow Agent"
    description = "Tracks patient journey across all touchpoints and detects flow bottlenecks in real time."
    category = "Operations"
    run_interval_seconds = 60

    async def analyze(self) -> AgentOutput:
        patients = generate_patients(100)
        flow = get_hourly_patient_flow(4)

        waiting = [p for p in patients if p["status"] == "waiting"]
        recommendations = []
        alerts = []

        if len(waiting) > 40:
            recommendations.append(self.format_recommendation(
                "Open Additional Registration Desk",
                f"{len(waiting)} patients waiting. Open desk 2 to reduce wait time.",
                "high", "Reduce OPD wait by ~14 min"
            ))

        bottleneck = max(patients, key=lambda p: p.get("wait_time_minutes") or 0, default=None)

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={
                "total_patients": len(patients),
                "waiting_count": len(waiting),
                "bottleneck_stage": bottleneck["status"] if bottleneck else "none",
                "flow_data": flow,
            }
        )
