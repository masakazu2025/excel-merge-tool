"""B-030: API レイヤーのエラーハンドリングテスト（E001/E002/E005/E006/E007）"""
import io
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import app
from tests.conftest import make_xlsx

client = TestClient(app)

SHEET = {"Sheet1": {"A1": "値"}}


def _xlsx_file(name: str, data: bytes):
    return (name, io.BytesIO(data), "application/octet-stream")


def _deny_access_under(monkeypatch, directory: Path, method: str):
    """directory 配下のファイルに対する Path.<method> を PermissionError にする"""
    original = getattr(Path, method)

    def denied(self, *args, **kwargs):
        if directory in self.parents:
            raise PermissionError(f"permission denied: {self}")
        return original(self, *args, **kwargs)

    monkeypatch.setattr(Path, method, denied)


# ---------------------------------------------------------------------------
# E001: 対応外ファイル形式
# ---------------------------------------------------------------------------

class TestE001Api:
    def test_csv_base_returns_422_e001(self):
        """Given: base が .csv / When: POST /api/compare / Then: 422 + E001"""
        res = client.post(
            "/api/compare",
            files={
                "base_file": _xlsx_file("base.csv", b"data"),
                "file_b": _xlsx_file("b.xlsx", make_xlsx(SHEET)),
            },
        )
        assert res.status_code == 422
        assert res.json()["detail"]["error_code"] == "E001"

    def test_txt_file_b_returns_422_e001(self):
        """Given: file_b が .txt / When: POST /api/compare / Then: 422 + E001"""
        res = client.post(
            "/api/compare",
            files={
                "base_file": _xlsx_file("base.xlsx", make_xlsx(SHEET)),
                "file_b": _xlsx_file("b.txt", b"data"),
            },
        )
        assert res.status_code == 422
        assert res.json()["detail"]["error_code"] == "E001"


# ---------------------------------------------------------------------------
# E002: ファイル破損
# ---------------------------------------------------------------------------

class TestE002Api:
    def test_bad_zip_returns_422_e002(self):
        """Given: ZIP不正なバイト列 / When: POST /api/compare / Then: 422 + E002"""
        res = client.post(
            "/api/compare",
            files={
                "base_file": _xlsx_file("base.xlsx", b"not a zip"),
                "file_b": _xlsx_file("b.xlsx", make_xlsx(SHEET)),
            },
        )
        assert res.status_code == 422
        assert res.json()["detail"]["error_code"] == "E002"

    def test_zero_bytes_returns_422_e002(self):
        """Given: 0バイトファイル / When: POST /api/compare / Then: 422 + E002"""
        res = client.post(
            "/api/compare",
            files={
                "base_file": _xlsx_file("base.xlsx", b""),
                "file_b": _xlsx_file("b.xlsx", make_xlsx(SHEET)),
            },
        )
        assert res.status_code == 422
        assert res.json()["detail"]["error_code"] == "E002"


# ---------------------------------------------------------------------------
# E005: レポート保存失敗
# ---------------------------------------------------------------------------

class TestE005SaveApi:
    def test_save_failure_returns_422_e005(self, monkeypatch, tmp_path):
        """Given: OUTPUT_DIR への書き込み失敗 / When: POST /api/compare / Then: 422 + E005"""
        import api.compare as compare_module

        # chmod は Windows で効かないため、OUTPUT_DIR 配下への書き込みを PermissionError にする
        monkeypatch.setattr(compare_module, "OUTPUT_DIR", tmp_path)
        _deny_access_under(monkeypatch, tmp_path, "write_text")

        xlsx = make_xlsx(SHEET)
        res = client.post(
            "/api/compare",
            files={
                "base_file": _xlsx_file("base.xlsx", xlsx),
                "file_b": _xlsx_file("b.xlsx", xlsx),
            },
        )
        assert res.status_code == 422
        assert res.json()["detail"]["error_code"] == "E005"


# ---------------------------------------------------------------------------
# E006: レポートが見つからない
# ---------------------------------------------------------------------------

class TestE006Api:
    def test_missing_report_returns_404_e006(self, monkeypatch, tmp_path):
        """Given: 存在しない report_id / When: GET /api/reports/{id} / Then: 404 + E006"""
        import api.reports as reports_module
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)

        res = client.get("/api/reports/nonexistent_id")
        assert res.status_code == 404
        assert res.json()["detail"]["error_code"] == "E006"


# ---------------------------------------------------------------------------
# E007: レポートファイル読み込み失敗
# ---------------------------------------------------------------------------

class TestE007Api:
    def test_broken_json_returns_404_e007(self, monkeypatch, tmp_path):
        """Given: JSONが不正なファイル / When: GET /api/reports/{id} / Then: 404 + E007"""
        import api.reports as reports_module
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)

        report_file = tmp_path / "testreport_diff.json"
        report_file.write_text("{ broken json <<<", encoding="utf-8")

        res = client.get("/api/reports/testreport")
        assert res.status_code == 404
        assert res.json()["detail"]["error_code"] == "E007"

    def test_unreadable_file_returns_404_e007(self, monkeypatch, tmp_path):
        """Given: 読み取り権限なしファイル / When: GET /api/reports/{id} / Then: 404 + E007"""
        import api.reports as reports_module
        monkeypatch.setattr(reports_module, "OUTPUT_DIR", tmp_path)

        report_file = tmp_path / "locked_diff.json"
        report_file.write_text("{}", encoding="utf-8")
        # chmod は Windows で効かないため、OUTPUT_DIR 配下の読み込みを PermissionError にする
        _deny_access_under(monkeypatch, tmp_path, "read_text")

        res = client.get("/api/reports/locked")
        assert res.status_code == 404
        assert res.json()["detail"]["error_code"] == "E007"
