---
id: TASK-042
title: 列名・行名表示設定UI実装（B-037）
type: impl
status: done
refs:
  - docs/requirements/frontend/REQ-005_report/behaviors/B-037.md
files:
  - frontend/src/components/DiffGrid.tsx
  - frontend/src/pages/Report.tsx
  - frontend/src/tests/report.test.tsx
---

## やること

- フィルタバーに「⚙ 表示設定」ボタンを追加
- ポップアップで列名行番号・行名列番号を入力
- 適用時にcell-range APIを呼び出してラベルを取得
- グリッドに名称行・名称列を挿入して表示
- シート切り替えでリセット

## やらないこと

- レポートをまたいだ設定の保持

## 完了条件

- [x] 表示設定ポップアップが開閉できる
- [x] 列名が設定されグリッドに名称行が表示される
- [x] 行名が設定されグリッドに名称列が表示される
- [x] クリアで設定が解除される
- [x] テストが通る

## 依存

TASK-041（cell-rangeエンドポイント）が完了していること
