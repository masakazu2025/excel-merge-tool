"""GET /api/reports, GET /api/reports/{report_id}"""

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from logger import get_logger

_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
_NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

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


@router.get("/api/reports/{report_id}/cell-range")
def get_cell_range(
    report_id: str,
    sheet: str,
    row: Optional[int] = Query(default=None),
    col: Optional[str] = Query(default=None),
):
    """base.xlsx の指定行または指定列のセル値をすべて返す"""
    if (row is None) == (col is None):
        raise HTTPException(status_code=400, detail={"error_code": "E010", "message": "row か col のどちらか一方を指定してください"})

    diff_path = OUTPUT_DIR / f"{report_id}_diff.json"
    if not diff_path.exists():
        raise HTTPException(status_code=404, detail={"error_code": "E006", "message": "レポートが見つかりません"})

    base_path = OUTPUT_DIR / f"{report_id}_base.xlsx"
    if not base_path.exists():
        raise HTTPException(status_code=404, detail={"error_code": "E008", "message": "ベースファイルが見つかりません"})

    cells = _read_sheet_cells(base_path, sheet)

    if row is not None:
        result = {}
        for coord, val in cells.items():
            m = re.match(r"([A-Z]+)(\d+)$", coord)
            if m and int(m.group(2)) == row:
                result[m.group(1)] = val
        return result
    else:
        col_upper = col.upper()
        result = {}
        for coord, val in cells.items():
            m = re.match(r"([A-Z]+)(\d+)$", coord)
            if m and m.group(1) == col_upper:
                result[m.group(2)] = val
        return result


def _read_sheet_cells(xlsx_path: Path, sheet_name: str) -> dict:
    """xlsx から指定シートの {coord: value} を返す"""
    with zipfile.ZipFile(xlsx_path) as zf:
        names = set(zf.namelist())

        shared_strings: list = []
        if "xl/sharedStrings.xml" in names:
            root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
            ns = {"s": _NS}
            for si in root.findall("s:si", ns):
                t_el = si.find("s:t", ns)
                if t_el is not None:
                    shared_strings.append(t_el.text or "")
                else:
                    parts = [r.find("s:t", ns) for r in si.findall("s:r", ns)]
                    shared_strings.append("".join((t.text or "") for t in parts if t is not None))

        sheet_path = _find_sheet_path(zf, names, sheet_name)
        if sheet_path is None:
            return {}

        root = ET.fromstring(zf.read(sheet_path))
        ns = {"s": _NS}
        cells: dict = {}

        for row_el in root.findall(".//s:row", ns):
            for c in row_el.findall("s:c", ns):
                coord = c.get("r", "")
                t = c.get("t", "")
                v_el = c.find("s:v", ns)
                is_el = c.find("s:is", ns)
                f_el = c.find("s:f", ns)

                value: Optional[str] = None
                if f_el is not None:
                    value = "=" + (f_el.text or "")
                elif t == "s":
                    if v_el is not None and v_el.text is not None:
                        idx = int(v_el.text)
                        value = shared_strings[idx] if idx < len(shared_strings) else ""
                elif t == "inlineStr":
                    if is_el is not None:
                        t_el = is_el.find("s:t", ns)
                        value = (t_el.text or "") if t_el is not None else ""
                elif t == "b":
                    value = "TRUE" if (v_el is not None and v_el.text == "1") else "FALSE"
                else:
                    if v_el is not None and v_el.text is not None:
                        value = v_el.text

                if value is not None:
                    cells[coord] = value

    return cells


def _find_sheet_path(zf: zipfile.ZipFile, names: set, sheet_name: str) -> Optional[str]:
    """シート名からシートXMLのパスを返す"""
    root = ET.fromstring(zf.read("xl/workbook.xml"))
    ns = {"s": _NS, "r": _NS_R}

    rels: dict = {}
    rels_path = "xl/_rels/workbook.xml.rels"
    if rels_path in names:
        rels_root = ET.fromstring(zf.read(rels_path))
        for rel in rels_root:
            rels[rel.get("Id", "")] = rel.get("Target", "")

    for sheet in root.findall(".//s:sheet", ns):
        if sheet.get("name", "") == sheet_name:
            r_id = sheet.get(f"{{{_NS_R}}}id", "")
            target = rels.get(r_id, "")
            if target:
                target = target.lstrip("/")
                if not target.startswith("xl/"):
                    target = f"xl/{target}"
                return target

    return None
