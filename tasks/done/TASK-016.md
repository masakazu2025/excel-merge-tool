---
id: TASK-016
title: B-007テスト実装（POST /api/compare 正常系）
type: test
status: done
refs:
  - docs/requirements/backend/REQ-002_api/behaviors/B-007.md
files:
  - backend/tests/test_b007_compare_api.py
---

## やること

B-007 の全 Given/When/Then をテストコードで実装する。

## やらないこと

- 実装コードの変更
- B-007 以外の振舞のテスト

## 完了条件

- [x] pytest が通る
- [x] B-007 の全 Given/When/Then がテストケースになっている
