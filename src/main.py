"""FastAPI サーバー - エントリポイント"""

import json
from datetime import datetime
from pathlib import Path

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "output"
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

app = FastAPI(title="Excel Merge Tool")


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.post("/api/compare")
async def compare(
    base_file: UploadFile = File(...),
    file_b: UploadFile = File(...),
    file_c: UploadFile = File(...),
):
    """3つのExcelファイルを受け取り差分抽出してJSONを保存する"""
    from extractor import extract_diff  # noqa: PLC0415

    base_bytes = await base_file.read()
    b_bytes = await file_b.read()
    c_bytes = await file_c.read()

    diff = extract_diff(
        base_bytes=base_bytes,
        b_bytes=b_bytes,
        c_bytes=c_bytes,
        base_name=base_file.filename or "base.xlsx",
        b_name=file_b.filename or "file_b.xlsx",
        c_name=file_c.filename or "file_c.xlsx",
    )

    report_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = OUTPUT_DIR / f"{report_id}_diff.json"
    output_path.write_text(json.dumps(diff, ensure_ascii=False, indent=None), encoding="utf-8")

    meta = diff.get("meta", {})
    return {
        "report_id": report_id,
        "created_at": meta.get("created_at"),
        "base_file": meta.get("base_file"),
        "file_b": meta.get("file_b"),
        "file_c": meta.get("file_c"),
        "total_diffs": meta.get("total_diffs", 0),
        "total_conflicts": meta.get("total_conflicts", 0),
    }


@app.get("/api/reports")
def list_reports():
    """保存済みレポート一覧を新しい順で返す"""
    reports = []
    for path in sorted(OUTPUT_DIR.glob("*_diff.json"), reverse=True):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            meta = data.get("meta", {})
            report_id = path.stem.replace("_diff", "")
            reports.append({
                "report_id": report_id,
                "created_at": meta.get("created_at"),
                "base_file": meta.get("base_file"),
                "file_b": meta.get("file_b"),
                "file_c": meta.get("file_c"),
                "total_diffs": meta.get("total_diffs", 0),
                "total_conflicts": meta.get("total_conflicts", 0),
            })
        except Exception:
            continue
    return reports


@app.get("/api/reports/{report_id}")
def get_report(report_id: str):
    """指定レポートのdiff.jsonを返す"""
    path = OUTPUT_DIR / f"{report_id}_diff.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    return json.loads(path.read_text(encoding="utf-8"))


# ---------------------------------------------------------------------------
# Static files (React build) - must be mounted last
# ---------------------------------------------------------------------------

if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="static")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)
