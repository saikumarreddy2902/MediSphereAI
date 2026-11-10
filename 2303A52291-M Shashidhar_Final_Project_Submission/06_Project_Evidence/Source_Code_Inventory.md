# MediSphere AI: Source Code Inventory

This document provides a comprehensive inventory of all source code files, configurations, scripts, and deployment artifacts that comprise the MediSphere AI Hospital Management System.

---

## 1. Backend Architecture (`backend/`)

| File Path | Component / Layer | Primary Purpose | Lines of Code |
| :--- | :--- | :--- | :--- |
| `app/main.py` | Application Entrypoint | FastAPI bootstrap, lifespan management, middleware registration, router mounting | ~120 |
| `app/core/config.py` | Configuration Layer | Pydantic Settings management, environment variable injection, JWT secret configuration | ~80 |
| `app/core/security.py` | Security Layer | Argon2id password hashing, JWT token generation, token decoding and claim validation | ~100 |
| `app/core/cache.py` | Caching Layer | High-performance in-memory TTL caching with Redis fallback adapter | ~75 |
| `app/core/vector_store.py` | Semantic AI Memory | Qdrant vector database client connection, embedding indexing, semantic search | ~110 |
| `app/database/connection.py`| Persistence Engine | MongoDB Atlas asynchronous client initialization via Motor and Beanie ODM | ~65 |
| `app/api/deps.py` | Security Dependencies | OAuth2 Bearer token extraction, user retrieval, Role-Based Access Control (RBAC) guard | ~95 |
| `app/agents/base_agent.py` | Multi-Agent Foundation| Base class for autonomous agents, AgentOutput schema, execution interfaces | ~75 |
| `app/agents/orchestrator.py`| Supervisor Engine | LangGraph StateGraph DAG coordinator with resilient native async DAG fallback | ~280 |
| `app/api/v1/auth.py` | Controller | User login, credential verification, JWT token issuance, user registration | ~140 |
| `app/api/v1/patients.py` | Controller | Patient admission, EHR profile updates, search by UHID, patient portal summaries | ~210 |
| `app/api/v1/appointments.py`| Controller | Doctor schedule lookup, appointment booking, slot conflict resolution | ~260 |
| `app/api/v1/prescriptions.py`| Controller | Digital prescription generation, dosage validation, allergy cross-check, refills | ~180 |
| `app/api/v1/emergency.py` | Controller | Emergency triage acuity scoring (ESI), queue dispatch, ambulance telemetry | ~160 |
| `app/api/v1/beds.py` | Controller | Bed inventory tracking, ward occupancy calculations, transfer workflows | ~150 |
| `app/api/v1/laboratory.py` | Controller | Diagnostic test ordering, specimen tracking, pathology report attachment | ~140 |
| `app/api/v1/billing.py` | Controller | Inpatient and outpatient invoice creation, payment status tracking | ~130 |
| `app/api/v1/insurance.py` | Controller | Insurance pre-authorization submission, claims status management | ~125 |
| `app/api/v1/staff.py` | Controller | Staff directory, physician specialization mapping, shift duty roster | ~145 |
| `app/api/v1/audit.py` | Compliance Layer | HIPAA-compliant immutable audit log retrieval and security event queries | ~90 |
| `app/api/v1/websocket.py` | Telemetry Hub | Bidirectional WebSocket server broadcasting real-time operational events | ~115 |
| `app/api/v1/analytics.py` | Analytics Engine | Executive KPI aggregation, bed occupancy rates, triage wait-time analytics | ~135 |

---

## 2. Frontend Application (`frontend/`)

| File Path | Component / Layer | Primary Purpose |
| :--- | :--- | :--- |
| `app/layout.tsx` | Root Layout | Global HTML document wrapper, dark mode root, typography, metadata |
| `app/globals.css` | Styling System | Tailwind CSS directives, glassmorphic styling, light/dark contrast rules |
| `app/login/page.tsx` | Authentication UI | User login form, registration toggle, role demo quick-login buttons |
| `app/dashboard/page.tsx` | Executive Dashboard | High-level telemetry, live KPIs, bed occupancy charts, agent action feeds |
| `app/dashboard/patient-portal/page.tsx` | Patient Portal | Dynamic patient profile, appointments, active medications, printable Rx |
| `app/dashboard/appointments/book/page.tsx`| Appointment Booking | Doctor slot picker, department selector, appointment confirmation |
| `app/dashboard/appointments/page.tsx` | Appointments List | Physician schedule overview, patient check-in actions |
| `app/dashboard/prescriptions/page.tsx` | Pharmacy & Rx | Prescription lifecycle management, status badges, refill requests |
| `app/dashboard/patients/page.tsx` | Patient Management | Patient directory, new admission modal, medical summary badges |
| `app/dashboard/emergency/page.tsx` | Emergency Triage | Live ESI emergency room triage queue, code alert dispatchers |
| `app/dashboard/beds/page.tsx` | Bed Intelligence | Interactive ward grid (ICU, General, Emergency) with transfer actions |
| `app/dashboard/medical-records/page.tsx` | Clinical EHR | Detailed diagnostic histories, lab report viewer, physician notes |
| `app/dashboard/staff/schedule/page.tsx` | Duty Roster | Staff shift calendar, physician on-call coverage management |
| `app/dashboard/billing/page.tsx` | Hospital Billing | Patient invoices, payment processing, itemized hospital bill breakdown |
| `app/dashboard/insurance/page.tsx` | Insurance Claims | Insurance pre-authorization status and policy verification |
| `app/dashboard/audit-logs/page.tsx` | Security Logs | HIPAA-compliant searchable audit trail of clinical modifications |
| `app/dashboard/agents/page.tsx` | AI Telemetry | Autonomous multi-agent status, real-time insights, priority action items |
| `app/unauthorized/page.tsx` | Security Guard UI | RBAC access denied warning screen with return navigation |
| `middleware.ts` | Edge Middleware | Next.js route protection, session cookie inspection, RBAC redirection |
| `lib/services/api-service.ts` | Network Layer | Axios HTTP client configured with automatic Bearer token injection |
| `lib/hooks/useWebSocket.ts` | Real-time Hook | Auto-reconnecting WebSocket client hook for live hospital telemetry |

---

## 3. DevOps, Automation & Testing

| File Path | Category | Purpose |
| :--- | :--- | :--- |
| `docker-compose.yml` | Containerization | Complete stack orchestration (Backend, Frontend, Redis, Qdrant, Nginx) |
| `docker-compose.prod.yml`| Production Deploy | Production-hardened container stack with SSL reverse proxy |
| `start_servers.bat` | Windows Launcher | Automated script to launch backend and frontend simultaneously in separate windows |
| `push_to_github.bat` | Git Automation | Automated script to push commits interactively with credential helper support |
| `pytest.ini` & `backend/pytest.ini`| Test Config | Pytest configuration and test runner options |
| `backend/tests/` | Backend Test Suite | Automated tests for Auth, Patients, Beds, Agents, Appointments, Prescriptions |
| `frontend/__tests__/` | Frontend Test Suite | Unit tests for document printing and client utility functions |
