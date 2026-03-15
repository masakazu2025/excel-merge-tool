---
id: TASK-007
title: REQ-006バックエンドテスト実装（B-030）
type: test
status: done
refs:
  - docs/requirements/backend/REQ-006_error_handling/behaviors/B-030.md
files:
  - backend/pyproject.toml
  - backend/tests/test_extractor.py
  - backend/tests/test_api.py
---

## やること

B-030 の全振舞をテストコードで実装する。

## やらないこと

- フロントエンドのテスト
- 実装コードの変更

## 完了条件

- [x] pytest が通る
- [x] B-030 の全 Given/When/Then がテストケースになっている
