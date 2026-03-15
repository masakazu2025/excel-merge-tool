"""B-007: 3ファイルをアップロードして比較を実行できる"""
import io
import json
from pathlib import Path

from fastapi.testclient import TestClient
from app import app
from tests.conftest import make_xlsx

client = TestClient(app)


def xlsx_file(name: str, data: bytes):
    return (name, io.BytesIO(data), "application/octet-stream")


SHEET_BASE = {"Sheet1": {"A1": "元値", "B1": "共通"}}
SHEET_B    = {"Sheet1": {"A1": "B値",  "B1": "共通"}}
SHEET_C    = {"Sheet1": {"A1": "C値",  "B1": "共通"}}


class TestCompareThreeFiles:
    def test_three_file_compare_returns_200(self, tmp_path, monkeypatch):
        """
        Given: base / file_b / file_c の3ファイルを送信
        When:  POST /api/compare
        Then:  HTTP 200 が返る
        """
        import api.compare as m
        monkeypatch.setattr(m, "OUTPUT_DIR", tmp_path)

        res = client.post("/api/compare", files={
            "base_file": xlsx_file("base.xlsx", make_xlsx(SHEET_BASE)),
            "file_b":    xlsx_file("file_b.xlsx", make_xlsx(SHEET_B)),
            "file_c":    xlsx_file("file_c.xlsx", make_xlsx(SHEET_C)),
        })
        assert res.status_code == 200

    def test_three_file_compare_response_has_report_id(self, tmp_path, monkeypatch):
        """
        Given: 3ファイル比較
        Then:  レスポンスに report_id が含まれる
        """
        import api.compare as m
        monkeypatch.setattr(m, "OUTPUT_DIR", tmp_path)

        res = client.post("/api/compare", files={
            "base_file": xlsx_file("base.xlsx", make_xlsx(SHEET_BASE)),
            "file_b":    xlsx_file("file_b.xlsx", make_xlsx(SHEET_B)),
            "file_c":    xlsx_file("file_c.xlsx", make_xlsx(SHEET_C)),
        })
        body = res.json()
        assert "report_id" in body
        assert body["report_id"] != ""

    def test_three_file_compare_response_has_meta(self, tmp_path, monkeypatch):
        """
        Given: 3ファイル比較
        Then:  レスポンスに created_at / base_file / file_b / file_c / total_diffs / total_conflicts が含まれる
        """
        import api.compare as m
        monkeypatch.setattr(m, "OUTPUT_DIR", tmp_path)

        res = client.post("/api/compare", files={
            "base_file": xlsx_file("base.xlsx", make_xlsx(SHEET_BASE)),
            "file_b":    xlsx_file("file_b.xlsx", make_xlsx(SHEET_B)),
            "file_c":    xlsx_file("file_c.xlsx", make_xlsx(SHEET_C)),
        })
        body = res.json()
        for key in ("created_at", "base_file", "file_b", "file_c", "total_diffs", "total_conflicts"):
            assert key in body, f"key '{key}' missing in response"

    def test_three_file_compare_saves_json(self, tmp_path, monkeypatch):
        """
        Given: 3ファイル比較
        Then:  output/{report_id}_diff.json が保存される
        """
        import api.compare as m
        monkeypatch.setattr(m, "OUTPUT_DIR", tmp_path)

        res = client.post("/api/compare", files={
            "base_file": xlsx_file("base.xlsx", make_xlsx(SHEET_BASE)),
            "file_b":    xlsx_file("file_b.xlsx", make_xlsx(SHEET_B)),
            "file_c":    xlsx_file("file_c.xlsx", make_xlsx(SHEET_C)),
        })
        report_id = res.json()["report_id"]
        saved = tmp_path / f"{report_id}_diff.json"
        assert saved.exists()
        data = json.loads(saved.read_text(encoding="utf-8"))
        assert "meta" in data
        assert "sheets" in data

    def test_three_file_compare_filenames_in_meta(self, tmp_path, monkeypatch):
        """
        Given: base.xlsx / file_b.xlsx / file_c.xlsx を送信
        Then:  レスポンスの base_file / file_b / file_c がファイル名と一致する
        """
        import api.compare as m
        monkeypatch.setattr(m, "OUTPUT_DIR", tmp_path)

        res = client.post("/api/compare", files={
            "base_file": xlsx_file("base.xlsx", make_xlsx(SHEET_BASE)),
            "file_b":    xlsx_file("file_b.xlsx", make_xlsx(SHEET_B)),
            "file_c":    xlsx_file("file_c.xlsx", make_xlsx(SHEET_C)),
        })
        body = res.json()
        assert body["base_file"] == "base.xlsx"
        assert body["file_b"] == "file_b.xlsx"
        assert body["file_c"] == "file_c.xlsx"


class TestCompareTwoFiles:
    def test_two_file_compare_returns_200(self, tmp_path, monkeypatch):
        """
        Given: base / file_b の2ファイルのみ送信（file_c なし）
        When:  POST /api/compare
        Then:  HTTP 200 が返る
        """
        import api.compare as m
        monkeypatch.setattr(m, "OUTPUT_DIR", tmp_path)

        res = client.post("/api/compare", files={
            "base_file": xlsx_file("base.xlsx", make_xlsx(SHEET_BASE)),
            "file_b":    xlsx_file("file_b.xlsx", make_xlsx(SHEET_B)),
        })
        assert res.status_code == 200

    def test_two_file_compare_file_c_is_none_in_meta(self, tmp_path, monkeypatch):
        """
        Given: 2ファイル比較（file_c なし）
        Then:  レスポンスの file_c が null
        """
        import api.compare as m
        monkeypatch.setattr(m, "OUTPUT_DIR", tmp_path)

        res = client.post("/api/compare", files={
            "base_file": xlsx_file("base.xlsx", make_xlsx(SHEET_BASE)),
            "file_b":    xlsx_file("file_b.xlsx", make_xlsx(SHEET_B)),
        })
        assert res.json()["file_c"] is None
