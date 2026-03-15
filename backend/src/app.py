"""FastAPI アプリ定義・ルーター登録"""

import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from api.compare import router as compare_router
from api.reports import router as reports_router


def _resource_dir() -> Path:
    """PyInstaller では _MEIPASS、通常実行ではプロジェクトルートを返す"""
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS)
    return Path(__file__).parent.parent.parent


FRONTEND_DIST = _resource_dir() / "frontend" / "dist"

app = FastAPI(title="Excel Merge Tool")

app.include_router(compare_router)
app.include_router(reports_router)

if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="static")
