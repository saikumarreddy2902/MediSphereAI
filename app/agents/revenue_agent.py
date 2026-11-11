"""Revenue Optimization Agent — analyzes profitability and recommends improvements."""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import get_daily_revenue, get_department_performance, rand_float


class RevenueOptimizationAgent(BaseAgent):
    agent_name = "Revenue Optimization Agent"
    description = "Analyzes department revenue, operational costs, and provides profitability improvement recommendations."
    category = "Finance"
    run_interval_seconds = 900

    async def analyze(self) -> AgentOutput:
        revenue = get_daily_revenue(7)
        dept_perf = get_department_performance()
        recommendations = []
        alerts = []

        avg_profit_margin = rand_float(20, 40, 1)
        if avg_profit_margin < 25:
            recommendations.append(self.format_recommendation(
                "Improve Profit Margin",
                f"Current profit margin is {avg_profit_margin}%. Target: 30%+. Review cost centers.",
                "medium", "Improve margin by 5%"
            ))

        low_performers = [d for d in dept_perf if d["efficiency_score"] < 70]
        if low_performers:
            recommendations.append(self.format_recommendation(
                "Optimize Underperforming Departments",
                f"{', '.join(d['department'] for d in low_performers)} have <70% efficiency scores.",
                "medium", "Increase department revenue"
            ))

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={
                "avg_profit_margin": avg_profit_margin,
                "7day_revenue": sum(r["revenue"] for r in revenue),
                "7day_cost": sum(r["cost"] for r in revenue),
                "low_performing_depts": len(low_performers),
            }
        )
