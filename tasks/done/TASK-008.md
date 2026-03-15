---
id: TASK-008
title: REQ-006フロントエンドテスト実装（B-031）
type: test
status: done
refs:
  - docs/requirements/backend/REQ-006_error_handling/behaviors/B-031.md
files:
  - frontend/package.json
  - frontend/vite.config.ts
  - frontend/src/tests/errorHandling.test.tsx
---

## やること

B-031 の全振舞をテストコードで実装する。

## やらないこと

- バックエンドのテスト
- 実装コードの変更

## 完了条件

- [x] vitest が通る
- [x] B-031 の全 Given/When/Then がテストケースになっている
