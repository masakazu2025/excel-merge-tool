"""Excel差分抽出コアロジック（zipfile + ElementTree による直接XMLパース）"""

import io
import logging
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".xlsx", ".xlsm"}


class AppError(Exception):
    """アプリケーション定義エラー"""
    def __init__(self, error_code: str, message: str):
        self.error_code = error_code
        self.message = message
        super().__init__(message)

# ---------------------------------------------------------------------------
# XML 名前空間
# ---------------------------------------------------------------------------
NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

# Excel 組み込み日付フォーマット ID
_BUILTIN_DATE_FMT_IDS = set(range(14, 23)) | {45, 46, 47}


# ---------------------------------------------------------------------------
# 公開 API
# ---------------------------------------------------------------------------

def extract_diff(
    base_bytes: bytes,
    b_bytes: bytes,
    c_bytes: Optional[bytes],
    base_name: str,
    b_name: str,
    c_name: Optional[str],
) -> dict:
    """
    2〜3つのExcelファイル（bytes）を比較して差分dictを返す。
    エラー時は AppError を送出する。
    """
    _validate_extension(base_name)
    _validate_extension(b_name)
    if c_name:
        _validate_extension(c_name)

    try:
        base_wb = _parse_workbook(base_bytes)
        b_wb = _parse_workbook(b_bytes)
        c_wb = _parse_workbook(c_bytes) if c_bytes else None
    except AppError:
        raise
    except Exception as e:
        logger.error("予期せぬエラー（ワークブックパース）: %s", e)
        raise AppError("E005", "比較処理中にエラーが発生しました") from e

    sheets: dict = {}
    for sheet_name, base_sheet in base_wb.items():
        b_sheet = b_wb.get(sheet_name, {})
        c_sheet = c_wb.get(sheet_name, {}) if c_wb else None
        try:
            cells = _compare_cells(sheet_name, base_sheet, b_sheet, c_sheet)
        except AppError:
            raise
        except Exception as e:
            logger.error("予期せぬエラー（セル比較 sheet=%s）: %s", sheet_name, e)
            raise AppError("E005", "比較処理中にエラーが発生しました") from e

        sheets[sheet_name] = {
            "cells": cells,
            "comments": [],
            "shapes": {
                "matched": [],
                "added_b": [],
                "added_c": [],
                "deleted_b": [],
                "deleted_c": [],
            },
        }

    if not sheets:
        raise AppError("E003", "比較可能なシートが見つかりません")

    meta = _build_meta(base_name, b_name, c_name, sheets)
    return {"meta": meta, "sheets": sheets}


def _validate_extension(filename: str) -> None:
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise AppError("E001", "対応していないファイル形式です")


# ---------------------------------------------------------------------------
# Workbook パース
# ---------------------------------------------------------------------------

def _parse_workbook(xlsx_bytes: bytes) -> dict:
    """
    Returns:
        {sheet_name: {coord: {"value": str|None, "type": str}}}
    """
    try:
        zf_obj = zipfile.ZipFile(io.BytesIO(xlsx_bytes))
    except zipfile.BadZipFile as e:
        raise AppError("E002", "ファイルが破損しているか読み込めません") from e

    with zf_obj as zf:
        names = set(zf.namelist())

        if "xl/workbook.xml" not in names:
            raise AppError("E002", "ファイルが破損しているか読み込めません")

        try:
            shared_strings = _parse_shared_strings(zf, names)
            date_style_ids = _parse_date_style_indices(zf, names)
            sheet_list = _parse_sheet_list(zf, names)
        except AppError:
            raise
        except ET.ParseError as e:
            raise AppError("E004", "ファイルの内容を解析できませんでした") from e
        except Exception as e:
            logger.error("XMLパースエラー: %s", e)
            raise AppError("E004", "ファイルの内容を解析できませんでした") from e

        if not sheet_list:
            raise AppError("E003", "比較可能なシートが見つかりません")

        result = {}
        for sheet_name, sheet_path in sheet_list:
            if sheet_path in names:
                try:
                    result[sheet_name] = _parse_sheet(zf, sheet_path, shared_strings, date_style_ids)
                except AppError:
                    raise
                except ET.ParseError as e:
                    raise AppError("E004", "ファイルの内容を解析できませんでした") from e
                except Exception as e:
                    logger.error("シートパースエラー（%s）: %s", sheet_name, e)
                    raise AppError("E004", "ファイルの内容を解析できませんでした") from e

    return result


