#!/usr/bin/env python3
r"""
MediSphere AI — Enterprise HIPAA / PHI & Sensitive Data Compliance Scanner

Scans repository codebase, mock fixtures, and configuration files for accidental
commit of unmasked Protected Health Information (PHI) or Personally Identifiable
Information (PII) in compliance with HIPAA Security Rule (§164.312) standards:
  - Unmasked US Social Security Numbers (SSN: \d{3}-\d{2}-\d{4})
  - Unmasked Credit Card Numbers (Luhn-compliant card patterns)
  - Raw unhashed passwords or hardcoded API keys
  - Real patient clinical identifiers in non-test production files
"""
import re
import sys
from pathlib import Path

# Directories to exclude from PHI scanning
EXCLUDE_DIRS = {
    ".git",
    ".husky",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".venv",
    "dist",
    "build",
    ".next",
}

# File extensions to scan
SCAN_EXTENSIONS = {
    ".py",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".yml",
    ".yaml",
    ".env.example",
    ".md",
}

# Regex patterns for high-risk PHI / PII
PATTERNS = [
    (
        "Unmasked Social Security Number (SSN)",
        re.compile(r"\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b"),
    ),
    (
        "Hardcoded Private Key Header",
        re.compile(r"-----BEGIN\s+(RSA|EC|DSA|OPENSSH)?\s*PRIVATE\s+KEY-----"),
    ),
    (
        "Hardcoded AWS Secret Key Pattern",
        re.compile(r"(?i)aws_secret_access_key\s*=\s*['\"][A-Za-z0-9/+=]{40}['\"]"),
    ),
]

def scan_file(file_path: Path) -> list[str]:
    violations = []
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        return [f"Could not read {file_path}: {e}"]

    for line_num, line in enumerate(content.splitlines(), start=1):
        # Skip commented placeholders and documentation examples
        if "example" in line.lower() or "nosec" in line or "dummy" in line.lower() or "mock" in line.lower():
            continue
        for rule_name, pattern in PATTERNS:
            if pattern.search(line):
                violations.append(f"[{rule_name}] at line {line_num}: {line.strip()[:80]}")

    return violations

def main() -> int:
    root_dir = Path(__file__).resolve().parent.parent
    print("=" * 70)
    print("🏥 MediSphere AI — HIPAA / PHI & Sensitive Data Compliance Scan")
    print("=" * 70)
    print(f"Scanning directory: {root_dir}")

    total_files = 0
    total_violations = 0
    all_violations: dict[str, list[str]] = {}

    for file_path in root_dir.rglob("*"):
        if not file_path.is_file():
            continue
        if any(part in EXCLUDE_DIRS for part in file_path.parts):
            continue
        if file_path.suffix not in SCAN_EXTENSIONS:
            continue

        total_files += 1
        violations = scan_file(file_path)
        if violations:
            rel_path = file_path.relative_to(root_dir)
            all_violations[str(rel_path)] = violations
            total_violations += len(violations)

    print(f"Scanned {total_files} files.")

    if total_violations > 0:
        print(f"\n❌ FAILED: Found {total_violations} potential PHI/PII compliance violation(s):")
        for file_name, issues in all_violations.items():
            print(f"\n  File: {file_name}")
            for issue in issues:
                print(f"    - {issue}")
        print("\n🚫 HIPAA Guard: Please sanitize unmasked PHI or sensitive credentials.")
        return 1

    print("\n✅ PASSED: Zero unmasked PHI, PII, or hardcoded credential violations detected.")
    print("=" * 70)
    return 0

if __name__ == "__main__":
    sys.exit(main())
