"""B-036: 指定行/列のセル値を取得できる（cell-rangeエンドポイント）"""
import json

import pytest
from fastapi.testclient import TestClient
from app import app
import api.reports as reports_module

from tests.conftest import make_xlsx

client = TestClient(app)


def seed_report_with_base(tmp_path, report_id: str, sheets: dict) -> None:
    """diff.json と base.xlsx を tmp_path に作成する"""
    base_bytes = make_xlsx(sheets)
    base_path = tmp_path / f"{report_id}_base.xlsx"
    base_path.write_bytes(base_bytes)

    data = {
        "meta": {
            "created_at": "2026-03-18T12:00:00",
            "base_file": "base.xlsx",
            "file_b": "file_b.xlsx",
            "file_c": None,
            "total_diffs": 1,
            "total_conflicts": 0,
        },
        "sheets": {},
    }
    diff_path = tmp_path / f"{report_id}_diff.json"
    diff_path.write_text(json.dumps(data), encoding="utf-8")


# ---------------------------------------------------------------------------
# 振舞1: 指定行のセル値を返す
# ---------------------------------------------------------------------------

class TestCellRangeRow:
    def test_returns_200(self, tmp_path, monkeypatch):
        """
        Given: 有効なレポートIDと ?sheet=Sheet1&row=1
        When:  GET /api/reports/{id}/cell-range
        Then:  HTTP 200 が返る
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report_with_base(tmp_path, "20260318_120000", {"Sheet1": {"A1": "商品名", "B1": "単価"}})

        res = client.get("/api/reports/20260318_120000/cell-range?sheet=Sheet1&row=1")
        assert res.status_code == 200

    def test_returns_row_values(self, tmp_path, monkeypatch):
        """
        Given: Sheet1 の A1="商品名", B1="単価"
        When:  ?sheet=Sheet1&row=1
        Then:  {"A": "商品名", "B": "単価"} を返す
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report_with_base(tmp_path, "20260318_120000", {"Sheet1": {"A1": "商品名", "B1": "単価"}})

        res = client.get("/api/reports/20260318_120000/cell-range?sheet=Sheet1&row=1")
        body = res.json()
        assert body["A"] == "商品名"
        assert body["B"] == "単価"

    def test_returns_empty_string_for_empty_cells(self, tmp_path, monkeypatch):
        """
        Given: A1="商品名", C1 は空（B1 を飛ばして C1 に値なし）
        When:  ?sheet=Sheet1&row=1
        Then:  空セルは空文字で返る
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report_with_base(tmp_path, "20260318_120000", {"Sheet1": {"A1": "商品名", "A2": "りんご"}})

        res = client.get("/api/reports/20260318_120000/cell-range?sheet=Sheet1&row=1")
        body = res.json()
        assert body["A"] == "商品名"


# ---------------------------------------------------------------------------
# 振舞2: 指定列のセル値を返す
# ---------------------------------------------------------------------------

class TestCellRangeCol:
    def test_returns_200(self, tmp_path, monkeypatch):
        """
        Given: 有効なレポートIDと ?sheet=Sheet1&col=A
        When:  GET /api/reports/{id}/cell-range
        Then:  HTTP 200 が返る
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report_with_base(tmp_path, "20260318_120000", {"Sheet1": {"A2": "りんご", "A3": "みかん"}})

        res = client.get("/api/reports/20260318_120000/cell-range?sheet=Sheet1&col=A")
        assert res.status_code == 200

    def test_returns_col_values(self, tmp_path, monkeypatch):
        """
        Given: Sheet1 の A2="りんご", A3="みかん"
        When:  ?sheet=Sheet1&col=A
        Then:  {"2": "りんご", "3": "みかん"} を返す
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report_with_base(tmp_path, "20260318_120000", {"Sheet1": {"A2": "りんご", "A3": "みかん"}})

        res = client.get("/api/reports/20260318_120000/cell-range?sheet=Sheet1&col=A")
        body = res.json()
        assert body["2"] == "りんご"
        assert body["3"] == "みかん"

    def test_col_case_insensitive(self, tmp_path, monkeypatch):
        """
        Given: A列に値がある
        When:  ?col=a（小文字）
        Then:  正しく値が返る
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report_with_base(tmp_path, "20260318_120000", {"Sheet1": {"A1": "商品名"}})

        res = client.get("/api/reports/20260318_120000/cell-range?sheet=Sheet1&col=a")
        assert res.status_code == 200
        assert res.json()["1"] == "商品名"


# ---------------------------------------------------------------------------
# 振舞3: rowとcolの両方またはどちらもない場合はエラー
# ---------------------------------------------------------------------------

class TestCellRangeValidation:
    def test_returns_400_when_both_row_and_col(self, tmp_path, monkeypatch):
        """
        Given: row と col の両方を指定
        When:  GET /api/reports/{id}/cell-range?sheet=Sheet1&row=1&col=A
        Then:  HTTP 400 が返る
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report_with_base(tmp_path, "20260318_120000", {"Sheet1": {"A1": "値"}})

        res = client.get("/api/reports/20260318_120000/cell-range?sheet=Sheet1&row=1&col=A")
        assert res.status_code == 400

    def test_returns_400_when_neither_row_nor_col(self, tmp_path, monkeypatch):
        """
        Given: row も col も指定しない
        When:  GET /api/reports/{id}/cell-range?sheet=Sheet1
        Then:  HTTP 400 が返る
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report_with_base(tmp_path, "20260318_120000", {"Sheet1": {"A1": "値"}})

        res = client.get("/api/reports/20260318_120000/cell-range?sheet=Sheet1")
        assert res.status_code == 400


# ---------------------------------------------------------------------------
# 振舞4: 存在しないレポートIDの場合はエラー
# ---------------------------------------------------------------------------

class TestCellRangeNotFound:
    def test_returns_404_for_unknown_report(self, tmp_path, monkeypatch):
        """
        Given: 存在しないレポートID
        When:  GET /api/reports/{id}/cell-range?sheet=Sheet1&row=1
        Then:  HTTP 404 が返る
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)

        res = client.get("/api/reports/nonexistent/cell-range?sheet=Sheet1&row=1")
        assert res.status_code == 404
