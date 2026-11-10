"""Pharmacy Intelligence Agent — monitors inventory and predicts stock-outs."""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import get_pharmacy_inventory


class PharmacyIntelligenceAgent(BaseAgent):
    agent_name = "Pharmacy Intelligence Agent"
    description = "Monitors medicine inventory, predicts stock-outs, and generates purchase recommendations."
    category = "Supply"
    run_interval_seconds = 300

    async def analyze(self) -> AgentOutput:
        inventory = get_pharmacy_inventory()
        critical = [m for m in inventory if m["is_critical_stock"]]
        expiring = [m for m in inventory if m["expiry_status"] == "critical"]
        recommendations = []
        alerts = []

        for med in critical:
            alerts.append(self.format_alert(
                f"Critical Stock: {med['name']}",
                f"Only {med['current_stock']} units remaining ({med['days_remaining']} days supply)",
                "critical"
            ))

        if critical:
            recommendations.append(self.format_recommendation(
                "Emergency Medicine Reorder Required",
                f"{len(critical)} medicines at critical stock levels. Generate purchase orders immediately.",
                "critical", "Prevent treatment delays"
            ))

        if expiring:
            recommendations.append(self.format_recommendation(
                "Manage Expiring Medicines",
                f"{len(expiring)} medicines expire within 30 days. Plan consumption or return.",
                "medium", "Reduce waste costs"
            ))

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={
                "total_medicines": len(inventory),
                "critical_stock": len(critical),
                "low_stock": len([m for m in inventory if m["is_low_stock"]]),
                "expiring_soon": len(expiring),
                "total_inventory_value": round(sum(m["total_value"] for m in inventory), 2),
            }
        )
