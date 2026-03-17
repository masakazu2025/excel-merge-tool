---
id: TASK-036
title: 詳細モーダルのサイズ固定とセル表示の統一
type: impl
status: ready
refs:
  - docs/requirements/frontend/REQ-005_report/behaviors/B-032.md
files:
  - frontend/src/components/CellDetailModal.tsx
  - frontend/src/components/DiffGrid.tsx
  - frontend/src/pages/Report.tsx
  - frontend/src/tests/report.test.tsx
---

## やること

- モーダルの高さを固定し、コンテンツ超過時はスクロール
- 常に比較ファイル数分のセルを表示（null・空文字どちらも「（空）」と表示）

## やらないこと

- モーダル以外のコンポーネントの変更

## 完了条件

### TDD ステップ
- [ ] テストを実行して Red になることを確認した
- [ ] 実装して Green になった
- [ ] `files:` 以外のファイルを変更していない

### シナリオ
- [ ] キーボード移動中にモーダルサイズが変わらない
- [ ] 2ファイル比較で常に2セル表示される
- [ ] 3ファイル比較で常に3セル表示される
- [ ] null のセルに「（空）」が表示される
