"""
MediSphere AI — Bed Intelligence Agent

Monitors bed occupancy across all wards using MongoDB Atlas ODM (Beanie)
and generates real-time transfer and discharge recommendations.
"""
from typing import Dict, Any
from app.agents.base_agent import BaseAgent, AgentOutput
from app.models.operations import Bed
from app.mock.data_generator import get_bed_summary


class BedIntelligenceAgent(BaseAgent):
    agent_name = "Bed Intelligence Agent"
    description = "Monitors real-time bed occupancy across all ward types and recommends transfers and discharge planning."
    category = "Resources"
    run_interval_seconds = 60

    async def analyze(self) -> AgentOutput:
        recommendations = []
        alerts = []
        summary: Dict[str, Any] = {}

        try:
            # Query MongoDB via Beanie ODM
            total_db_beds = await Bed.count()

            if total_db_beds > 0:
                icu_total = await Bed.find(Bed.type == "ICU").count()
                icu_occupied = await Bed.find(Bed.type == "ICU", Bed.is_occupied == True).count()
                icu_rate = round((icu_occupied / max(1, icu_total)) * 100, 1)

                total_occupied = await Bed.find(Bed.is_occupied == True).count()
                overall_rate = round((total_occupied / total_db_beds) * 100, 1)

                summary = {
                    "total": {"total": total_db_beds, "occupied": total_occupied, "available": total_db_beds - total_occupied},
                    "icu": {"total": icu_total, "occupied": icu_occupied, "available": icu_total - icu_occupied, "occupancy_rate": icu_rate},
                    "overall_occupancy_rate": overall_rate,
                    "source": "MongoDB Atlas"
                }
            else:
                summary = get_bed_summary()
                summary["source"] = "Generator (Fallback)"

        except Exception:
            summary = get_bed_summary()
            summary["source"] = "Generator (Fallback)"

        # ─── LLM RAG Connection (with graceful fallback) ──────────────────────
        try:
            # Attempt to run semantic RAG analysis via Ollama LLM
            output = await self.query_llm_rag({"bed_summary": summary})
            # Ensure insights structure has summary
            if not output.insights:
                output.insights = {}
            output.insights["bed_summary"] = summary
            output.insights["bed_summary"]["source"] = "MongoDB + Ollama RAG"
            return output
        except Exception:
            # Fall back to deterministic rule-based analysis
            icu = summary.get("icu", {})
            occupancy_rate = icu.get("occupancy_rate", 0)

            if occupancy_rate > 90:
                alerts.append(self.format_alert(
                    "ICU Near Critical Capacity",
                    f"ICU occupancy at {occupancy_rate}% — only {icu.get('available', 0)} beds available in MongoDB cluster.",
                    "critical"
                ))
                recommendations.append(self.format_recommendation(
                    "Initiate ICU Discharge & Step-down Protocol",
                    "Review stable ICU patients for transfer to general wards to free critical capacity.",
                    "critical", "Reclaim 3-4 ICU beds"
                ))

            return AgentOutput(
                agent_name=self.agent_name,
                recommendations=recommendations,
                alerts=alerts,
                insights={"bed_summary": summary}
            )