def _parse_shared_strings(zf: zipfile.ZipFile, names: set) -> list:
    if "xl/sharedStrings.xml" not in names:
        return []

    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    ns = {"s": NS}
    strings = []
    for si in root.findall("s:si", ns):
        t_el = si.find("s:t", ns)
        if t_el is not None:
            # プレーンテキスト
            strings.append(t_el.text or "")
        else:
            # リッチテキスト: <r> の <t> を結合
            parts = [r.find("s:t", ns) for r in si.findall("s:r", ns)]
            strings.append("".join((t.text or "") for t in parts if t is not None))
    return strings


def _parse_date_style_indices(zf: zipfile.ZipFile, names: set) -> set:
    """日付スタイルが適用されているセルスタイルインデックスの集合を返す"""
    if "xl/styles.xml" not in names:
        return set()

    root = ET.fromstring(zf.read("xl/styles.xml"))
    ns = {"s": NS}

    # カスタム日付フォーマット ID を収集
    custom_date_ids: set = set()
    num_fmts = root.find("s:numFmts", ns)
    if num_fmts is not None:
        for nf in num_fmts.findall("s:numFmt", ns):
            fmt_id = int(nf.get("numFmtId", 0))
            if _looks_like_date_format(nf.get("formatCode", "")):
                custom_date_ids.add(fmt_id)

    date_ids = _BUILTIN_DATE_FMT_IDS | custom_date_ids

    # セルスタイル（xf）インデックス → 日付かどうか
    date_style_indices: set = set()
    cell_xfs = root.find("s:cellXfs", ns)
    if cell_xfs is not None:
        for i, xf in enumerate(cell_xfs.findall("s:xf", ns)):
            if int(xf.get("numFmtId", 0)) in date_ids:
                date_style_indices.add(i)

    return date_style_indices


def _looks_like_date_format(fmt: str) -> bool:
    cleaned = re.sub(r'"[^"]*"', "", fmt).lower()
    return bool(re.search(r"[ymdh]", cleaned))


def _parse_sheet_list(zf: zipfile.ZipFile, names: set) -> list:
    """[(sheet_name, sheet_path), ...] を返す"""
    root = ET.fromstring(zf.read("xl/workbook.xml"))
    ns = {"s": NS, "r": NS_R}

    rels: dict = {}
    rels_path = "xl/_rels/workbook.xml.rels"
    if rels_path in names:
        rels_root = ET.fromstring(zf.read(rels_path))
        for rel in rels_root:
            rels[rel.get("Id", "")] = rel.get("Target", "")

    result = []
    for sheet in root.findall(".//s:sheet", ns):
        name = sheet.get("name", "")
        r_id = sheet.get(f"{{{NS_R}}}id", "")
        target = rels.get(r_id, "")
        if target:
            target = target.lstrip("/")          # "/xl/..." → "xl/..."
            if not target.startswith("xl/"):
                target = f"xl/{target}"
            result.append((name, target))

    return result


def _parse_sheet(
    zf: zipfile.ZipFile,
    sheet_path: str,
    shared_strings: list,
    date_style_ids: set,
) -> dict:
    """セル座標 → {"value": ..., "type": ...} の辞書を返す"""
    root = ET.fromstring(zf.read(sheet_path))
    ns = {"s": NS}
    cells: dict = {}

    for row in root.findall(".//s:row", ns):
        for c in row.findall("s:c", ns):
            coord = c.get("r", "")
            t = c.get("t", "")
            s_idx = c.get("s")

            f_el = c.find("s:f", ns)
            v_el = c.find("s:v", ns)
            is_el = c.find("s:is", ns)

            value: Optional[str] = None
            cell_type = "value"

            if f_el is not None:
                value = "=" + (f_el.text or "")
                cell_type = "formula"
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
                    if s_idx is not None and int(s_idx) in date_style_ids:
                        cell_type = "date"

            if value is not None:
                cells[coord] = {"value": value, "type": cell_type}

    return cells


