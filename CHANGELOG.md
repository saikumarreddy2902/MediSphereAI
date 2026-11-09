# Changelog — MediSphere AI

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-10-05

### Added
- **Medical Records Module**: Complete end-to-end clinical medical records domain with Beanie ODM models (`MedicalRecord`), schema definitions, dedicated service layer (`services/medical_records.py`), REST API endpoints, and a Next.js 14 frontend management page.
- **Prescriptions Management & Safety**: Prescription lifecycle engine with drug-drug interaction checker, allergy warning cross-referencing, prescription renewal endpoint (`POST /prescriptions/{id}/renew`), dispensing, cancellation audit trails, and interactive UI.
- **Persistent Notifications & Live Dropdown**: Backend notifications collection and service with live header dropdown, unread count badge, and mark-all-as-read integration.
- **User Profile & Security Page**: User account settings page at `/dashboard/profile` with real-time profile loading, role visualization, security session controls, and notification preference toggles.
- **Full-Stack Centralized API Service**: Comprehensive TypeScript service module (`frontend/lib/services/api-service.ts`) covering all 18 backend domain endpoints with type safety and fallback resilience.
- **Multi-Agent DAG Workflow Engine**: Added LangGraph StateGraph choreography pipeline to `AgentOrchestrator` (`run_pipeline_workflow`), connecting emergency, beds, staff, recommendations, and executive decision-making.
- **Pytest API Test Suites**: Added comprehensive automated tests for Prescriptions, Medical Records, Notifications, Appointments, Emergency, and Staff APIs.
- **Idempotent Seeding Script**: Extended `seed.py` to seed medical records, prescriptions, and live notification alerts across Atlas MongoDB collections.
- **Premium 404 Experience**: Implemented dedicated `not-found.tsx` with smooth gradients, MediSphere theme aesthetics, and direct routing back to active workflows.

### Fixed
- **Laboratory Schema & Repository Alignment**: Resolved `LabOrderResponse` alias serialization compatibility with Beanie `PydanticObjectId`.
- **Auth Session Persistence**: Configured Zustand `persist` middleware on `useAuthStore` to maintain authentication state seamlessly across page refreshes.
- **Login Rate Limiting**: Added strict `@limiter.limit("5/minute")` to `POST /auth/login` to thwart brute-force vectors.

## [1.0.0] - 2026-08-06

### Added
- **Complete Enterprise SDLC Ecosystem**: Added 16 structured SDLC phase documentations in `docs/`.
- **OpenAPI & Postman Specifications**: Published OpenAPI 3.1.0 JSON and Postman Collection v2.1.
- **Telemetry & Metrics**: Integrated OpenTelemetry and `/metrics` Prometheus telemetry middleware in FastAPI.
- **DevSecOps Pipeline**: Configured GitHub Actions CI/CD workflows for container scanning, SBOM generation, and secret scanning.
- **Observability Stack**: Added Prometheus configuration and Grafana dashboard specifications.
- **Architecture Decision Records**: Created ADR-001 through ADR-005.
- **Automated Testing Suite**: Implemented pytest test suite validating health checks, metrics, and error routing.
