"""Step 1: Excel差分抽出コアロジック（実装予定）"""

from datetime import datetime


def extract_diff(
    base_bytes: bytes,
    b_bytes: bytes,
    c_bytes: bytes,
    base_name: str,
    b_name: str,
    c_name: str,
) -> dict:
    """
    3つのExcelファイル（bytes）を比較して差分dictを返す。

    Returns:
        {
            "meta": { ... },
            "sheets": { シート名: { "cells": [...], "comments": [...], "shapes": {...} } }
        }
    """
    # TODO: Step 1 実装
    raise NotImplementedError("extract_diff は未実装です")


def _build_meta(base_name: str, b_name: str, c_name: str, sheets: dict) -> dict:
    total_diffs = sum(
        len(s.get("cells", [])) + len(s.get("comments", []))
        for s in sheets.values()
    )
    total_conflicts = sum(
        sum(1 for c in s.get("cells", []) if c.get("conflict"))
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
