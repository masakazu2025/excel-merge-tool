@echo off
setlocal enabledelayedexpansion
set ROOT=%~dp0
set VENV=%ROOT%backend\.venv_win
set PYTHON=%VENV%\Scripts\python.exe
set PIP=%VENV%\Scripts\pip.exe

echo [0] Setup virtual environment...
if not exist "%VENV%" (
    python -m venv "%VENV%"
    if errorlevel 1 ( echo FAILED: venv creation & pause & exit /b 1 )
    "%PYTHON%" -m pip install --upgrade pip --quiet
    "%PIP%" install fastapi "uvicorn[standard]" python-multipart pyyaml pyinstaller --quiet
    if errorlevel 1 ( echo FAILED: pip install & pause & exit /b 1 )
)

echo [1] Build frontend...
pushd "%ROOT%frontend"
call npm install --silent
if errorlevel 1 ( echo FAILED: npm install & popd & pause & exit /b 1 )
call npm run build
if errorlevel 1 ( echo FAILED: npm build & popd & pause & exit /b 1 )
popd

echo [2] Cleanup build artifacts...
if exist "%ROOT%backend\build" rmdir /s /q "%ROOT%backend\build"
if exist "%ROOT%backend\dist"  rmdir /s /q "%ROOT%backend\dist"

echo [3] Build exe...
pushd "%ROOT%backend"
"%PYTHON%" -m PyInstaller excel_merge_tool.spec --noconfirm
if errorlevel 1 ( echo FAILED: PyInstaller & popd & pause & exit /b 1 )
popd

echo [4] Collect release package...
for /f "tokens=1-6 delims=/:. " %%a in ("%date% %time: =0%") do (
    set YYYY=%%c
    set MM=%%b
    set DD=%%a
    set HH=%%d
    set MI=%%e
    set SS=%%f
)
set TIMESTAMP=%YYYY%%MM%%DD%%HH%%MI%%SS%
set VERSION=v0.1
set RELEASE_DIR=%ROOT%dist\%VERSION%_%TIMESTAMP%

mkdir "%RELEASE_DIR%"
xcopy /e /i /q "%ROOT%backend\dist\excel-merge-tool" "%RELEASE_DIR%\excel-merge-tool"
if errorlevel 1 ( echo FAILED: copy release & pause & exit /b 1 )

echo [5] Cleanup intermediate build files...
rmdir /s /q "%ROOT%backend\build"
rmdir /s /q "%ROOT%backend\dist"

echo.
echo Done: %RELEASE_DIR%
pause
