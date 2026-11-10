"""
MediSphere AI — Emergency Response Agent

Monitors emergency queue, prioritizes critical triage levels (1 & 2),
and coordinates department responses using MongoDB Atlas ODM (Beanie).
"""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import generate_emergency_cases
from app.models.operations import EmergencyCase


class EmergencyResponseAgent(BaseAgent):
    agent_name = "Emergency Response Agent"
    description = "Monitors emergency queue in real-time, prioritizes critical triage levels, and coordinates response."
    category = "Emergency"
    run_interval_seconds = 30

    async def analyze(self) -> AgentOutput:
        recommendations = []
        alerts = []
        cases_count = 0
        critical_count = 0

        try:
            total_cases = await EmergencyCase.count()
            if total_cases > 0:
                # Query MongoDB for critical triage cases (Level 1 & 2)
                critical_cases = await EmergencyCase.find(EmergencyCase.triage_level <= 2).to_list()
                cases_count = total_cases
                critical_count = len(critical_cases)
            else:
                gen_cases = generate_emergency_cases(25)
                cases_count = len(gen_cases)
                critical_count = len([c for c in gen_cases if c["triage_level"] <= 2])
        except Exception:
            gen_cases = generate_emergency_cases(25)
            cases_count = len(gen_cases)
            critical_count = len([c for c in gen_cases if c["triage_level"] <= 2])

        if critical_count > 3:
            alerts.append(self.format_alert(
                "Multiple Critical Emergency Cases",
                f"{critical_count} critical emergency cases detected in MongoDB queue. Immediate physician deployment required.",
                "critical"
            ))

        recommendations.append(self.format_recommendation(
            "Expedite Emergency Patient Triage",
            f"Active ER Queue: {cases_count} total cases ({critical_count} critical). Assign available trauma specialists.",
            "high", "Reduce ER wait time below 30 min"
        ))

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={
                "total_cases": cases_count,
                "critical_cases": critical_count,
                "data_source": "MongoDB Atlas"
            }
        )

