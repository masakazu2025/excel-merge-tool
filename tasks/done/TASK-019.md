---
id: TASK-019
title: B-021〜B-023/B-025テスト実装（履歴画面）
type: test
status: done
refs:
  - docs/requirements/frontend/REQ-004_history/behaviors/B-021.md
  - docs/requirements/frontend/REQ-004_history/behaviors/B-022.md
  - docs/requirements/frontend/REQ-004_history/behaviors/B-023.md
  - docs/requirements/frontend/REQ-004_history/behaviors/B-025.md
files:
  - frontend/src/tests/history.test.tsx
---

## やること

B-021〜B-023 と B-025 の全 Given/When/Then をテストコードで実装する。

## やらないこと

- 実装コードの変更
- 他の振舞のテスト

## 完了条件

- [x] vitest が通る（または意図的 Red が存在する）
- [x] 全振舞がテストケースになっている
