@echo off
setlocal
set ROOT=%~dp0
set VENV=%ROOT%backend\.venv_win
set PYTHON=%VENV%\Scripts\python.exe
set PIP=%VENV%\Scripts\pip.exe

echo [0] Setup virtual environment...
if not exist "%VENV%" (
    python -m venv "%VENV%"
    if errorlevel 1 ( echo FAILED: venv creation & pause & exit /b 1 )
    "%PYTHON%" -m pip install --upgrade pip --quiet
    "%PIP%" install fastapi "uvicorn[standard]" python-multipart pyinstaller --quiet
    if errorlevel 1 ( echo FAILED: pip install & pause & exit /b 1 )
)

echo [1] Build frontend...
pushd "%ROOT%frontend"
call npm install --silent
if errorlevel 1 ( echo FAILED: npm install & popd & pause & exit /b 1 )
call npm run build
if errorlevel 1 ( echo FAILED: npm build & popd & pause & exit /b 1 )
popd

echo [2] Build exe...
pushd "%ROOT%backend"
"%PYTHON%" -m PyInstaller excel_merge_tool.spec --clean --noconfirm
if errorlevel 1 ( echo FAILED: PyInstaller & popd & pause & exit /b 1 )
popd

echo.
echo Done: %ROOT%backend\dist\excel-merge-tool.exe
pause
