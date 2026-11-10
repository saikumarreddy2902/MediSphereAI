# 🏥 MediSphere AI: Master Project Submission Package

**Project Title:** HOSPITAL MANAGEMENT SYSTEM — Secure Multi-Agent AI Platform for Patient-Centric Healthcare  
**Institution:** SR University, School of Computer Science and Artificial Intelligence  
**Address:** Ananthasagar, Hasanparthy, Warangal – 506 371  

### **Project Team**
- **M. Shashidhar** — `2303A52291` *(Student Lead)*
- **K. Sai Kumar Reddy** — `2303A52223`
- **G. Mani Sharan Deep Reddy** — `2303A52148`
- **V. Abhinav** — `2303A52174`

### **Faculty Guide**
- **Dr. Ranjeeth Kumar M**  
  Associate Professor, Department of Computer Science and Artificial Intelligence  
  SR University, Warangal  

---

## 📁 Master Deliverable Folder Structure

This directory (`2303A52291-M Shashidhar_Final_Project_Submission/`) contains every deliverable, evidence artifact, architecture diagram, screenshot, test report, and document required by the university rules:

```
2303A52291-M Shashidhar_Final_Project_Submission/
│
├── 01_Final_Report/
│   ├── 2303A52291-M Shashidhar Final Report.docx   # Complete University Standard Final Report
│   └── 2303A52291-M Shashidhar Final Report.pdf    # Pixel-perfect Rendered PDF Version
│
├── 02_Official_Template/
│   └── SR_University_Official_First_Six_Pages.docx # Official Certificate, Declaration, TOC format
│
├── 03_Architecture_Diagrams/
│   ├── Overall_Architecture.png                    # High-level Tiered Modular Monolith
│   ├── Component_Architecture.png                  # Decomposed Subsystems & Event Bus
│   ├── Frontend_Backend_Architecture.png           # Protocol & Telemetry Layering
│   ├── Multi_Agent_Architecture.png                # Autonomous Agent Swarm & Supervisor
│   ├── Authentication_Flow.png                     # Argon2id & JWT Token Issuance Workflow
│   ├── RBAC_Architecture.png                       # Permission Matrix across 4 User Roles
│   ├── Database_Architecture.png                   # MongoDB NoSQL Document Schemas
│   ├── DFD_Level_0.png                             # Context-level Data Flow Diagram
│   ├── DFD_Level_1.png                             # Functional Decomposition Data Flow
│   ├── Authentication_Sequence.png                 # Detailed Sequence for User Authentication
│   ├── AI_Request_Sequence.png                     # Sequence for Agent Pipeline Execution
│   └── Deployment_Architecture.png                 # Docker Multi-Container Topology
│
├── 04_Screenshots/
│   ├── Login/                                      # Login page, invalid rejection, admin login
│   ├── Dashboard/                                  # Executive KPIs, Bed Grid, Emergency Queue
│   ├── Patient/                                    # EHR Registry, Patient Portal, Vitals
│   ├── Appointment/                                # Doctor slot availability, booking screen
│   ├── Doctor/                                     # Duty roster, staff directory
│   ├── Laboratory/                                 # Diagnostic tests, EHR medical records
│   ├── Pharmacy/                                   # Prescription lifecycle, stock dispensing
│   ├── Billing_Admin/                              # Inpatient invoices, insurance pre-auth
│   ├── AI/                                         # Multi-agent autonomous operational feeds
│   ├── API/                                        # FastAPI Swagger UI and ReDoc endpoints
│   ├── Database/                                   # MongoDB Atlas cluster health response
│   ├── Security/                                   # HIPAA audit logs, RBAC access denied screen
│   └── Deployment/                                 # Production API telemetry endpoint
│
├── 05_Testing_Evidence/
│   ├── Functional/                                 # Pytest execution summary report
│   ├── Authentication/                             # Valid and invalid credentials JSON logs
│   ├── Authorization/                              # Unauthenticated blocking & JWT access
│   ├── RBAC/                                       # Patient role restriction on admin logs
│   ├── API/                                        # Live responses for health, beds, triage
│   ├── Database/                                   # MongoDB Atlas connectivity JSON logs
│   ├── Security/                                   # Security headers and CORS audit logs
│   ├── AI/                                         # Multi-agent recommendation JSON output
│   └── End_to_End/                                 # Complete clinical journey workflow log
│
├── 06_Project_Evidence/
│   ├── Source_Code_Inventory.md                    # Exhaustive breakdown of code files & lines
│   ├── Implementation_Inventory.md                 # Truth matrix & technology selection
│   ├── Requirement_Traceability.xlsx               # Comprehensive RTM workbook
│   ├── Evidence_Matrix.xlsx                        # Claim-to-proof verification matrix
│   └── Test_Result_Summary.xlsx                    # Complete test result summary workbook
│
├── 07_References/
│   └── References.pdf                              # Formatted IEEE-compliant academic references
│
└── 08_Submission_Readme/
    └── README.md                                   # This submission directory guide
```

---

## 🛠️ Verification & Execution Instructions

To run and verify the live application locally:

### Option 1: Automatic Windows Launch
Double-click [`start_servers.bat`](../../start_servers.bat) in the project root. This launches both the FastAPI Backend (Port 8000) and Next.js Frontend (Port 3000) simultaneously in separate terminal windows.

### Option 2: Live Service Verification
- **Web Portal:** `http://localhost:3000`
- **Backend Swagger API Docs:** `http://localhost:8000/docs`
- **Backend Health Check:** `http://localhost:8000/health`

### Demo Login Accounts
- **Administrator:** `admin` / `admin123`
- **Doctor:** `doctor` / `doctor123`
- **Nurse:** `nurse` / `nurse123`
- **Patient:** `patient` / `patient123`

---

*All files in this master deliverable folder have been generated directly from the live codebase, running server telemetry, and real executed test suites.*
