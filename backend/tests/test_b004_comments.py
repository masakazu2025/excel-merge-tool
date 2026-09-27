"""B-004: コメントの差分を検出する

現時点では extractor.py がコメントを未実装のため、該当テストに xfail(strict=True) を付けている。
実装して pass するようになったら（XPASS で失敗する）xfail を外すこと。
"""
import pytest
from extractor import extract_diff
from tests.conftest import make_xlsx, make_xlsx_with_comment

NOT_IMPLEMENTED = pytest.mark.xfail(reason="B-004 未実装（TASK-021）", strict=True)


def comments(result) -> list:
    return result["sheets"]["Sheet1"]["comments"]


# ---------------------------------------------------------------------------
# スタブ動作の確認（常に PASSED であるべき）
# ---------------------------------------------------------------------------

class TestCommentsFieldStructure:
    def test_comments_field_exists(self):
        """comments フィールドが結果に含まれる"""
        base = make_xlsx({"Sheet1": {"A1": "値"}})
        r = extract_diff(base, base, None, "base.xlsx", "b.xlsx", None)
        assert "comments" in r["sheets"]["Sheet1"]

    def test_comments_returns_list(self):
        """comments は list 型で返る"""
        base = make_xlsx({"Sheet1": {"A1": "値"}})
        r = extract_diff(base, base, None, "base.xlsx", "b.xlsx", None)
        assert isinstance(r["sheets"]["Sheet1"]["comments"], list)


# ---------------------------------------------------------------------------
# B-004 振舞テスト（未実装のため xfail、実装後に外す）
# ---------------------------------------------------------------------------

@NOT_IMPLEMENTED
class TestCommentAdded:
    def test_comment_added_in_b_is_new(self):
        """
        Given: base にコメントなし、B に A1 へコメントあり
        When:  差分抽出
        Then:  comments に cell="A1", status="new" のエントリが含まれる
        """
        base = make_xlsx({"Sheet1": {"A1": "値"}})
        b = make_xlsx_with_comment("A1", "新しいコメント")
        r = extract_diff(base, b, None, "base.xlsx", "b.xlsx", None)
        c_list = comments(r)
        assert any(c.get("cell") == "A1" and c.get("status") == "new" for c in c_list)


@NOT_IMPLEMENTED
class TestCommentDeleted:
    def test_comment_deleted_in_b_is_delete(self):
        """
        Given: base に A1 へコメントあり、B にコメントなし
        When:  差分抽出
        Then:  comments に cell="A1", status="delete" のエントリが含まれる
        """
        base = make_xlsx_with_comment("A1", "元のコメント")
        b = make_xlsx({"Sheet1": {"A1": "値"}})
        r = extract_diff(base, b, None, "base.xlsx", "b.xlsx", None)
        c_list = comments(r)
        assert any(c.get("cell") == "A1" and c.get("status") == "delete" for c in c_list)


@NOT_IMPLEMENTED
class TestCommentTextChanged:
    def test_comment_text_appended_is_add(self):
        """
        Given: base のコメントテキストの末尾に B でテキストが追記された
        When:  差分抽出
        Then:  comments に status="add" のエントリが含まれる
        """
        base = make_xlsx_with_comment("A1", "元のテキスト")
        b = make_xlsx_with_comment("A1", "元のテキスト追記分")
        r = extract_diff(base, b, None, "base.xlsx", "b.xlsx", None)
        c_list = comments(r)
        assert any(c.get("cell") == "A1" and c.get("status") == "add" for c in c_list)

    def test_comment_text_truncated_is_sub(self):
        """
        Given: base のコメントテキストの末尾から B でテキストが削除された
        When:  差分抽出
        Then:  comments に status="sub" のエントリが含まれる
        """
        base = make_xlsx_with_comment("A1", "元のテキスト削除分")
        b = make_xlsx_with_comment("A1", "元のテキスト")
        r = extract_diff(base, b, None, "base.xlsx", "b.xlsx", None)
        c_list = comments(r)
        assert any(c.get("cell") == "A1" and c.get("status") == "sub" for c in c_list)

    def test_comment_text_replaced_is_update(self):
        """
        Given: base のコメントテキストが B で全置換された
        When:  差分抽出
        Then:  comments に status="update" のエントリが含まれる
        """
        base = make_xlsx_with_comment("A1", "古いコメント")
        b = make_xlsx_with_comment("A1", "新しいコメント")
        r = extract_diff(base, b, None, "base.xlsx", "b.xlsx", None)
        c_list = comments(r)
        assert any(c.get("cell") == "A1" and c.get("status") == "update" for c in c_list)
