"""B-005: 図形の差分を検出する

実装が完了すれば Green になる Red テスト。
現時点では extractor.py が図形差分を未実装のため FAILED になることを意図している。
"""
from extractor import extract_diff
from tests.conftest import make_xlsx, make_xlsx_with_shape


def shapes(result) -> dict:
    return result["sheets"]["Sheet1"]["shapes"]


# ---------------------------------------------------------------------------
# スタブ動作の確認（常に PASSED であるべき）
# ---------------------------------------------------------------------------

class TestShapesFieldStructure:
    def test_shapes_field_exists(self):
        """shapes フィールドが結果に含まれる"""
        base = make_xlsx({"Sheet1": {"A1": "値"}})
        r = extract_diff(base, base, None, "base.xlsx", "b.xlsx", None)
        assert "shapes" in r["sheets"]["Sheet1"]

    def test_shapes_has_required_keys(self):
        """shapes に matched / added_b / added_c / deleted_b / deleted_c が含まれる"""
        base = make_xlsx({"Sheet1": {"A1": "値"}})
        r = extract_diff(base, base, None, "base.xlsx", "b.xlsx", None)
        sh = r["sheets"]["Sheet1"]["shapes"]
        for key in ("matched", "added_b", "added_c", "deleted_b", "deleted_c"):
            assert key in sh


# ---------------------------------------------------------------------------
# B-005 振舞テスト（現在 Red、実装後に Green になる）
# ---------------------------------------------------------------------------

class TestShapeTextChanged:
    def test_textbox_text_change_detected_in_matched(self):
        """
        Given: base と B で同じ ID の図形（sp）のテキストが変更
        When:  差分抽出
        Then:  shapes["matched"] に id="1" で status が付いたエントリが含まれる
        """
        base = make_xlsx_with_shape("1", "旧テキスト")
        b = make_xlsx_with_shape("1", "新テキスト")
        r = extract_diff(base, b, None, "base.xlsx", "b.xlsx", None)
        matched = shapes(r)["matched"]
        assert any(s.get("id") == "1" and s.get("status") in ("update", "add", "sub") for s in matched)

    def test_textbox_unchanged_not_in_matched(self):
        """
        Given: base と B で同じ ID の図形のテキストが同じ
        When:  差分抽出
        Then:  shapes["matched"] に変更なしエントリは含まれない（または status="no_change"）
        """
        base = make_xlsx_with_shape("1", "同じテキスト")
        b = make_xlsx_with_shape("1", "同じテキスト")
        r = extract_diff(base, b, None, "base.xlsx", "b.xlsx", None)
        matched = shapes(r)["matched"]
        # 変更なし図形は出力されないか、status="no_change" であるべき
        changed = [s for s in matched if s.get("status") not in (None, "no_change")]
        assert len(changed) == 0


class TestShapeAddedDeleted:
    def test_shape_added_in_b_appears_in_added_b(self):
        """
        Given: base に図形なし、B に図形あり
        When:  差分抽出
        Then:  shapes["added_b"] にエントリが含まれる
        """
        base = make_xlsx({"Sheet1": {"A1": "値"}})
        b = make_xlsx_with_shape("1", "新規図形")
        r = extract_diff(base, b, None, "base.xlsx", "b.xlsx", None)
        assert len(shapes(r)["added_b"]) > 0

    def test_shape_deleted_in_b_appears_in_deleted_b(self):
        """
        Given: base に図形あり、B に同 ID の図形なし
        When:  差分抽出
        Then:  shapes["deleted_b"] にエントリが含まれ、status="delete"
        """
        base = make_xlsx_with_shape("1", "削除される図形")
        b = make_xlsx({"Sheet1": {"A1": "値"}})
        r = extract_diff(base, b, None, "base.xlsx", "b.xlsx", None)
        deleted = shapes(r)["deleted_b"]
        assert len(deleted) > 0
        assert all(s.get("status") == "delete" for s in deleted)
