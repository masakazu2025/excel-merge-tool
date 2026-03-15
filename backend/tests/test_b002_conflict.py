"""B-002: 競合を検出する"""
from extractor import extract_diff
from tests.conftest import make_xlsx


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


class TestConflict:
    def test_b_and_c_differ_from_base_and_each_other_is_conflict(self):
        """
        Given: B と C が同じセルをそれぞれ異なる値に変更
        When:  差分抽出
        Then:  status = "conflict", changed_by = "both"
        """
        r = diff3({"A1": "元"}, {"A1": "B値"}, {"A1": "C値"})
        c = find(r, "A1")
        assert c is not None
        assert c["status"] == "conflict"
        assert c["changed_by"] == "both"

    def test_conflict_preserves_all_three_values(self):
        """
        Given: conflict セル
        Then:  base_value / b_value / c_value がすべて保持される
        """
        r = diff3({"A1": "元"}, {"A1": "B値"}, {"A1": "C値"})
        c = find(r, "A1")
        assert c["base_value"] == "元"
        assert c["b_value"] == "B値"
        assert c["c_value"] == "C値"

    def test_b_and_c_same_change_is_not_conflict(self):
        """
        Given: B と C が同じセルを同じ値に変更
        When:  差分抽出
        Then:  status は "conflict" にならない
        And:   changed_by = "both"
        """
        r = diff3({"A1": "元"}, {"A1": "新"}, {"A1": "新"})
        c = find(r, "A1")
        assert c is not None
        assert c["status"] != "conflict"
        assert c["changed_by"] == "both"

    def test_only_b_changed_is_not_conflict(self):
        """
        Given: B のみ変更、C は base と同じ
        Then:  status は "conflict" にならない
        """
        r = diff3({"A1": "元"}, {"A1": "B値"}, {"A1": "元"})
        c = find(r, "A1")
        assert c is not None
        assert c["status"] != "conflict"

    def test_only_c_changed_is_not_conflict(self):
        """
        Given: C のみ変更、B は base と同じ
        Then:  status は "conflict" にならない
        """
        r = diff3({"A1": "元"}, {"A1": "元"}, {"A1": "C値"})
        c = find(r, "A1")
        assert c is not None
        assert c["status"] != "conflict"

    def test_multiple_conflicts_independent(self):
        """
        Given: 複数セルが競合
        Then:  それぞれ独立して conflict になる
        """
        r = diff3(
            {"A1": "元1", "B2": "元2"},
            {"A1": "B1", "B2": "B2"},
            {"A1": "C1", "B2": "C2"},
        )
        assert find(r, "A1")["status"] == "conflict"
        assert find(r, "B2")["status"] == "conflict"
