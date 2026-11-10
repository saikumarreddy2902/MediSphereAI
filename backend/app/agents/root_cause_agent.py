"""Root Cause Analysis Agent — generates explainable causal chains for operational issues."""
from app.agents.base_agent import AgentOutput, BaseAgent


class RootCauseAnalysisAgent(BaseAgent):
    agent_name = "Root Cause Analysis Agent"
    description = "Generates explainable causal chain analysis for operational issues and KPI deviations."
    category = "Intelligence"
    run_interval_seconds = 300

    async def analyze(self) -> AgentOutput:
        recommendations = []
        alerts = []
        # LLM Integration Point: Use LLM to generate dynamic root cause chains
        # prompt = "Analyze why average wait time increased 34%..."
        # chain = await call_ollama(prompt)

        analysis = {
            "issue": "Increased average waiting time (+34%)",
            "causal_chain": [
                {"step": 1, "cause": "Emergency department overcrowding", "confidence": 0.92},
                {"step": 2, "cause": "ICU beds unavailable (96% occupancy)", "confidence": 0.88},
                {"step": 3, "cause": "Delayed patient discharge (+6h avg)", "confidence": 0.85},
                {"step": 4, "cause": "Night shift nursing shortage", "confidence": 0.79},
            ],
            "root_cause": "Night shift nursing shortage leading to delayed discharges",
        }

        recommendations.append(self.format_recommendation(
            "Address Root Cause: Staffing Shortage",
            "Resolve night nursing shortage to break causal chain increasing wait times.",
            "critical", "Reduce wait time by 34%"
        ))

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={"root_cause_analysis": analysis}
        )
