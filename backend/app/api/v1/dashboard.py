"""Dashboard API — aggregated KPIs and overview data"""
from app.mock.data_generator import (
    get_agents_status,
    get_daily_revenue,
    get_department_performance,
    get_hospital_kpis,
    get_hourly_patient_flow,
    get_predictive_data,
    get_recommendations,
)
from fastapi import APIRouter

router = APIRouter()

@router.get("/kpis")
async def get_kpis():
    return get_hospital_kpis()

@router.get("/overview")
async def get_overview():
    kpis = get_hospital_kpis()
    return {
        "kpis": kpis,
        "patient_flow": get_hourly_patient_flow(24),
        "department_performance": get_department_performance(),
        "top_recommendations": get_recommendations()[:5],
        "active_agents": len([a for a in get_agents_status() if a["status"] == "running"]),
        "critical_alerts": [r for r in get_recommendations() if r["priority"] == "critical"],
    }

@router.get("/patient-flow")
async def get_patient_flow():
    return get_hourly_patient_flow(24)

@router.get("/revenue")
async def get_revenue():
    return get_daily_revenue(30)

@router.get("/department-performance")
async def get_dept_performance():
    return get_department_performance()

@router.get("/predictions")
async def get_predictions():
    return get_predictive_data()
