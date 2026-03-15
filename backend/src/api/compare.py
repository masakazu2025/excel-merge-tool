"""POST /api/compare"""

import json
import logging
import sys
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))
from extractor import AppError, extract_diff  # noqa: E402

OUTPUT_DIR = Path(__file__).parent.parent.parent / "output"
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/api/compare")
async def compare(
    base_file: UploadFile = File(...),
    file_b: UploadFile = File(...),
    file_c: Optional[UploadFile] = File(default=None),
):
    """2〜3つのExcelファイルを受け取り差分抽出してJSONを保存する"""
    base_bytes = await base_file.read()
    b_bytes = await file_b.read()
    c_bytes = await file_c.read() if file_c else None

    try:
        diff = extract_diff(
            base_bytes=base_bytes,
            b_bytes=b_bytes,
            c_bytes=c_bytes,
            base_name=base_file.filename or "base.xlsx",
            b_name=file_b.filename or "file_b.xlsx",
            c_name=file_c.filename if file_c else None,
        )
    except AppError as e:
        raise HTTPException(status_code=422, detail={"error_code": e.error_code, "message": e.message})

    try:
        OUTPUT_DIR.mkdir(exist_ok=True)
        report_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = OUTPUT_DIR / f"{report_id}_diff.json"
        output_path.write_text(json.dumps(diff, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        logger.error("レポート保存失敗: %s", e)
        raise HTTPException(status_code=422, detail={"error_code": "E005", "message": "比較処理中にエラーが発生しました"})

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
