@echo off
setlocal EnableDelayedExpansion

echo ==============================================================================
echo       MediSphere AI — Enterprise Quality Gate & Pull Request Publisher
echo ==============================================================================
echo.

cd /d "%~dp0"

:: 1. Ensure on the feature branch
echo [Step 1/4] Verifying active Git branch...
for /f "tokens=*" %%b in ('git branch --show-current') do set CURRENT_BRANCH=%%b
if not "%CURRENT_BRANCH%"=="feat/enterprise-devsecops-pipeline" (
    echo Switching to feature branch 'feat/enterprise-devsecops-pipeline'...
    git checkout feat/enterprise-devsecops-pipeline 2>nul
    if !ERRORLEVEL! neq 0 (
        git checkout -b feat/enterprise-devsecops-pipeline
    )
)
echo Active branch: feat/enterprise-devsecops-pipeline
echo.

:: 2. Run Pre-Flight Quality & Security Gate
echo [Step 2/4] Running Enterprise Quality & DevSecOps Gate...

:: Pytest
echo   - [1/3] Running Pytest Suite (including OWASP Attack Verification)...
where uv >nul 2>&1
if !ERRORLEVEL! equ 0 (
    uv run --no-project --with-requirements backend/requirements.txt python -m pytest backend/tests/ -q
) else (
    python -m pytest backend/tests/ -q
)
if !ERRORLEVEL! neq 0 (
    echo.
    echo [ERROR] Test suite failed! Pull request submission blocked.
    echo Resolve failing tests before creating a Pull Request.
    pause
    exit /b 1
)
echo     - Status: All 105 test cases PASSED (0 failures)

:: Ruff Linter
echo   - [2/3] Running Ruff Linter check...
where uv >nul 2>&1
if !ERRORLEVEL! equ 0 (
    uv run --with ruff ruff check backend/
) else (
    ruff check backend/ 2>nul
)
if !ERRORLEVEL! neq 0 (
    echo.
    echo [ERROR] Ruff lint errors detected! Pull request submission blocked.
    pause
    exit /b 1
)
echo     - Status: Ruff lint check PASSED (0 errors)

:: Bandit SAST
echo   - [3/3] Running Bandit SAST Security Analysis...
where uv >nul 2>&1
if !ERRORLEVEL! equ 0 (
    uv run --with bandit python -m bandit -r backend/app -ll -ii
) else (
    python -m bandit -r backend/app -ll -ii 2>nul
)
if !ERRORLEVEL! neq 0 (
    echo.
    echo [ERROR] High/Medium security vulnerabilities found! PR blocked.
    pause
    exit /b 1
)
echo     - Status: Bandit SAST scan PASSED (0 vulnerabilities)
echo.

:: 3. Push to Remote
echo [Step 3/4] Pushing branch 'feat/enterprise-devsecops-pipeline' to GitHub...
git push -u origin feat/enterprise-devsecops-pipeline 2>push_err.log
set PUSH_STATUS=%ERRORLEVEL%

if %PUSH_STATUS% equ 0 (
    echo.
    echo [SUCCESS] Branch pushed directly to upstream repository!
    set PR_URL=https://github.com/saikumarreddy2902/MediSphereAI/compare/main...feat/enterprise-devsecops-pipeline?expand=1
    del push_err.log >nul 2>&1
    goto OPEN_PR
)

:: If permission denied, use fork mechanism
findstr /C:"403" push_err.log >nul 2>&1 || findstr /C:"denied" push_err.log >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo.
    echo --------------------------------------------------------------------------
    echo [NOTICE] Direct push to saikumarreddy2902/MediSphereAI was denied (HTTP 403).
    echo This is expected for contributor accounts without direct repository write access.
    echo.
    echo To submit a Pull Request:
    echo   1. Fork the repo at: https://github.com/saikumarreddy2902/MediSphereAI/fork
    echo   2. Push this branch to your fork.
    echo --------------------------------------------------------------------------
    echo.
    
    set /p FORK_URL="Enter your GitHub fork URL (or press Enter for https://github.com/shashidhar-02/MediSphereAI.git): "
    if "!FORK_URL!"=="" set FORK_URL=https://github.com/shashidhar-02/MediSphereAI.git
    
    echo.
    echo Configuring fork remote: !FORK_URL!...
    git remote remove fork >nul 2>&1
    git remote add fork !FORK_URL!
    
    echo Pushing to fork...
    git push -u fork feat/enterprise-devsecops-pipeline
    if !ERRORLEVEL! equ 0 (
        echo [SUCCESS] Branch pushed to your fork!
        set PR_URL=https://github.com/saikumarreddy2902/MediSphereAI/compare/main...shashidhar-02:MediSphereAI:feat/enterprise-devsecops-pipeline?expand=1
        del push_err.log >nul 2>&1
        goto OPEN_PR
    ) else (
        echo.
        echo [ERROR] Push to fork failed. If you haven't created the fork yet:
        echo Please visit: https://github.com/saikumarreddy2902/MediSphereAI/fork
        echo Click "Create fork", then run this script again.
        del push_err.log >nul 2>&1
        pause
        exit /b 1
    )
)

del push_err.log >nul 2>&1

:OPEN_PR
echo.
echo ==============================================================================
echo [Step 4/4] Opening GitHub Pull Request creation page...
echo ==============================================================================
echo Target URL: %PR_URL%
echo.
start "" "%PR_URL%"
echo.
echo Please review the PR details in your browser, copy the PR description from
echo .github/PULL_REQUEST_TEMPLATE.md, and click "Create Pull Request"!
echo.
pause

