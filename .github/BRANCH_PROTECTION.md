# GitHub Enterprise Branch Protection & Merge Gates

This guide configures the GitHub repository settings so that **no code can be pushed or merged to `main` or `develop`** unless all enterprise test cases, CI pipelines, and security gates pass.

---

## 1. Branch Protection Rules Setup

Navigate to your GitHub repository:
**Settings** > **Branches** > **Add branch protection rule** (or edit existing rule for `main` and `develop`).

### Branch name pattern
- Apply rule to: `main`
- (Recommended) Create an additional rule for: `develop`

---

## 2. Mandatory Security & Quality Settings

Enable the following checkboxes:

### A. Require a pull request before merging
- [x] **Require approvals**: `1` (or 2 for enterprise compliance).
- [x] **Dismiss stale pull request approvals when new commits are pushed**.
- [x] **Require review from Code Owners** (enforces `.github/CODEOWNERS`).

### B. Require status checks to pass before merging
- [x] **Require branches to be up to date before merging**.
- In the search box, select the following **required status checks**:
  1. `Backend Tests & Coverage` (`backend-tests` from `ci.yml`)
  2. `Frontend Lint, TypeCheck & Build` (`frontend-ci` from `ci.yml`)
  3. `Docker Container Build Verification` (`docker-build` from `ci.yml`)
  4. `Secret Scanner (Gitleaks)` (`secret-scan` from `security.yml`)
  5. `Python SAST Scanner (Bandit)` (`python-sast` from `security.yml`)
  6. `Dependency Vulnerability Audit` (`dependency-audit` from `security.yml`)
  7. `Container Security Scanner (Trivy)` (`container-security` from `security.yml`)
  8. `CodeQL Analysis (python)` (`analyze` from `codeql.yml`)
  9. `CodeQL Analysis (javascript-typescript)` (`analyze` from `codeql.yml`)

### C. Enterprise Enforcement
- [x] **Do not allow bypassing the above settings** (applies to repository administrators and bots).
- [x] **Require linear history** (prevents messy merge commits; enforces rebase or squash).
- [x] **Require signed commits** (ensures cryptographic commit authenticity).
- [x] **Block force pushes** (disallows `git push --force`).
- [x] **Block deletions** (prevents deleting protected branches).

---

## 3. Workflow Summary

| Workflow File | Trigger Events | Checks Performed | Failure Action |
|:---|:---|:---|:---|
| `.github/workflows/ci.yml` | `push`, `pull_request` | Ruff linter, 91 Pytest test cases, Next.js build, TypeScript typecheck, Docker build | Blocks merge / push |
| `.github/workflows/security.yml` | `push`, `pull_request`, nightly cron | GitLeaks secret scanning, Bandit Python SAST, pip-audit & npm audit, Trivy container CVEs | Blocks merge / push |
| `.github/workflows/codeql.yml` | `push`, `pull_request`, weekly cron | GitHub CodeQL static analysis for Python & JS/TS | Flags security vulnerabilities & blocks merge |
| Local `.husky/pre-commit` | `git commit` | Secret detection, API keys, .env detection, Ruff check | Blocks commit locally |
| Local `.husky/pre-push` | `git push` | Pytest test suite, TypeScript compile check | Blocks push locally |
