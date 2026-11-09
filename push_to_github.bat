@echo off
echo ========================================================
echo        Pushing MediSphere AI to GitHub
echo ========================================================
echo.
cd /d "%~dp0"
git status
echo.
echo Pushing branch main to https://github.com/saikumarreddy2902/MediSphereAI ...
git push origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Code pushed successfully to GitHub!
) else (
    echo [ERROR] Push failed. If prompted, please sign in with your GitHub credentials or Personal Access Token.
)
echo.
pause
