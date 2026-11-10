"""Medical Equipment Agent — monitors utilization and predicts failures."""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import EQUIPMENT_LIST


class MedicalEquipmentAgent(BaseAgent):
    agent_name = "Medical Equipment Agent"
    description = "Monitors equipment utilization, predicts maintenance needs, and detects failure risks."
    category = "Maintenance"
    run_interval_seconds = 600

    async def analyze(self) -> AgentOutput:
        high_risk = [e for e in EQUIPMENT_LIST if e["risk"] > 0.3]
        critical = [e for e in EQUIPMENT_LIST if e["status"] in ["faulty", "maintenance"]]
        recommendations = []
        alerts = []

        for eq in critical:
            alerts.append(self.format_alert(
                f"Equipment Down: {eq['name']}",
                f"{eq['name']} in {eq['dept']} is {eq['status']}",
                "critical" if eq["status"] == "faulty" else "warning"
            ))

        if high_risk:
            recommendations.append(self.format_recommendation(
                "Schedule Preventive Maintenance",
                f"{len(high_risk)} equipment items have elevated failure risk (>30%). Schedule maintenance.",
                "high", "Prevent unplanned downtime"
            ))

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={
                "total_equipment": len(EQUIPMENT_LIST),
                "high_risk": len(high_risk),
                "offline": len(critical),
                "avg_utilization": round(sum(e["utilization"] for e in EQUIPMENT_LIST) / len(EQUIPMENT_LIST), 1),
            }
        )
