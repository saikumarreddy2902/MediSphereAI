"""
MediSphere AI — Pydantic Schemas Package

Exports all request/response schema classes for use in API route handlers.
Keeping schemas separate from Beanie ODM document models enforces Clean Architecture
by decoupling the API contract from the persistence layer.
"""
from app.schemas.auth import (
    LoginRequest, TokenResponse, UserProfileResponse
)
from app.schemas.patients import (
    PatientCreate, PatientUpdate, PatientResponse, PatientListResponse
)
from app.schemas.beds import (
    BedCreate, BedUpdate, BedResponse, BedAssignRequest, BedDashboardSummary
)
from app.schemas.emergency import (
    EmergencyCaseCreate, EmergencyCaseUpdate, EmergencyCaseResponse
)
from app.schemas.appointments import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse
)
from app.schemas.pharmacy import (
    MedicineCreate, MedicineUpdate, MedicineResponse,
    InventoryCreate, InventoryResponse
)
from app.schemas.equipment import (
    EquipmentCreate, EquipmentUpdate, EquipmentResponse
)
from app.schemas.billing import (
    BillCreate, BillResponse, BillingStats, InvoiceItemSchema
)
from app.schemas.insurance import (
    InsuranceClaimCreate, InsuranceClaimUpdate, InsuranceClaimResponse
)
from app.schemas.staff import (
    StaffCreate, StaffUpdate, StaffResponse, StaffRosterSummary
)
from app.schemas.common import (
    PaginatedResponse, SuccessResponse, ErrorResponse
)

__all__ = [
    # Auth
    "LoginRequest", "TokenResponse", "UserProfileResponse",
    # Patients
    "PatientCreate", "PatientUpdate", "PatientResponse", "PatientListResponse",
    # Beds
    "BedCreate", "BedUpdate", "BedResponse", "BedAssignRequest", "BedDashboardSummary",
    # Emergency
    "EmergencyCaseCreate", "EmergencyCaseUpdate", "EmergencyCaseResponse",
    # Appointments
    "AppointmentCreate", "AppointmentUpdate", "AppointmentResponse",
    # Pharmacy
    "MedicineCreate", "MedicineUpdate", "MedicineResponse",
    "InventoryCreate", "InventoryResponse",
    # Equipment
    "EquipmentCreate", "EquipmentUpdate", "EquipmentResponse",
    # Billing
    "BillCreate", "BillResponse", "BillingStats", "InvoiceItemSchema",
    # Insurance
    "InsuranceClaimCreate", "InsuranceClaimUpdate", "InsuranceClaimResponse",
    # Staff
    "StaffCreate", "StaffUpdate", "StaffResponse", "StaffRosterSummary",
    # Common
    "PaginatedResponse", "SuccessResponse", "ErrorResponse",
]
