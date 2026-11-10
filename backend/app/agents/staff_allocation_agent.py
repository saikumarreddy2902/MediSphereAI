"""Staff Allocation Agent — balances workload and predicts staffing shortages."""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import generate_staff


class StaffAllocationAgent(BaseAgent):
    agent_name = "Staff Allocation Agent"
    description = "Monitors staff workload, balances assignments, and predicts shift shortages."
    category = "Staffing"
    run_interval_seconds = 120

    async def analyze(self) -> AgentOutput:
        staff = generate_staff(80)
        overloaded = [s for s in staff if s["workload_score"] > 90]
        recommendations = []
        alerts = []

        if len(overloaded) > 5:
            alerts.append(self.format_alert(
                "Staff Overload Detected",
                f"{len(overloaded)} staff members at critical workload (>90%)",
                "warning"
            ))
            recommendations.append(self.format_recommendation(
                "Redistribute Patient Assignments",
                "Reassign patients from overloaded to underutilized staff.",
                "high", "Reduce overload risk"
            ))

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={
                "total_staff": len(staff),
                "on_duty": len([s for s in staff if s["is_on_duty"]]),
                "overloaded": len(overloaded),
                "avg_workload": round(sum(s["workload_score"] for s in staff) / len(staff), 1),
            }
        )
