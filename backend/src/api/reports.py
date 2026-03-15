"""GET /api/reports, GET /api/reports/{report_id}"""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from logger import get_logger

logger = get_logger(__name__)

OUTPUT_DIR = Path(__file__).parent.parent.parent / "output"

router = APIRouter()


@router.get("/api/reports")
def list_reports(page: int = 1, limit: int = 10):
    """保存済みレポート一覧を新しい順・ページネーション付きで返す"""
    all_reports = []
    for path in sorted(OUTPUT_DIR.glob("*_diff.json"), reverse=True):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            meta = data.get("meta", {})
            report_id = path.stem.replace("_diff", "")
            all_reports.append({
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
    total = len(all_reports)
    start = (page - 1) * limit
    return {"items": all_reports[start:start + limit], "total": total, "page": page}


@router.get("/api/reports/{report_id}")
def get_report(report_id: str):
    """指定レポートのdiff.jsonを返す"""
    path = OUTPUT_DIR / f"{report_id}_diff.json"
    if not path.exists():
        logger.error("E006: レポートが見つかりません: %s", report_id)
        raise HTTPException(status_code=404, detail={"error_code": "E006", "message": "レポートが見つかりません"})
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        logger.info("レポート取得: %s", report_id)
        return data
    except Exception as e:
        logger.exception("E007: レポート読み込み失敗: %s", report_id)
        raise HTTPException(status_code=404, detail={"error_code": "E007", "message": "レポートを開けませんでした"})
