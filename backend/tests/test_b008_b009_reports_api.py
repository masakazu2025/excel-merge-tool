"""B-008: 過去レポート一覧を取得できる
   B-009: 指定レポートの内容を取得できる
"""
import json
import time

from fastapi.testclient import TestClient
from app import app
import api.reports as reports_module

client = TestClient(app)


def seed_report(tmp_path, report_id: str, extra_meta: dict | None = None):
    """テスト用の _diff.json を tmp_path に作成して返す"""
    meta = {
        "created_at": f"2026-03-{report_id[-2:]}T12:00:00",
        "base_file": "base.xlsx",
        "file_b": "file_b.xlsx",
        "file_c": "file_c.xlsx",
        "total_diffs": 5,
        "total_conflicts": 1,
    }
    if extra_meta:
        meta.update(extra_meta)
    data = {"meta": meta, "sheets": {}}
    path = tmp_path / f"{report_id}_diff.json"
    path.write_text(json.dumps(data), encoding="utf-8")
    return path


# ---------------------------------------------------------------------------
# B-008: 一覧取得
# ---------------------------------------------------------------------------

class TestListReports:
    def test_returns_200(self, tmp_path, monkeypatch):
        """
        Given: output/ に diff.json が存在する
        When:  GET /api/reports
        Then:  HTTP 200 が返る
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report(tmp_path, "20260314_120000")

        res = client.get("/api/reports")
        assert res.status_code == 200

    def test_empty_list_when_no_reports(self, tmp_path, monkeypatch):
        """
        Given: output/ に diff.json が1件もない
        When:  GET /api/reports
        Then:  items が空配列、total が 0 で返る
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)

        res = client.get("/api/reports")
        assert res.status_code == 200
        body = res.json()
        assert body["items"] == []
        assert body["total"] == 0

    def test_returns_meta_fields(self, tmp_path, monkeypatch):
        """
        Given: diff.json が1件存在する
        When:  GET /api/reports
        Then:  items[0] に report_id / created_at / base_file / file_b / file_c /
               total_diffs / total_conflicts が含まれる
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report(tmp_path, "20260314_120000")

        res = client.get("/api/reports")
        item = res.json()["items"][0]
        for key in ("report_id", "created_at", "base_file", "file_b", "file_c",
                    "total_diffs", "total_conflicts"):
            assert key in item, f"key '{key}' missing"

    def test_report_id_matches_filename(self, tmp_path, monkeypatch):
        """
        Given: 20260314_120000_diff.json が存在する
        Then:  items[0].report_id == "20260314_120000"
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report(tmp_path, "20260314_120000")

        res = client.get("/api/reports")
        assert res.json()["items"][0]["report_id"] == "20260314_120000"

    def test_sorted_descending(self, tmp_path, monkeypatch):
        """
        Given: output/ に複数の diff.json が存在する
        When:  GET /api/reports
        Then:  新しい順（ファイル名降順）で並んでいる
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report(tmp_path, "20260314_100000")
        seed_report(tmp_path, "20260315_090000")
        seed_report(tmp_path, "20260313_150000")

        res = client.get("/api/reports")
        ids = [item["report_id"] for item in res.json()["items"]]
        assert ids == sorted(ids, reverse=True)

    def test_multiple_reports_count(self, tmp_path, monkeypatch):
        """
        Given: output/ に3件の diff.json が存在する
        Then:  total が 3、items に3件含まれる
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        for rid in ("20260314_100000", "20260315_090000", "20260313_150000"):
            seed_report(tmp_path, rid)

        res = client.get("/api/reports")
        body = res.json()
        assert body["total"] == 3
        assert len(body["items"]) == 3

    def test_pagination_limit(self, tmp_path, monkeypatch):
        """
        Given: output/ に5件の diff.json が存在する
        When:  GET /api/reports?page=1&limit=2
        Then:  items が 2件、total が 5
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        for i in range(5):
            seed_report(tmp_path, f"2026031{i}_100000")

        res = client.get("/api/reports?page=1&limit=2")
        body = res.json()
        assert body["total"] == 5
        assert len(body["items"]) == 2

    def test_pagination_page2(self, tmp_path, monkeypatch):
        """
        Given: output/ に5件の diff.json が存在する
        When:  GET /api/reports?page=2&limit=2
        Then:  items が 2件（2ページ目）
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        for i in range(5):
            seed_report(tmp_path, f"2026031{i}_100000")

        res = client.get("/api/reports?page=2&limit=2")
        body = res.json()
        assert len(body["items"]) == 2
        assert body["page"] == 2


# ---------------------------------------------------------------------------
# B-009: 個別取得
# ---------------------------------------------------------------------------

class TestGetReport:
    def test_returns_200_when_exists(self, tmp_path, monkeypatch):
        """
        Given: output/{report_id}_diff.json が存在する
        When:  GET /api/reports/{report_id}
        Then:  HTTP 200 が返る
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report(tmp_path, "20260314_120000")

        res = client.get("/api/reports/20260314_120000")
        assert res.status_code == 200

    def test_returns_diff_json_content(self, tmp_path, monkeypatch):
        """
        Given: diff.json が存在する
        Then:  レスポンスに meta / sheets が含まれる
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)
        seed_report(tmp_path, "20260314_120000")

        res = client.get("/api/reports/20260314_120000")
        body = res.json()
        assert "meta" in body
        assert "sheets" in body

    def test_returns_404_when_not_found(self, tmp_path, monkeypatch):
        """
        Given: 指定した report_id の diff.json が存在しない
        When:  GET /api/reports/{report_id}
        Then:  HTTP 404 が返る
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)

        res = client.get("/api/reports/nonexistent_id")
        assert res.status_code == 404

    def test_404_has_error_code_e006(self, tmp_path, monkeypatch):
        """
        Given: 存在しない report_id を指定
        Then:  レスポンスの detail.error_code == "E006"
        """
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)

        res = client.get("/api/reports/nonexistent_id")
        assert res.json()["detail"]["error_code"] == "E006"
