---
id: TASK-017
title: B-008/B-009テスト実装（レポートAPI）
type: test
status: done
refs:
  - docs/requirements/backend/REQ-002_api/behaviors/B-008.md
  - docs/requirements/backend/REQ-002_api/behaviors/B-009.md
files:
  - backend/tests/test_b008_b009_reports_api.py
---

## やること

B-008（一覧取得）と B-009（個別取得）の全 Given/When/Then をテストコードで実装する。

## やらないこと

- 実装コードの変更
- B-008/B-009 以外の振舞のテスト

## 完了条件

- [x] pytest が全件 PASSED
- [x] B-008/B-009 の全 Given/When/Then がテストケースになっている
