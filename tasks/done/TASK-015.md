---
id: TASK-015
title: B-006テスト実装（カスタムルール）
type: test
status: done
refs:
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-006.md
files:
  - backend/tests/test_b006_custom_rules.py
---

## やること

B-006 の全 Given/When/Then をテストコードで実装する。
現実装では merge_rules.yaml は未実装のため FAILED（Red）になることを意図する。

## やらないこと

- 実装コードの変更
- B-006 以外の振舞のテスト

## 完了条件

- [x] pytest が通る（Red テストが存在する）
- [x] B-006 の全 Given/When/Then がテストケースになっている