# ---------------------------------------------------------------------------
# 差分比較
# ---------------------------------------------------------------------------

def _compare_cells(
    sheet_name: str,
    base_sheet: dict,
    b_sheet: dict,
    c_sheet: Optional[dict],
) -> list:
    """変更があったセルのみを返す（changed_by / status 付き）"""
    has_c = c_sheet is not None
    all_coords = set(base_sheet) | set(b_sheet) | (set(c_sheet) if has_c else set())
    results = []

    for coord in sorted(all_coords, key=_coord_sort_key):
        base_val = base_sheet.get(coord, {}).get("value")
        b_val = b_sheet.get(coord, {}).get("value")
        c_val = c_sheet.get(coord, {}).get("value") if has_c else None

        changed_by = _determine_changed_by(base_val, b_val, c_val, has_c)
        if changed_by is None:
            continue  # 変更なし → スキップ

        cell_type = (
            base_sheet.get(coord, {}).get("type")
            or b_sheet.get(coord, {}).get("type")
            or "value"
        )
        status = _determine_status(base_val, b_val, c_val, changed_by, cell_type)

        results.append({
            "id": f"{sheet_name}__{coord}",
            "cell": coord,
            "base_value": base_val,
            "b_value": b_val,
            "c_value": c_val,
            "type": cell_type,
            "changed_by": changed_by,
            "status": status,
        })

    return results


def _determine_changed_by(
    base_val: Optional[str],
    b_val: Optional[str],
    c_val: Optional[str],
    has_c: bool,
) -> Optional[str]:
    b_changed = b_val != base_val
    c_changed = has_c and (c_val != base_val)

    if b_changed and c_changed:
        return "both"
    if b_changed:
        return "b"
    if c_changed:
        return "c"
    return None


def _determine_status(
    base_val: Optional[str],
    b_val: Optional[str],
    c_val: Optional[str],
    changed_by: str,
    cell_type: str,
) -> str:
    # conflict: both が変更かつ B ≠ C
    if changed_by == "both" and b_val != c_val:
        return "conflict"

    # 比較対象の新値（both の場合は B を代表値とする）
    new_val = b_val if changed_by in ("b", "both") else c_val

    if base_val is None and new_val is not None:
        return "new"
    if base_val is not None and new_val is None:
        return "delete"

    # テキスト末尾への追記 / 削除（value / rich_text のみ）
    if cell_type in ("value", "rich_text"):
        base_s = base_val or ""
        new_s = new_val or ""
        if new_s.startswith(base_s) and len(new_s) > len(base_s):
            return "add"
        if base_s.startswith(new_s) and len(base_s) > len(new_s):
            return "sub"

    return "update"


def _coord_sort_key(coord: str) -> tuple:
    """A1 → (1, 1), B4 → (4, 2), AA10 → (10, 27) のようにソート"""
    m = re.match(r"([A-Z]+)(\d+)", coord)
    if not m:
        return (0, 0)
    col_str, row_str = m.group(1), m.group(2)
    col_idx = 0
    for ch in col_str:
        col_idx = col_idx * 26 + (ord(ch) - ord("A") + 1)
    return (int(row_str), col_idx)


# ---------------------------------------------------------------------------
# メタ情報
# ---------------------------------------------------------------------------

def _build_meta(
    base_name: str,
    b_name: Optional[str],
    c_name: Optional[str],
    sheets: dict,
) -> dict:
    total_diffs = sum(
        len(s.get("cells", [])) + len(s.get("comments", []))
        for s in sheets.values()
    )
    total_conflicts = sum(
        sum(1 for c in s.get("cells", []) if c.get("status") == "conflict")
        for s in sheets.values()
    )
    return {
        "created_at": datetime.now().isoformat(),
        "base_file": base_name,
        "file_b": b_name,
        "file_c": c_name,
        "total_diffs": total_diffs,
        "total_conflicts": total_conflicts,
    }
