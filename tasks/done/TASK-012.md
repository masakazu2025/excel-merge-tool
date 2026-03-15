---
id: TASK-012
title: B-004テスト実装（コメント差分）
type: test
status: done
refs:
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-004.md
files:
  - backend/tests/test_b004_comments.py
---

## やること

B-004 の全 Given/When/Then をテストコードで実装する。
現実装ではコメント差分は未実装（comments: [] で返る）のため、
未実装を xfail マークして記録する。

## やらないこと

- 実装コードの変更
- B-004 以外の振舞のテスト

## 完了条件

- [x] pytest が通る（xfail 含む）
- [x] B-004 の全 Given/When/Then がテストケースになっている
