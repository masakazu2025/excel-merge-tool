---
id: TASK-011
title: B-003テスト実装（status付与ルール）
type: test
status: done
refs:
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-003.md
files:
  - backend/tests/test_b003_status.py
---

## やること

B-003 の全 Given/When/Then をテストコードで実装する。

## やらないこと

- 実装コードの変更
- B-003 以外の振舞のテスト

## 完了条件

- [x] pytest が通る
- [x] B-003 の全 Given/When/Then がテストケースになっている
