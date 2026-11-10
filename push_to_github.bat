@echo off
setlocal EnableDelayedExpansion

echo ========================================================
echo        MediSphere AI — Enterprise GitHub Push Gate
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Ensure Git Hooks are Configured
git config core.hooksPath .husky >nul 2>&1

:: 2. Display Status
echo [1/3] Checking working directory status...
git status -s
echo.

:: 3. Run Pre-Push DevSecOps & Test Gate
echo [2/3] Running MediSphere Enterprise Quality & Test Verification...
if exist "backend\tests" (
    where uv >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo Running backend pytest suite via uv...
        uv run --no-project --with-requirements backend/requirements.txt python -m pytest backend/tests/ -q
        if !ERRORLEVEL! neq 0 (
            echo.
            echo [BLOCKED] Tests failed! Push blocked by Enterprise CI Quality Gate.
            echo Please fix failing test cases before pushing to GitHub.
            echo.
            pause
            exit /b 1
        )
        echo [PASS] All backend unit and integration test cases passed!
    ) else (
        where python >nul 2>&1
        if !ERRORLEVEL! equ 0 (
            echo Running backend pytest suite...
            python -m pytest backend/tests/ -q
            if !ERRORLEVEL! neq 0 (
                echo.
                echo [BLOCKED] Tests failed! Push blocked by Enterprise CI Quality Gate.
                echo Please fix failing test cases before pushing to GitHub.
                echo.
                pause
                exit /b 1
            )
            echo [PASS] All backend test cases passed!
        )
    )
)

echo.
echo [3/3] Pushing to GitHub (origin/main)...
git push origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo [SUCCESS] Code successfully pushed to GitHub!
    echo Remote CI/CD & Security Pipelines are running on GitHub.
    echo ========================================================
) else (
    echo ========================================================
    echo [ERROR] Push failed. If rejected by GitHub, ensure all
    echo required status checks and branch protection rules have passed.
    echo ========================================================
)
echo.
pause
