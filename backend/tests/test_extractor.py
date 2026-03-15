"""B-030: extractor.py のエラーハンドリングテスト"""
import io
import zipfile
import pytest
from extractor import AppError, extract_diff
from tests.conftest import make_xlsx


# ---------------------------------------------------------------------------
# ヘルパー
# ---------------------------------------------------------------------------

def diff(base, b, c=None, base_name="base.xlsx", b_name="b.xlsx", c_name=None):
    return extract_diff(
        base_bytes=make_xlsx(base),
        b_bytes=make_xlsx(b),
        c_bytes=make_xlsx(c) if c is not None else None,
        base_name=base_name,
        b_name=b_name,
        c_name=c_name,
    )


SHEET = {"Sheet1": {"A1": "値"}}


# ---------------------------------------------------------------------------
# E001: 対応外ファイル形式
# ---------------------------------------------------------------------------

class TestE001:
    def test_base_csv_raises_e001(self):
        """Given: base が .csv / When: 実行 / Then: E001"""
        with pytest.raises(AppError) as exc:
            extract_diff(b"data", b"data", None, "base.csv", "b.xlsx", None)
        assert exc.value.error_code == "E001"

    def test_file_b_txt_raises_e001(self):
        """Given: file_b が .txt / When: 実行 / Then: E001"""
        with pytest.raises(AppError) as exc:
            extract_diff(b"data", b"data", None, "base.xlsx", "b.txt", None)
        assert exc.value.error_code == "E001"

    def test_file_c_pdf_raises_e001(self):
        """Given: file_c が .pdf / When: 実行 / Then: E001"""
        with pytest.raises(AppError) as exc:
            extract_diff(b"data", b"data", b"data", "base.xlsx", "b.xlsx", "c.pdf")
        assert exc.value.error_code == "E001"

    def test_xlsm_is_accepted(self):
        """Given: xlsm ファイル / When: 実行 / Then: E001 を送出しない"""
        base = make_xlsx(SHEET)
        result = extract_diff(base, base, None, "base.xlsm", "b.xlsm", None)
        assert "sheets" in result


# ---------------------------------------------------------------------------
# E002: ファイル破損
# ---------------------------------------------------------------------------

class TestE002:
    def test_bad_zip_raises_e002(self):
        """Given: ZIP不正なバイト列 / When: 実行 / Then: E002"""
        with pytest.raises(AppError) as exc:
            extract_diff(b"not a zip", make_xlsx(SHEET), None, "base.xlsx", "b.xlsx", None)
        assert exc.value.error_code == "E002"

    def test_zero_bytes_raises_e002(self):
        """Given: 0バイトファイル / When: 実行 / Then: E002"""
        with pytest.raises(AppError) as exc:
            extract_diff(b"", make_xlsx(SHEET), None, "base.xlsx", "b.xlsx", None)
        assert exc.value.error_code == "E002"

    def test_missing_workbook_xml_raises_e002(self):
        """Given: workbook.xml がない ZIP / When: 実行 / Then: E002"""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("dummy.txt", "hello")
        with pytest.raises(AppError) as exc:
            extract_diff(buf.getvalue(), make_xlsx(SHEET), None, "base.xlsx", "b.xlsx", None)
        assert exc.value.error_code == "E002"


# ---------------------------------------------------------------------------
# E003: 比較可能シートなし
# ---------------------------------------------------------------------------

class TestE003:
    def test_no_common_sheets_raises_e003(self):
        """Given: base の全シートが B に存在しない / When: 実行 / Then: E003"""
        base_bytes = make_xlsx({"Sheet1": {"A1": "a"}})
        b_bytes = make_xlsx({"Sheet2": {"A1": "b"}})
        with pytest.raises(AppError) as exc:
            extract_diff(base_bytes, b_bytes, None, "base.xlsx", "b.xlsx", None)
        assert exc.value.error_code == "E003"

    def test_partial_sheet_match_does_not_raise(self):
        """Given: base の一部シートのみ B に存在する / When: 実行 / Then: エラーなし（一部のみ処理）"""
        base_bytes = make_xlsx({"Sheet1": {"A1": "a"}, "Sheet2": {"A1": "b"}})
        b_bytes = make_xlsx({"Sheet1": {"A1": "a"}})
        result = extract_diff(base_bytes, b_bytes, None, "base.xlsx", "b.xlsx", None)
        assert "Sheet1" in result["sheets"]


# ---------------------------------------------------------------------------
# E004: XMLパース失敗
# ---------------------------------------------------------------------------

class TestE004:
    def _make_broken_xml_xlsx(self) -> bytes:
        """xl/workbook.xml は valid だが sheet1.xml が壊れた XML"""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("[Content_Types].xml", """<?xml version="1.0"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>""")
            zf.writestr("_rels/.rels", """<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="xl/workbook.xml"/>
</Relationships>""")
            zf.writestr("xl/_rels/workbook.xml.rels", """<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
    Target="worksheets/sheet1.xml"/>
</Relationships>""")
            zf.writestr("xl/workbook.xml", """<?xml version="1.0"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>""")
            # 壊れた XML
            zf.writestr("xl/worksheets/sheet1.xml", "<broken xml <<<")
        return buf.getvalue()

    def test_broken_sheet_xml_raises_e004(self):
        """Given: sheet XML が壊れている / When: 実行 / Then: E004"""
        broken = self._make_broken_xml_xlsx()
        with pytest.raises(AppError) as exc:
            extract_diff(broken, make_xlsx(SHEET), None, "base.xlsx", "b.xlsx", None)
        assert exc.value.error_code == "E004"


# ---------------------------------------------------------------------------
# E005: その他予期せぬエラー（キャッチオール）
# ---------------------------------------------------------------------------

class TestE005:
    def test_unexpected_error_is_wrapped_as_e005(self, monkeypatch):
        """Given: _compare_cells が予期せぬ例外を送出 / When: 実行 / Then: E005"""
        import extractor

        def broken_compare(*args, **kwargs):
            raise RuntimeError("unexpected")

        monkeypatch.setattr(extractor, "_compare_cells", broken_compare)
        with pytest.raises(AppError) as exc:
            diff(SHEET, SHEET)
        assert exc.value.error_code == "E005"


# ---------------------------------------------------------------------------
# 正常系: エラーなし
# ---------------------------------------------------------------------------

class TestNormal:
    def test_two_file_diff(self):
        """Given: base / B の2ファイル / When: 実行 / Then: 差分が返る"""
        base = {"Sheet1": {"A1": "旧値", "B1": "同じ"}}
        b = {"Sheet1": {"A1": "新値", "B1": "同じ"}}
        result = diff(base, b)
        cells = result["sheets"]["Sheet1"]["cells"]
        assert any(c["cell"] == "A1" and c["status"] == "update" for c in cells)

    def test_three_file_conflict(self):
        """Given: base / B / C で同セルが競合 / When: 実行 / Then: status=conflict"""
        base = {"Sheet1": {"A1": "元"}}
        b = {"Sheet1": {"A1": "B値"}}
        c = {"Sheet1": {"A1": "C値"}}
        result = diff(base, b, c)
        cells = result["sheets"]["Sheet1"]["cells"]
        assert any(c["status"] == "conflict" for c in cells)
