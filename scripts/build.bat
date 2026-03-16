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

echo [1] Build frontend...
pushd "%ROOT%\frontend"
call npm run build
if errorlevel 1 ( echo FAILED: npm build & popd & pause & exit /b 1 )
popd

echo [2] Cleanup build artifacts...
if exist "%ROOT%\backend\build" rmdir /s /q "%ROOT%\backend\build"
if exist "%ROOT%\backend\dist"  rmdir /s /q "%ROOT%\backend\dist"

echo [3] Build exe...
pushd "%ROOT%\backend"
"%PYTHON%" -m PyInstaller excel_merge_tool.spec --noconfirm
if errorlevel 1 ( echo FAILED: PyInstaller & popd & pause & exit /b 1 )
popd

echo [4] Collect release package...
set /p VERSION=<"%ROOT%\version.txt"
set VERSION=v%VERSION%
for /f "tokens=1-6 delims=/:. " %%a in ("%date% %time: =0%") do (
    set YYYY=%%c
    set MM=%%b
    set DD=%%a
    set HH=%%d
    set MI=%%e
    set SS=%%f
)
set TIMESTAMP=%YYYY%%MM%%DD%%HH%%MI%%SS%
set RELEASE_DIR=%ROOT%\dist\%VERSION%_%TIMESTAMP%

mkdir "%RELEASE_DIR%"
xcopy /e /i /q "%ROOT%\backend\dist\excel-merge-tool" "%RELEASE_DIR%\excel-merge-tool"
if errorlevel 1 ( echo FAILED: copy exe & pause & exit /b 1 )
xcopy /e /i /q "%ROOT%\backend\config" "%RELEASE_DIR%\excel-merge-tool\config"
if errorlevel 1 ( echo FAILED: copy config & pause & exit /b 1 )

echo [5] Cleanup intermediate build files...
rmdir /s /q "%ROOT%\backend\build"
rmdir /s /q "%ROOT%\backend\dist"

echo.
echo Done: %RELEASE_DIR%
pause
