@echo off
setlocal enabledelayedexpansion
set ROOT=%~dp0..
set VENV=%ROOT%\backend\.venv
set PYTHON=%VENV%\Scripts\python.exe

echo Checking environment...
if not exist "%VENV%" (
    echo ERROR: Virtual environment not found.
    echo Please run scripts\setup.bat first.
    pause
    exit /b 1
)

echo Starting backend...
set PYTHONPATH=%ROOT%\backend\src
start "backend" cmd /k "cd /d "%ROOT%\backend" && "%PYTHON%" -m uvicorn src.app:app --reload --reload-dir src --port 8080"

echo Starting frontend...
start "frontend" cmd /k "cd /d "%ROOT%\frontend" && npm run dev"

echo.
echo Both servers started.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo.
echo Close each terminal window to stop.
