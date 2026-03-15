---
id: TASK-013
title: B-005テスト実装（図形差分）
type: test
status: done
refs:
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-005.md
files:
  - backend/tests/test_b005_shapes.py
---

## やること

B-005 の全 Given/When/Then をテストコードで実装する。
現実装では図形差分は未実装（shapes: {} スタブ）のため、
未実装を xfail マークして記録する。

## やらないこと

- 実装コードの変更
- B-005 以外の振舞のテスト

## 完了条件

- [x] pytest が通る（xfail 含む）
- [x] B-005 の全 Given/When/Then がテストケースになっている
