# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec: excel-merge-tool"""

from pathlib import Path

ROOT = Path(SPECPATH).parent  # プロジェクトルート（backend/ の親）
FRONTEND_DIST = ROOT / "frontend" / "dist"
CONFIG_DIR = Path(SPECPATH) / "config"

a = Analysis(
    ["src/main.py"],
    pathex=["src"],
    binaries=[],
    datas=[
        (str(FRONTEND_DIST), "frontend/dist"),  # React ビルド成果物
        # config/ はバンドルせず exe の隣に配置（ユーザー編集可）→ build.bat でコピー
    ],
    hiddenimports=[
        "uvicorn.logging",
        "uvicorn.loops",
        "uvicorn.loops.auto",
        "uvicorn.protocols",
        "uvicorn.protocols.http",
        "uvicorn.protocols.http.auto",
        "uvicorn.protocols.websockets",
        "uvicorn.protocols.websockets.auto",
        "uvicorn.lifespan",
        "uvicorn.lifespan.on",
        "anyio",
        "anyio._backends._asyncio",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="excel-merge-tool",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,   # コンソールウィンドウを表示（終了しやすくする）
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="excel-merge-tool",
)
