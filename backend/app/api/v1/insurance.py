"""
MediSphere AI — Insurance API
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.services.finance import InsuranceService
from app.schemas.insurance import InsuranceClaimCreate, InsuranceClaimUpdate, InsuranceClaimResponse

router = APIRouter()

def get_insurance_service() -> InsuranceService:
    return InsuranceService()

@router.get("/claims", response_model=List[InsuranceClaimResponse])
async def get_all_claims(
    patient_id: Optional[str] = None,
    claim_status: Optional[str] = None,
    service: InsuranceService = Depends(get_insurance_service)
):
    """Get all insurance claims"""
    query = {}
    if patient_id:
        query["patient_id"] = patient_id
    if claim_status:
        query["claim_status"] = claim_status
    return await service.repository.get_multi(query=query)

@router.get("/claims/pending", response_model=List[InsuranceClaimResponse])
async def get_pending_claims(service: InsuranceService = Depends(get_insurance_service)):
    """Get pending insurance claims"""
    return await service.get_pending_claims()

@router.post("/claims", response_model=InsuranceClaimResponse, status_code=status.HTTP_201_CREATED)
async def submit_claim(
    claim_in: InsuranceClaimCreate,
    service: InsuranceService = Depends(get_insurance_service)
):
    """Submit a new insurance claim"""
    import random
    claim_num = f"CLM-{random.randint(100000, 999999)}"
    
    claim_dict = claim_in.model_dump()
    claim_dict["claim_number"] = claim_num
    claim_dict["claim_status"] = "SUBMITTED"
    claim_dict["submission_date"] = datetime.utcnow()
    
    return await service.repository.create(claim_dict)

@router.put("/claims/{claim_id}", response_model=InsuranceClaimResponse)
async def update_claim_status(
    claim_id: str,
    claim_update: InsuranceClaimUpdate,
    service: InsuranceService = Depends(get_insurance_service)
):
    """Update status of a claim (Approve / Reject)"""
    claim = await service.get_or_404(claim_id)
    update_data = claim_update.model_dump(exclude_unset=True)
    if "resolution_date" not in update_data and claim_update.claim_status in ["APPROVED", "REJECTED"]:
        update_data["resolution_date"] = datetime.utcnow()
    return await service.repository.update(claim, update_data)
