"""B-006: カスタムルール（merge_rules.yaml）を適用する

実装が完了すれば Green になる Red テスト。
現時点では merge_rules.yaml および適用ロジックが未実装のため FAILED になることを意図している。

設定ファイルパス: config/merge_rules.yaml
"""
import io
import pytest
from pathlib import Path
from extractor import extract_diff
from tests.conftest import make_xlsx

# config/merge_rules.yaml の想定パス
CONFIG_DIR = Path(__file__).parent.parent / "config"
RULES_FILE = CONFIG_DIR / "merge_rules.yaml"


def diff2(base_cells, b_cells, rules_yaml: str | None = None, tmp_path=None):
    """rules_yaml が与えられた場合は一時的に config/merge_rules.yaml へ書き込んで実行する"""
    if rules_yaml is not None and tmp_path is not None:
        rules_path = tmp_path / "merge_rules.yaml"
        rules_path.write_text(rules_yaml, encoding="utf-8")
        # extract_diff が config/merge_rules.yaml を読む前提でモック
        import extractor as ext
        orig = getattr(ext, "RULES_FILE", None)
        ext.RULES_FILE = rules_path
        try:
            return extract_diff(
                make_xlsx({"Sheet1": base_cells}),
                make_xlsx({"Sheet1": b_cells}),
                None, "base.xlsx", "b.xlsx", None,
            )
        finally:
            if orig is not None:
                ext.RULES_FILE = orig
            else:
                del ext.RULES_FILE
    return extract_diff(
        make_xlsx({"Sheet1": base_cells}),
        make_xlsx({"Sheet1": b_cells}),
        None, "base.xlsx", "b.xlsx", None,
    )


def find(result, coord) -> dict | None:
    return next(
        (c for c in result["sheets"]["Sheet1"]["cells"] if c["cell"] == coord),
        None,
    )


# ---------------------------------------------------------------------------
# B-006 振舞テスト（現在 Red、実装後に Green になる）
# ---------------------------------------------------------------------------

class TestExcludedValues:
    def test_excluded_value_treated_as_null(self, tmp_path):
        """
        Given: merge_rules.yaml に excluded_values: ["N/A"] が設定されている
        And:   base セルの値が "N/A"、B セルの値が "実値"
        When:  差分抽出
        Then:  base_value は "N/A" だが null として扱われ、status = "new" になる
        """
        rules = """
excluded_values:
  - "N/A"
"""
        r = diff2({"A1": "N/A"}, {"A1": "実値"}, rules_yaml=rules, tmp_path=tmp_path)
        c = find(r, "A1")
        assert c is not None
        assert c["status"] == "new"

    def test_excluded_value_b_treated_as_null(self, tmp_path):
        """
        Given: B セルの値が excluded_values の値 "N/A"
        When:  差分抽出
        Then:  "N/A" は null 扱いになり status = "delete" になる
        """
        rules = """
excluded_values:
  - "N/A"
"""
        r = diff2({"A1": "実値"}, {"A1": "N/A"}, rules_yaml=rules, tmp_path=tmp_path)
        c = find(r, "A1")
        assert c is not None
        assert c["status"] == "delete"

    def test_non_excluded_value_unchanged(self, tmp_path):
        """
        Given: セル値が excluded_values に含まれない通常の変更
        When:  差分抽出
        Then:  excluded_values の影響を受けず通常通り status = "update"
        """
        rules = """
excluded_values:
  - "N/A"
"""
        r = diff2({"A1": "旧"}, {"A1": "新"}, rules_yaml=rules, tmp_path=tmp_path)
        c = find(r, "A1")
        assert c is not None
        assert c["status"] == "update"


class TestRulePriority:
    def test_cell_rule_takes_priority_over_global(self, tmp_path):
        """
        Given: グローバルと特定セルの両方でルールが定義されている
        When:  差分抽出
        Then:  cell > column > sheet > global の優先度で適用される
        """
        rules = """
excluded_values:
  - "GLOBAL"
sheets:
  Sheet1:
    columns:
      A:
        excluded_values:
          - "COL_LEVEL"
    cells:
      A1:
        excluded_values:
          - "CELL_LEVEL"
"""
        # CELL_LEVEL は A1 のルールで除外、GLOBAL は除外されない
        r = diff2({"A1": "CELL_LEVEL"}, {"A1": "実値"}, rules_yaml=rules, tmp_path=tmp_path)
        c = find(r, "A1")
        assert c is not None
        assert c["status"] == "new"  # CELL_LEVEL が null 扱い → 実値は new
