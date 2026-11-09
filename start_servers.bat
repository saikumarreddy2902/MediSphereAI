@echo off
echo ========================================================
echo        Starting MediSphere AI Hospital Management
echo ========================================================

echo.
echo [1/2] Starting Backend FastAPI Server on http://localhost:8000 ...
start "MediSphere Backend (Port 8000)" cmd /k "cd /d %~dp0backend && .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [2/2] Starting Frontend Next.js Server on http://localhost:3000 ...
start "MediSphere Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo Services are booting up in separate terminal windows!
echo - Frontend:    http://localhost:3000
echo - Backend API: http://localhost:8000/docs
echo ========================================================
echo.
timeout /t 5

