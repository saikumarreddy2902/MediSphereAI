"""
MediSphere AI — Laboratory Models
"""
from datetime import datetime

from app.models.base import BaseDocument
from pymongo import ASCENDING, IndexModel


class LabOrder(BaseDocument):
    """
    Lab order document for diagnostic test tracking.
    """
    order_id: str
    patient_name: str
    patient_id: str
    test_name: str
    test_code: str
    category: str  # Hematology, Biochemistry, Microbiology, Radiology, Cardiology
    ordered_at: datetime
    status: str = "ordered"  # ordered, sample_collected, in_progress, completed, critical_reported
    priority: str = "medium"  # low, medium, high, critical
    is_critical: bool = False
    turnaround_hours: float = 0.0
    expected_ready: datetime
    cost: float
    ordered_by: str
    result_available: bool = False

    class Settings:
        name = "lab_orders"
        indexes = [
            IndexModel([("order_id", ASCENDING)], unique=True),
            [("patient_id", 1), ("status", 1)],
            [("category", 1), ("ordered_at", 1)],
        ]
