"""B-003: status を付与する"""
from extractor import extract_diff
from tests.conftest import make_xlsx


def diff2(base_cells, b_cells):
    return extract_diff(
        make_xlsx({"Sheet1": base_cells}),
        make_xlsx({"Sheet1": b_cells}),
        None,
        "base.xlsx", "b.xlsx", None,
    )


def diff3(base_cells, b_cells, c_cells):
    return extract_diff(
        make_xlsx({"Sheet1": base_cells}),
        make_xlsx({"Sheet1": b_cells}),
        make_xlsx({"Sheet1": c_cells}),
        "base.xlsx", "b.xlsx", "c.xlsx",
    )


def find(result, coord) -> dict | None:
    return next(
        (c for c in result["sheets"]["Sheet1"]["cells"] if c["cell"] == coord),
        None,
    )


class TestStatusConflict:
    def test_both_changed_different_values_is_conflict(self):
        """
        Given: changed_by = "both" かつ b_value ≠ c_value
        Then:  status = "conflict"
        """
        r = diff3({"A1": "元"}, {"A1": "B値"}, {"A1": "C値"})
        assert find(r, "A1")["status"] == "conflict"


class TestStatusNew:
    def test_base_null_b_has_value_is_new(self):
        """
        Given: base にセルなし → B に値あり
        Then:  status = "new"
        """
        r = diff2({}, {"A1": "新規"})
        assert find(r, "A1")["status"] == "new"

    def test_base_null_c_has_value_is_new(self):
        """
        Given: base にセルなし → C に値あり
        Then:  status = "new"
        """
        r = diff3({}, {"A1": "元"}, {"A1": "新規"})
        # B と base が同じ（B にも値がない）、C に新規
        r2 = diff3({}, {}, {"A1": "新規"})
        assert find(r2, "A1")["status"] == "new"


class TestStatusDelete:
    def test_base_has_value_b_null_is_delete(self):
        """
        Given: base に値あり → B にセルなし
        Then:  status = "delete"
        """
        r = diff2({"A1": "元値"}, {})
        assert find(r, "A1")["status"] == "delete"

    def test_base_has_value_c_null_is_delete(self):
        """
        Given: base に値あり → C にセルなし（B は変更なし）
        Then:  status = "delete"
        """
        r = diff3({"A1": "元値"}, {"A1": "元値"}, {})
        assert find(r, "A1")["status"] == "delete"


class TestStatusAdd:
    def test_text_appended_to_end_is_add(self):
        """
        Given: b_value が base_value の末尾にテキストを追加した形
        Then:  status = "add"
        """
        r = diff2({"A1": "Hello"}, {"A1": "Hello World"})
        assert find(r, "A1")["status"] == "add"

    def test_text_appended_multiline_is_add(self):
        """
        Given: 末尾に改行＋テキスト追加
        Then:  status = "add"
        """
        r = diff2({"A1": "行1"}, {"A1": "行1\n行2"})
        assert find(r, "A1")["status"] == "add"


class TestStatusSub:
    def test_text_removed_from_end_is_sub(self):
        """
        Given: b_value が base_value の末尾からテキストを削除した形
        Then:  status = "sub"
        """
        r = diff2({"A1": "Hello World"}, {"A1": "Hello"})
        assert find(r, "A1")["status"] == "sub"


class TestStatusUpdate:
    def test_middle_edit_is_update(self):
        """
        Given: テキストの途中が変更（末尾追加・削除ではない）
        Then:  status = "update"
        """
        r = diff2({"A1": "Hello World"}, {"A1": "Hello Earth"})
        assert find(r, "A1")["status"] == "update"

    def test_full_replace_is_update(self):
        """
        Given: 全置換
        Then:  status = "update"
        """
        r = diff2({"A1": "旧"}, {"A1": "新"})
        assert find(r, "A1")["status"] == "update"

    def test_formula_change_is_update(self):
        """
        Given: 数式が変更
        Then:  status = "update"
        （add/sub は value/rich_text のみ対象）
        """
        # conftest の make_xlsx は inlineStr のみなので formula は直接テストが難しい
        # _determine_status を直接呼んで cell_type = "formula" を確認する
        from extractor import _determine_status
        status = _determine_status("=SUM(A1)", "=SUM(A1:B1)", None, "b", "formula")
        assert status == "update"

    def test_no_add_sub_for_formula_type(self):
        """
        Given: 数式セルで末尾追加形のテキスト変化
        Then:  add/sub にはならず update になる
        """
        from extractor import _determine_status
        # "=A" → "=AB" は末尾追加だが formula 型なので update
        status = _determine_status("=A", "=AB", None, "b", "formula")
        assert status == "update"
