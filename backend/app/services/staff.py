"""
MediSphere AI — Staff & Department Services
"""

from app.models.hospital import Department, Doctor
from app.repositories.base import BaseRepository
from app.repositories.core import DoctorRepository
from app.services.base import BaseService


class DepartmentRepository(BaseRepository[Department]):
    def __init__(self):
        super().__init__(Department)


class StaffService(BaseService[Doctor]):
    def __init__(self):
        super().__init__(DoctorRepository())

    async def get_by_department(self, department_id: str) -> list[Doctor]:
        return await self.repository.get_by_department(department_id)


class DepartmentService(BaseService[Department]):
    def __init__(self):
        super().__init__(DepartmentRepository())

    async def get_active_departments(self) -> list[Department]:
        return await self.repository.get_multi(query={"status": "ACTIVE"})
