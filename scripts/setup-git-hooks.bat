@echo off
echo ========================================================
echo   Setting up MediSphere AI Enterprise Git Hooks
echo ========================================================

cd /d "%~dp0\.."

:: Configure git to use .husky directory for hooks
git config core.hooksPath .husky
if %ERRORLEVEL% equ 0 (
    echo [OK] Configured git core.hooksPath to .husky
) else (
    echo [WARN] Failed to set core.hooksPath. Copying directly to .git\hooks...
)

:: Also copy directly to .git/hooks as fallback
if exist ".git\hooks" (
    copy /y ".husky\pre-commit" ".git\hooks\pre-commit" >nul
    copy /y ".husky\pre-push" ".git\hooks\pre-push" >nul
    echo [OK] Dual-installed hooks into .git\hooks directory
)

echo.
echo [SUCCESS] Git hooks installed successfully!
echo   - pre-commit: Secret scanner + Ruff linter gate
echo   - pre-push:   Pytest test cases + Frontend typecheck gate
echo.
pause

