"""Laboratory Intelligence Agent — prioritizes lab orders and predicts delays."""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import generate_lab_orders


class LaboratoryIntelligenceAgent(BaseAgent):
    agent_name = "Laboratory Intelligence Agent"
    description = "Monitors lab order pipeline, prioritizes critical results, and predicts turnaround delays."
    category = "Clinical"
    run_interval_seconds = 60

    async def analyze(self) -> AgentOutput:
        orders = generate_lab_orders(80)
        critical_pending = [o for o in orders if o["is_critical"] and o["status"] != "completed"]
        overdue = [o for o in orders if o["turnaround_hours"] > 4 and o["status"] != "completed"]
        recommendations = []
        alerts = []

        if critical_pending:
            alerts.append(self.format_alert(
                "Critical Lab Results Pending",
                f"{len(critical_pending)} critical lab tests still pending. Escalate immediately.",
                "critical"
            ))

        if len(overdue) > 10:
            recommendations.append(self.format_recommendation(
                "Expedite Overdue Lab Tests",
                f"{len(overdue)} tests overdue >4 hours. Assign additional technicians.",
                "high", "Reduce turnaround by 40%"
            ))

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={
                "total_orders": len(orders),
                "critical_pending": len(critical_pending),
                "overdue": len(overdue),
                "avg_turnaround_hours": round(sum(o["turnaround_hours"] for o in orders) / len(orders), 1),
            }
        )
