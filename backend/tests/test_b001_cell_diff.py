"""B-001: セル値の差分を検出する"""
from extractor import extract_diff
from tests.conftest import make_xlsx


def diff2(base_cells, b_cells):
    """2ファイル比較ヘルパー"""
    return extract_diff(
        make_xlsx({"Sheet1": base_cells}),
        make_xlsx({"Sheet1": b_cells}),
        None,
        "base.xlsx", "b.xlsx", None,
    )


def diff3(base_cells, b_cells, c_cells):
    """3ファイル比較ヘルパー"""
    return extract_diff(
        make_xlsx({"Sheet1": base_cells}),
        make_xlsx({"Sheet1": b_cells}),
        make_xlsx({"Sheet1": c_cells}),
        "base.xlsx", "b.xlsx", "c.xlsx",
    )


def cells(result) -> list:
    return result["sheets"]["Sheet1"]["cells"]


def find(result, coord) -> dict | None:
    return next((c for c in cells(result) if c["cell"] == coord), None)


# ---------------------------------------------------------------------------
# changed_by の判定
# ---------------------------------------------------------------------------

class TestChangedBy:
    def test_b_changed_only(self):
        """Given: B のみ変更 / Then: changed_by = "b" """
        r = diff3({"A1": "旧"}, {"A1": "新"}, {"A1": "旧"})
        c = find(r, "A1")
        assert c is not None
        assert c["changed_by"] == "b"

    def test_c_changed_only(self):
        """Given: C のみ変更 / Then: changed_by = "c" """
        r = diff3({"A1": "旧"}, {"A1": "旧"}, {"A1": "新"})
        c = find(r, "A1")
        assert c is not None
        assert c["changed_by"] == "c"

    def test_both_changed(self):
        """Given: B と C 両方が変更 / Then: changed_by = "both" """
        r = diff3({"A1": "旧"}, {"A1": "B値"}, {"A1": "C値"})
        c = find(r, "A1")
        assert c is not None
        assert c["changed_by"] == "both"

    def test_no_change_cell_excluded(self):
        """Given: 全ファイルで値が同じ / Then: セルは出力に含まれない"""
        r = diff3({"A1": "同じ"}, {"A1": "同じ"}, {"A1": "同じ"})
        assert find(r, "A1") is None

    def test_both_changed_same_value(self):
        """Given: B と C 両方が同じ値に変更 / Then: changed_by = "both" """
        r = diff3({"A1": "旧"}, {"A1": "新"}, {"A1": "新"})
        c = find(r, "A1")
        assert c is not None
        assert c["changed_by"] == "both"


# ---------------------------------------------------------------------------
# 実値の保持（base_value / b_value / c_value）
# ---------------------------------------------------------------------------

class TestActualValuesStored:
    def test_all_three_values_stored(self):
        """Given: 3ファイル比較 / Then: base/b/c の実値がすべて格納される"""
        r = diff3({"A1": "base値"}, {"A1": "B値"}, {"A1": "C値"})
        c = find(r, "A1")
        assert c["base_value"] == "base値"
        assert c["b_value"] == "B値"
        assert c["c_value"] == "C値"

    def test_two_file_c_value_is_none(self):
        """Given: 2ファイル比較 / Then: c_value は None"""
        r = diff2({"A1": "旧"}, {"A1": "新"})
        c = find(r, "A1")
        assert c["c_value"] is None

    def test_new_cell_in_b_base_value_is_none(self):
        """Given: base に存在しないセルが B に存在 / Then: base_value = None"""
        r = diff2({}, {"A1": "新規"})
        c = find(r, "A1")
        assert c is not None
        assert c["base_value"] is None
        assert c["b_value"] == "新規"

    def test_deleted_cell_b_value_is_none(self):
        """Given: base に値があり B では削除（セルなし） / Then: b_value = None"""
        r = diff2({"A1": "元値"}, {})
        c = find(r, "A1")
        assert c is not None
        assert c["base_value"] == "元値"
        assert c["b_value"] is None

    def test_multiple_cells_independent(self):
        """Given: 複数セルが変更 / Then: それぞれ独立して base/b/c を保持する"""
        r = diff2({"A1": "a旧", "B1": "b旧"}, {"A1": "a新", "B1": "b新"})
        a1 = find(r, "A1")
        b1 = find(r, "B1")
        assert a1["base_value"] == "a旧" and a1["b_value"] == "a新"
        assert b1["base_value"] == "b旧" and b1["b_value"] == "b新"

    def test_unchanged_cell_not_in_output(self):
        """Given: 変更なしセルと変更ありセルが混在 / Then: 変更なしは出力されない"""
        r = diff2({"A1": "変更", "B1": "不変"}, {"A1": "変更後", "B1": "不変"})
        assert find(r, "A1") is not None
        assert find(r, "B1") is None
