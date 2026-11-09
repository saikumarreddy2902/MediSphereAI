# Security Governance Policy — MediSphere AI

## 1. Secrets Management Policy
* Zero plain-text credentials, passwords, or API keys allowed in version control.
* All secrets MUST be injected via Environment Variables in container deployment environments.
* GitLeaks secret scanning runs automatically on every Git commit and PR.
* Default template secrets in `.env.example` must contain only sanitized placeholders.

## 2. Password & Key Hashing Policy
* User passwords MUST be hashed using the **Argon2id** algorithm (`passlib[argon2]`).
* JWT signing secret keys MUST have a minimum entropy of 256 bits (32 bytes).
* Token expiration MUST be enforced: Access tokens expire within 60 minutes; refresh tokens expire within 7 days.

## 3. Vulnerability Patch Management
* High and Critical CVE vulnerabilities identified by Trivy container scans MUST be remediated within 7 days.
* Dependabot runs weekly dependency updates across Python and Node.js ecosystems.
* Container base images must use hardened minimal distributions (e.g., Alpine or Debian-slim).

## 4. Authentication & Role-Based Access Control (RBAC)
* Self-registration endpoints MUST disallow administrative role self-assignment (`is_superuser=False` enforced by default).
* All Clinical and Protected Health Information (PHI) endpoints MUST require valid Bearer token authentication via `get_current_user`.
* Role enforcement (`RoleChecker`) must restrict clinical endpoints to authorized roles (`admin`, `doctor`, `nurse`, `pharmacist`, `billing`).
* Edge route verification in frontend middleware MUST validate cryptographic signatures (via `jose` / JWT) rather than trusting unsigned plaintext client cookies.

## 5. Protected Health Information (PHI) & HIPAA Compliance
* All patient identifiers (MRN, SSN/Aadhaar, contact details, diagnoses) are classified as Restricted PHI.
* Clinical search endpoints MUST escape user input with regex escaping (`re.escape`) to prevent ReDoS and regex injection.
* Data persistence operations MUST fail closed: database errors must never be swallowed or replaced with ephemeral in-memory state.
* Database connections must enforce TLS encryption in transit (`mongodb+srv` with TLS 1.3).

## 6. Network Security & API Hardening
* Strict Cross-Origin Resource Sharing (CORS) must explicitly whitelist trusted frontend origins. Wildcard (`*`) is forbidden in production.
* HTTP Strict Transport Security (HSTS), Content-Security-Policy (CSP), and X-Frame-Options headers must be set on all HTTP responses.
* Rate limiting is enforced across all public and authenticated API endpoints to mitigate brute force and denial of service attacks.

## 7. Audit Logging & Compliance Traceability
* Every creation, modification, access, or cancellation of clinical records, prescriptions, and billing claims MUST generate an immutable `AuditLog` entry.
* Audit records must capture timestamp (UTC), user ID, IP address, resource type, and action taken.
* Audit records must be retained in an append-only collection for a minimum of 6 years per HIPAA requirements.
