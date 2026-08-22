"""
MediSphere AI — Finance Services (Billing & Insurance)
"""
from typing import List
from fastapi import HTTPException, status
from app.services.base import BaseService
from app.repositories.core import BillRepository, InsuranceClaimRepository
from app.models.finance import Bill, InsuranceClaim


class BillingService(BaseService[Bill]):
    def __init__(self):
        super().__init__(BillRepository())

    async def get_revenue_summary(self) -> dict:
        """Calculate hospital revenue KPIs"""
        bills = await self.repository.get_multi(limit=1000)
        total = sum(b.total_amount for b in bills)
        collected = sum(b.amount_paid for b in bills)
        
        return {
            "total_billed": total,
            "total_collected": collected,
            "pending_amount": total - collected
        }

    async def get_pending_bills(self) -> List[Bill]:
        return await self.repository.get_pending_bills()


class InsuranceService(BaseService[InsuranceClaim]):
    def __init__(self):
        super().__init__(InsuranceClaimRepository())

    async def get_pending_claims(self) -> List[InsuranceClaim]:
        return await self.repository.get_multi(query={"claim_status": {"$in": ["SUBMITTED", "IN_REVIEW"]}})
