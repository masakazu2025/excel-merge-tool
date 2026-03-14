"""FastAPI アプリ定義・ルーター登録"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from api.compare import router as compare_router
from api.reports import router as reports_router

FRONTEND_DIST = Path(__file__).parent.parent.parent / "frontend" / "dist"

app = FastAPI(title="Excel Merge Tool")

app.include_router(compare_router)
app.include_router(reports_router)

if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="static")
