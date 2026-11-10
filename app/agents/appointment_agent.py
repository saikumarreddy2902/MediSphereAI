"""Appointment Optimization Agent — optimizes scheduling and predicts no-shows."""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import generate_appointments


class AppointmentOptimizationAgent(BaseAgent):
    agent_name = "Appointment Optimization Agent"
    description = "Optimizes doctor scheduling, predicts no-shows, and recommends load balancing."
    category = "Scheduling"
    run_interval_seconds = 180

    async def analyze(self) -> AgentOutput:
        appts = generate_appointments(100)
        high_risk = [a for a in appts if a["no_show_risk"] > 0.35]
        recommendations = []
        alerts = []

        if len(high_risk) > 10:
            recommendations.append(self.format_recommendation(
                "Send Reminder to High No-Show Risk Patients",
                f"{len(high_risk)} appointments have >35% no-show risk. Send SMS reminders.",
                "medium", "Reduce no-shows by ~60%"
            ))

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={
                "total_appointments": len(appts),
                "high_risk_no_shows": len(high_risk),
                "cancelled": len([a for a in appts if a["status"] == "cancelled"]),
            }
        )
