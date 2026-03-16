@echo off
setlocal enabledelayedexpansion
set ROOT=%~dp0..
set VENV=%ROOT%\backend\.venv

echo [1] Setup backend environment...
where poetry >nul 2>&1
if %errorlevel% == 0 (
    echo Poetry found. Using poetry install...
    pushd "%ROOT%\backend"
    poetry config virtualenvs.in-project true
    poetry lock
    if errorlevel 1 ( echo FAILED: poetry lock & popd & pause & exit /b 1 )
    poetry install
    if errorlevel 1 ( echo FAILED: poetry install & popd & pause & exit /b 1 )
    popd
) else (
    echo Poetry not found. Using pip...
    if not exist "%VENV%" (
        python -m venv "%VENV%"
        if errorlevel 1 ( echo FAILED: venv creation & pause & exit /b 1 )
        "%VENV%\Scripts\python.exe" -m pip install --upgrade pip --quiet
    )
    "%VENV%\Scripts\pip.exe" install -e "%ROOT%\backend[dev]" --quiet
    if errorlevel 1 ( echo FAILED: pip install & pause & exit /b 1 )
)
echo Backend environment ready.

echo [2] Setup frontend environment...
pushd "%ROOT%\frontend"
call npm install --silent
if errorlevel 1 ( echo FAILED: npm install & popd & pause & exit /b 1 )
popd
echo Frontend environment ready.

echo.
echo Setup complete.
pause
