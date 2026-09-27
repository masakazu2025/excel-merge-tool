---
id: TASK-046
title: 未実装の振舞（B-004〜B-006）のテストに xfail を付ける
type: test
status: done
refs:
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-004.md
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-005.md
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-006.md
  - tasks/active/TASK-021.md
files:
  - backend/tests/test_b004_comments.py
  - backend/tests/test_b005_shapes.py
  - backend/tests/test_b006_custom_rules.py
---

# TASK-046 未実装の振舞のテストに xfail を付ける

## 背景

B-004（コメント）/ B-005（図形）/ B-006（カスタムルール）は振舞が draft、実装は TASK-021 で行う予定。
テストだけが先にあるため、現状は 11 件が failed になり、外から見ると「壊れている」と読まれてしまう。

## やること

現在失敗しているテストだけに `@pytest.mark.xfail(reason="B-00X 未実装（TASK-021）", strict=True)` を付ける。
`strict=True` にしておくことで、実装が進んで通るようになったときに XPASS として気付ける（そのとき xfail を外す）。

## やらないこと

- 実装（extractor.py）の変更
- テスト内容（Given/When/Then）の変更
- 現在 pass しているテストへの xfail 付与

## 完了条件

- [x] `pytest` の結果で B-004〜B-006 の失敗が 0 件になり、xfailed として表示される
- [x] `files:` 以外のファイルを変更していない
