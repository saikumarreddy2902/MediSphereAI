"""Billing Intelligence Agent — detects anomalies and tracks revenue."""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import generate_bills, rand_float


class BillingIntelligenceAgent(BaseAgent):
    agent_name = "Billing Intelligence Agent"
    description = "Monitors billing patterns, detects anomalies, and tracks revenue collection efficiency."
    category = "Finance"
    run_interval_seconds = 600

    async def analyze(self) -> AgentOutput:
        bills = generate_bills(80)
        flagged = [b for b in bills if b["is_flagged"]]
        overdue = [b for b in bills if b["status"] == "overdue"]
        recommendations = []
        alerts = []

        if flagged:
            alerts.append(self.format_alert(
                "Billing Anomalies Detected",
                f"{len(flagged)} bills flagged for anomalies. Requires billing manager review.",
                "warning"
            ))

        if overdue:
            recommendations.append(self.format_recommendation(
                "Follow Up on Overdue Payments",
                f"{len(overdue)} bills overdue. Initiate collection process.",
                "medium", f"Recover ₹{round(sum(b['pending_amount'] for b in overdue)/1000, 0)}K"
            ))

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={
                "total_bills": len(bills),
                "flagged": len(flagged),
                "overdue": len(overdue),
                "collection_rate": rand_float(72, 88, 1),
            }
        )
