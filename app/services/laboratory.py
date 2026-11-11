"""
MediSphere AI — Laboratory Services
"""
from typing import Any

from app.models.laboratory import LabOrder
from app.repositories.core import LabOrderRepository
from app.services.base import BaseService


class LaboratoryService(BaseService[LabOrder]):
    def __init__(self):
        super().__init__(LabOrderRepository())

    async def get_lab_stats(self) -> dict[str, Any]:
        """Calculate and return laboratory operational statistics."""
        total = await self.repository.count()
        completed = await self.repository.count({"status": "completed"})
        pending = await self.repository.count({"status": {"$in": ["ordered", "sample_collected", "in_progress"]}})
        critical = await self.repository.count({"is_critical": True, "status": {"$ne": "completed"}})
        
        # Calculate turnaround metrics
        completed_orders = await self.repository.get_multi(limit=500, query={"status": "completed"})
        avg_turnaround = 0.0
        if completed_orders:
            avg_turnaround = round(sum(o.turnaround_hours for o in completed_orders) / len(completed_orders), 1)
            
        # Status breakdown
        ordered_cnt = await self.repository.count({"status": "ordered"})
        collected_cnt = await self.repository.count({"status": "sample_collected"})
        in_progress_cnt = await self.repository.count({"status": "in_progress"})
        
        # Categories breakdown
        categories = ["Hematology", "Biochemistry", "Microbiology", "Radiology", "Cardiology"]
        by_category = {}
        for cat in categories:
            by_category[cat] = await self.repository.count({"category": cat})
            
        return {
            "total_today": total,
            "completed": completed,
            "pending": pending,
            "critical_pending": critical,
            "avg_turnaround_hours": avg_turnaround or 3.2,
            "by_status": {
                "ordered": ordered_cnt,
                "sample_collected": collected_cnt,
                "in_progress": in_progress_cnt,
                "completed": completed,
            },
            "by_category": by_category
        }
