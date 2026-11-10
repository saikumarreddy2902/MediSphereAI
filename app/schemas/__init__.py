"""
MediSphere AI — Pydantic Schemas Package

Exports all request/response schema classes for use in API route handlers.
Keeping schemas separate from Beanie ODM document models enforces Clean Architecture
by decoupling the API contract from the persistence layer.
"""
from app.schemas.appointments import AppointmentCreate, AppointmentResponse, AppointmentUpdate
from app.schemas.auth import LoginRequest, TokenResponse, UserProfileResponse
from app.schemas.beds import (
    BedAssignRequest,
    BedCreate,
    BedDashboardSummary,
    BedResponse,
    BedUpdate,
)
from app.schemas.billing import BillCreate, BillingStats, BillResponse, InvoiceItemSchema
from app.schemas.common import ErrorResponse, PaginatedResponse, SuccessResponse
from app.schemas.emergency import EmergencyCaseCreate, EmergencyCaseResponse, EmergencyCaseUpdate
from app.schemas.equipment import EquipmentCreate, EquipmentResponse, EquipmentUpdate
from app.schemas.insurance import InsuranceClaimCreate, InsuranceClaimResponse, InsuranceClaimUpdate
from app.schemas.laboratory import LabOrderCreate, LabOrderResponse, LabOrderUpdate
from app.schemas.medical_records import (
    MedicalRecordCreate,
    MedicalRecordResponse,
    MedicalRecordUpdate,
)
from app.schemas.patients import PatientCreate, PatientListResponse, PatientResponse, PatientUpdate
from app.schemas.pharmacy import (
    InventoryCreate,
    InventoryResponse,
    MedicineCreate,
    MedicineResponse,
    MedicineUpdate,
)
from app.schemas.prescriptions import (
    DrugInteractionWarning,
    PrescribedMedicationIn,
    PrescriptionCreate,
    PrescriptionRenewRequest,
    PrescriptionResponse,
    ValidateRequest,
)
from app.schemas.staff import StaffCreate, StaffResponse, StaffRosterSummary, StaffUpdate

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
    # Laboratory
    "LabOrderCreate", "LabOrderUpdate", "LabOrderResponse",
    # Medical Records
    "MedicalRecordCreate", "MedicalRecordResponse", "MedicalRecordUpdate",
    # Prescriptions
    "DrugInteractionWarning", "PrescribedMedicationIn", "PrescriptionCreate",
    "PrescriptionRenewRequest", "PrescriptionResponse", "ValidateRequest",
]
