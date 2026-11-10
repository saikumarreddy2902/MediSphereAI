"""Executive Decision Agent — monitors hospital KPIs and generates executive reports."""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import get_department_performance, get_hospital_kpis


class ExecutiveDecisionAgent(BaseAgent):
    agent_name = "Executive Decision Agent"
    description = "Monitors hospital-wide KPIs, generates executive reports, and prioritizes operational issues."
    category = "Intelligence"
    run_interval_seconds = 300

    async def analyze(self) -> AgentOutput:
        kpis = get_hospital_kpis()
        dept_perf = get_department_performance()

        recommendations = []
        alerts = []

        if kpis["bed_occupancy_rate"] > 90:
            alerts.append(self.format_alert(
                "Critical Bed Occupancy",
                f"Bed occupancy at {kpis['bed_occupancy_rate']}% — approaching capacity",
                "critical"
            ))

        if kpis["average_waiting_time"] > 35:
            recommendations.append(self.format_recommendation(
                "Reduce Patient Waiting Time",
                "Average wait time exceeds 35 minutes. Open additional consultation rooms.",
                "high",
                "Reduce wait time by ~12 min"
            ))

        # LLM Integration Point:
        # prompt = self.build_prompt({"kpis": kpis, "departments": dept_perf})
        # llm_response = await call_ollama(prompt)

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={"kpis": kpis, "top_department": max(dept_perf, key=lambda d: d["efficiency_score"])["department"]},
        )
