"""Analytics API"""
from datetime import UTC

from app.mock.data_generator import (
    get_daily_revenue,
    get_department_performance,
    get_hospital_kpis,
    get_hourly_patient_flow,
    get_predictive_data,
    rand_float,
)
from fastapi import APIRouter

router = APIRouter()

@router.get("/kpis/history")
async def get_kpi_history(metric: str = "bed_occupancy_rate", days: int = 30):
    from datetime import timedelta

    from app.mock.data_generator import _now
    data = []
    base = _now()
    for d in range(days, 0, -1):
        day = base - timedelta(days=d)
        data.append({
            "date": day.strftime("%b %d"),
            "value": rand_float(60, 95, 1),
        })
    return {"metric": metric, "data": data}

@router.get("/patient-flow/hourly")
async def get_hourly_flow():
    return get_hourly_patient_flow(24)

@router.get("/revenue/daily")
async def get_daily_revenue_data():
    return get_daily_revenue(30)

@router.get("/departments")
async def get_dept_performance():
    return get_department_performance()

@router.get("/predictions")
async def get_predictions():
    return get_predictive_data()

@router.get("/summary")
async def get_analytics_summary():
    return {
        "kpis": get_hospital_kpis(),
        "patient_flow": get_hourly_patient_flow(24),
        "department_performance": get_department_performance(),
        "predictions": get_predictive_data(),
        "revenue": get_daily_revenue(7),
    }

@router.get("/root-cause")
async def get_root_cause_analysis():
    return {
        "analysis": {
            "issue": "Increased average waiting time (+34%)",
            "root_causes": [
                {"level": 1, "cause": "Emergency department overcrowding", "confidence": 0.92},
                {"level": 2, "cause": "ICU beds unavailable (96% occupancy)", "confidence": 0.88},
                {"level": 3, "cause": "Delayed patient discharge (avg +6h)", "confidence": 0.85},
                {"level": 4, "cause": "Night shift nursing shortage", "confidence": 0.79},
                {"level": 5, "cause": "Increased weekend patient arrivals", "confidence": 0.74},
            ],
            "recommended_actions": [
                "Deploy additional night nurses",
                "Expedite discharge for stable patients",
                "Open overflow ward",
            ],
        }
    }


@router.get("/prescriptions")
async def get_prescription_analytics():
    """
    Aggregated prescription metrics for the analytics dashboard.
    Returns status breakdown, top medications, and dispensing speed.
    """

    from app.models.prescription import Prescription

    all_prescriptions = await Prescription.find_all().to_list()

    # Status breakdown
    status_counts: dict = {}
    for p in all_prescriptions:
        status_counts[p.status] = status_counts.get(p.status, 0) + 1

    # Top medications
    med_freq: dict = {}
    for p in all_prescriptions:
        for m in p.medications:
            name = m.medicine_name
            med_freq[name] = med_freq.get(name, 0) + 1
    top_meds = sorted(med_freq.items(), key=lambda x: x[1], reverse=True)[:10]

    # Dispensing speed (avg hours from issue to dispense for DISPENSED prescriptions)
    dispensed = [p for p in all_prescriptions if p.status == "DISPENSED" and p.dispensed_at and p.issued_at]
    avg_dispense_hours = 0.0
    if dispensed:
        durations = [(p.dispensed_at - p.issued_at).total_seconds() / 3600 for p in dispensed]
        avg_dispense_hours = round(sum(durations) / len(durations), 1)

    # Expiry rate
    total = len(all_prescriptions)
    expired = status_counts.get("EXPIRED", 0)
    expiry_rate = round((expired / total * 100) if total else 0, 1)

    return {
        "total_prescriptions": total,
        "status_breakdown": [
            {"status": k, "count": v}
            for k, v in status_counts.items()
        ],
        "top_medications": [
            {"name": name, "count": count}
            for name, count in top_meds
        ],
        "avg_dispensing_hours": avg_dispense_hours,
        "expiry_rate_percent": expiry_rate,
    }


