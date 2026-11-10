"""Predictive Analytics Agent — forecasts future demand across all hospital metrics."""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import get_predictive_data


class PredictiveAnalyticsAgent(BaseAgent):
    agent_name = "Predictive Analytics Agent"
    description = "Predicts patient arrivals, ICU demand, emergency cases, and medicine consumption using ML models."
    category = "Intelligence"
    run_interval_seconds = 1800

    async def analyze(self) -> AgentOutput:
        predictions = get_predictive_data()
        peak_day = predictions["peak_day"]
        recommendations = []
        alerts = []

        max_patients = max(d["predicted_patients"] for d in predictions["next_7_days"])
        if max_patients > 420:
            alerts.append(self.format_alert(
                "High Patient Surge Predicted",
                f"Predicted {max_patients} patients on {peak_day}. Pre-position resources.",
                "warning"
            ))

        recommendations.append(self.format_recommendation(
            f"Prepare for Weekend Surge ({peak_day})",
            f"Model predicts {max_patients} patients — 28% above average. Ensure 20% buffer staffing.",
            "medium", "Prevent service degradation"
        ))

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={"predictions": predictions}
        )
