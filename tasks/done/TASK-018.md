---
id: TASK-018
title: B-010〜B-020/B-024テスト実装（ファイル選択画面）
type: test
status: done
refs:
  - docs/requirements/frontend/REQ-003_file_selection/behaviors/B-010.md
  - docs/requirements/frontend/REQ-003_file_selection/behaviors/B-011.md
  - docs/requirements/frontend/REQ-003_file_selection/behaviors/B-012.md
  - docs/requirements/frontend/REQ-003_file_selection/behaviors/B-013.md
  - docs/requirements/frontend/REQ-003_file_selection/behaviors/B-014.md
  - docs/requirements/frontend/REQ-003_file_selection/behaviors/B-015.md
  - docs/requirements/frontend/REQ-003_file_selection/behaviors/B-016.md
  - docs/requirements/frontend/REQ-003_file_selection/behaviors/B-017.md
  - docs/requirements/frontend/REQ-003_file_selection/behaviors/B-018.md
  - docs/requirements/frontend/REQ-003_file_selection/behaviors/B-019.md
  - docs/requirements/frontend/REQ-003_file_selection/behaviors/B-020.md
  - docs/requirements/frontend/REQ-003_file_selection/behaviors/B-024.md
files:
  - frontend/src/tests/fileSelection.test.tsx
---

## やること

B-010〜B-020 と B-024 の全 Given/When/Then をテストコードで実装する。

## やらないこと

- 実装コードの変更
- 他の振舞のテスト

## 完了条件

- [x] vitest が通る（または意図的 Red が存在する）
- [x] 全振舞がテストケースになっている
