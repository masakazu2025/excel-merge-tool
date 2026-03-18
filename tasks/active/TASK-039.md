---
id: TASK-039
title: フィルタ操作強化（B-034実装）
type: impl
status: ready
refs:
  - docs/requirements/frontend/REQ-005_report/behaviors/B-034.md
files:
  - frontend/src/components/DiffGrid.tsx
  - frontend/src/components/ColRowFilter.tsx
  - frontend/src/pages/Report.tsx
  - frontend/src/tests/report.test.tsx
---

## やること

B-034の振舞を実装する

- 列・行ヘッダーのダブルクリックで除外
- フィルタ一括解除ボタン（フィルタあり時のみ表示）
- ドロップダウン内スクロール（最大高さ設定）
- ドロップダウン内検索ボックス

## やらないこと

- フィルタ以外の機能変更

## 完了条件

- [ ] ダブルクリックで列・行が除外される
- [ ] 一括解除ボタンで全フィルタがリセットされる
- [ ] ドロップダウンが多数の項目でスクロール可能になる
- [ ] 検索ボックスで項目を絞り込める
- [ ] テストが通る
