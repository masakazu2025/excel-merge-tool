---
id: TASK-010
title: B-002テスト実装（競合検出）
type: test
status: done
refs:
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-002.md
files:
  - backend/tests/test_b002_conflict.py
---

## やること

B-002 の全 Given/When/Then をテストコードで実装する。

## やらないこと

- 実装コードの変更
- B-002 以外の振舞のテスト

## 完了条件

- [x] pytest が通る
- [x] B-002 の全 Given/When/Then がテストケースになっている
