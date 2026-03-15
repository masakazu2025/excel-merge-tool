@echo off
setlocal
cd /d %~dp0

echo === 0. 仮想環境セットアップ ===
if not exist backend\.venv_win (
    echo 仮想環境を作成します...
    python -m venv backend\.venv_win
    if errorlevel 1 ( echo 仮想環境の作成に失敗しました & pause & exit /b 1 )
    echo 依存パッケージをインストールします...
    backend\.venv_win\Scripts\python.exe -m pip install --upgrade pip
    backend\.venv_win\Scripts\pip.exe install fastapi "uvicorn[standard]" python-multipart pyinstaller
    if errorlevel 1 ( echo パッケージインストールに失敗しました & pause & exit /b 1 )
)

echo === 1. フロントエンドビルド ===
cd frontend
call npm install
if errorlevel 1 ( echo npm install 失敗 & pause & exit /b 1 )
call npm run build
if errorlevel 1 ( echo フロントエンドビルド失敗 & pause & exit /b 1 )
cd ..

echo === 2. PyInstaller ビルド ===
cd backend
.venv_win\Scripts\python.exe -m PyInstaller excel_merge_tool.spec --clean --noconfirm
if errorlevel 1 ( echo exeビルド失敗 & pause & exit /b 1 )
cd ..

echo.
echo === 完了 ===
echo 出力先: backend\dist\excel-merge-tool.exe
pause