@router.post("/export", summary="Export Hospital Analytical Reports (CSV / JSON)")
async def export_report(
    report_type: str = "census",  # census | revenue | occupancy | prescriptions
    format: str = "json",         # json | csv
    date_range: str = "30d",
):
    """
    Generates and returns structured analytical report exports for hospital administrators.
    """
    import csv
    import io
    from datetime import datetime

    from fastapi.responses import StreamingResponse

    timestamp_str = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S")

    # Sample compiled dataset according to report_type
    report_datasets = {
        "census": {
            "title": "Hospital Inpatient Census & Admission Report",
            "headers": ["Department", "Admissions", "Discharges", "Transfers", "Avg Length of Stay (Days)", "Mortality %"],
            "rows": [
                ["Cardiology", "48", "42", "3", "4.2", "0.4%"],
                ["Neurology", "32", "29", "2", "6.1", "0.8%"],
                ["Orthopedics", "56", "54", "1", "3.5", "0.0%"],
                ["Pediatrics", "41", "40", "0", "2.8", "0.1%"],
                ["General Medicine", "95", "88", "4", "4.9", "0.5%"],
                ["Intensive Care Unit (ICU)", "24", "18", "6", "8.2", "2.1%"],
            ],
            "kpis": {"total_admissions": 296, "total_discharges": 271, "avg_stay": 4.95},
        },
        "revenue": {
            "title": "Revenue & Billing Collections Summary",
            "headers": ["Service Center", "Gross Invoiced", "Insurance Claims", "Patient Co-Pay", "Pending", "Net Realized"],
            "rows": [
                ["Inpatient Services", "₹1,420,000", "₹1,180,000", "₹240,000", "₹120,000", "₹1,300,000"],
                ["Outpatient Consults", "₹480,000", "₹220,000", "₹260,000", "₹35,000", "₹445,000"],
                ["Diagnostic Laboratory", "₹650,000", "₹490,000", "₹160,000", "₹45,000", "₹605,000"],
                ["Pharmacy Dispensing", "₹890,000", "₹560,000", "₹330,000", "₹60,000", "₹830,000"],
                ["Emergency Triage", "₹340,000", "₹280,000", "₹60,000", "₹25,000", "₹315,000"],
            ],
            "kpis": {"gross_revenue": "₹3,780,000", "insurance_collected": "₹2,730,000", "realization_rate": "92.4%"},
        },
        "occupancy": {
            "title": "Bed Utilization & Operational Capacity Report",
            "headers": ["Ward", "Total Beds", "Occupied", "Available", "Maintenance", "Occupancy Rate"],
            "rows": [
                ["ICU", "20", "17", "2", "1", "85.0%"],
                ["Cardiac Care (CCU)", "16", "13", "3", "0", "81.3%"],
                ["Post-Operative", "24", "18", "5", "1", "75.0%"],
                ["General Ward A", "40", "32", "7", "1", "80.0%"],
                ["General Ward B", "40", "28", "11", "1", "70.0%"],
                ["Pediatric Unit", "18", "12", "6", "0", "66.7%"],
            ],
            "kpis": {"total_capacity": 158, "currently_occupied": 120, "overall_occupancy": "75.9%"},
        },
    }

    data = report_datasets.get(report_type, report_datasets["census"])

    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([data["title"]])
        writer.writerow([f"Generated at: {timestamp_str} | Range: {date_range}"])
        writer.writerow([])
        writer.writerow(data["headers"])
        for r in data["rows"]:
            writer.writerow(r)
        output.seek(0)
        resp = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
        resp.headers["Content-Disposition"] = f"attachment; filename=medisphere_{report_type}_report.csv"
        return resp

    return {
        "report_type": report_type,
        "title": data["title"],
        "generated_at": timestamp_str,
        "date_range": date_range,
        "headers": data["headers"],
        "rows": data["rows"],
        "kpis": data["kpis"],
    }

