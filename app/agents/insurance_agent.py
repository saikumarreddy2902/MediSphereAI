"""Insurance Agent — verifies claims and predicts approval outcomes."""
from app.agents.base_agent import AgentOutput, BaseAgent
from app.mock.data_generator import generate_insurance_claims


class InsuranceAgent(BaseAgent):
    agent_name = "Insurance Agent"
    description = "Analyzes insurance claims, predicts approval probability, and flags documentation gaps."
    category = "Finance"
    run_interval_seconds = 600

    async def analyze(self) -> AgentOutput:
        claims = generate_insurance_claims(60)
        at_risk = [c for c in claims if c["approval_probability"] < 0.5 and c["status"] not in ["approved","rejected"]]
        missing_docs = [c for c in claims if c["status"] == "pending_documents"]
        recommendations = []
        alerts = []

        if missing_docs:
            recommendations.append(self.format_recommendation(
                "Complete Documentation for Pending Claims",
                f"{len(missing_docs)} claims blocked by missing documents. Assign to billing team.",
                "high", "Unblock pending claims"
            ))

        if at_risk:
            recommendations.append(self.format_recommendation(
                "Strengthen At-Risk Insurance Claims",
                f"{len(at_risk)} claims have <50% approval probability. Review and add supporting docs.",
                "medium", f"Protect ₹{round(sum(c['claim_amount'] for c in at_risk)/1000, 0)}K"
            ))

        return AgentOutput(
            agent_name=self.agent_name,
            recommendations=recommendations,
            alerts=alerts,
            insights={
                "total_claims": len(claims),
                "at_risk": len(at_risk),
                "missing_docs": len(missing_docs),
                "approved": len([c for c in claims if c["status"] == "approved"]),
            }
        )
