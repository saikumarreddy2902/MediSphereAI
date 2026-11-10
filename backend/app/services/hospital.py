"""
MediSphere AI — Patient and Bed Services
"""

from app.models.hospital import Patient
from app.models.operations import Bed
from app.repositories.core import BedRepository, PatientRepository
from app.services.base import BaseService
from fastapi import HTTPException, status


class PatientService(BaseService[Patient]):
    def __init__(self):
        super().__init__(PatientRepository())

    async def register_patient(self, create_data: dict) -> Patient:
        """Custom logic for registering a patient, could check for duplicates here."""
        # Check if patient exists with same contact number
        existing = await self.repository.get_by_field("contact_number", create_data.get("contact_number"))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient with this contact number already exists"
            )
        return await self.repository.create(create_data)

    async def search_patients(self, query: str) -> list[Patient]:
        # pyrefly: ignore[missing-attribute]
        return await self.repository.search_by_name(query)


class BedService(BaseService[Bed]):
    def __init__(self):
        super().__init__(BedRepository())

    async def get_dashboard_summary(self) -> dict:
        """Get aggregate metrics for the dashboard, grouped by ward."""
        # 1. Get totals
        total_beds = await self.repository.count()
        occupied_beds = await self.repository.count({"is_occupied": True})
        available_beds = total_beds - occupied_beds
        occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0
        
        summary = {
            "occupancy_rate": round(occupancy_rate, 2),
            "total_beds": total_beds,
            "occupied_beds": occupied_beds,
            "available_beds": available_beds,
            "total": {
                "total": total_beds,
                "occupied": occupied_beds,
                "available": available_beds,
                "occupancy_rate": round(occupancy_rate, 2)
            }
        }
        
        # 2. Get breakdown by ward using an aggregation pipeline
        pipeline = [
            {
                "$group": {
                    "_id": "$ward",
                    "total": {"$sum": 1},
                    "occupied": {"$sum": {"$cond": [{"$eq": ["$is_occupied", True]}, 1, 0]}}
                }
            }
        ]
        
        try:
            ward_stats = await self.repository.model.aggregate(pipeline).to_list()
        except Exception:
            ward_stats = []
            try:
                distinct_wards = await self.repository.model.distinct("ward")
                for w in distinct_wards:
                    w_total = await self.repository.count({"ward": w})
                    w_occ = await self.repository.count({"ward": w, "is_occupied": True})
                    ward_stats.append({"_id": w, "total": w_total, "occupied": w_occ})
            except Exception:
                pass
        
        # 3. Format the ward stats for the frontend
        # Map ward names to the keys expected by the frontend
        ward_map = {
            "ICU": "icu",
            "Emergency": "emergency",
            "General Ward": "general",
            "Private Room": "private",
            "Pediatric": "pediatric",
            "Maternity": "maternity"
        }
        
        for stat in ward_stats:
            ward_name = stat.get("_id")
            if not ward_name:
                continue
                
            frontend_key = ward_map.get(ward_name, ward_name.lower().replace(" ", "_"))
            w_total = stat.get("total", 0)
            w_occ = stat.get("occupied", 0)
            
            summary[frontend_key] = {
                "total": w_total,
                "occupied": w_occ,
                "available": w_total - w_occ,
                "occupancy_rate": round((w_occ / w_total * 100), 2) if w_total > 0 else 0
            }
            
        return summary

    async def assign_bed(self, bed_id: str, patient_id: str) -> Bed:
        """Assign a bed to a patient."""
        bed = await self.get_or_404(bed_id)
        if bed.is_occupied:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bed is already occupied"
            )
        
        bed.is_occupied = True
        bed.current_patient_id = patient_id
        return await self.repository.update(bed, bed.model_dump())

    async def discharge_bed(self, bed_id: str) -> Bed:
        """Free up a bed after discharge."""
        bed = await self.get_or_404(bed_id)
        bed.is_occupied = False
        bed.current_patient_id = None
        return await self.repository.update(bed, bed.model_dump())
