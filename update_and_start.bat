@echo off
setlocal enabledelayedexpansion
set ROOT=%~dp0

echo Pulling latest changes...
cd /d "%ROOT%"
git pull
if %errorlevel% neq 0 (
    echo ERROR: git pull failed.
    pause
    exit /b 1
)

echo.
echo Starting application...
call "%ROOT%\scripts\start_dev.bat"

echo Waiting for frontend to start...
timeout /t 5 /nobreak > nul
start http://localhost:5173
