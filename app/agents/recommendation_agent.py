"""Recommendation Agent — aggregates and prioritizes recommendations from all agents."""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import get_recommendations


class RecommendationAgent(BaseAgent):
    agent_name = "Recommendation Agent"
    description = "Aggregates, deduplicates, and prioritizes actionable recommendations from all specialized agents."
    category = "Intelligence"
    run_interval_seconds = 60

    async def analyze(self) -> AgentOutput:
        recs = get_recommendations()
        critical_recs = [r for r in recs if r["priority"] == "critical"]
        acknowledged = [r for r in recs if r.get("is_acknowledged")]

        alerts = []
        if critical_recs:
            alerts.append(self.format_alert(
                f"{len(critical_recs)} Critical Recommendations Require Attention",
                "Immediate action required on critical operational recommendations.",
                "critical"
            ))

        recommendations = [self.format_recommendation(
            r["title"], r["description"], r["priority"], r.get("impact", "")
        ) for r in recs[:5]]

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={
                "total_recommendations": len(recs),
                "critical": len(critical_recs),
                "acknowledged": len(acknowledged),
                "action_rate": round(len(acknowledged) / len(recs) * 100, 1) if recs else 0,
            }
        )
