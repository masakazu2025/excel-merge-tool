---
id: TASK-044
title: 一覧画面キーボードナビゲーション実装
type: impl
status: ready
refs:
  - docs/requirements/frontend/REQ-004_history/behaviors/B-038.md
files:
  - frontend/src/pages/History.tsx
  - frontend/src/tests/history_keyboard.test.tsx
---

## やること

History.tsx にキーボードナビゲーションを追加する。
- 画面表示時にカーソルを左上（row:0, col:0）に初期配置
- `↑↓←→` でカーソル移動（端では移動しない）
- `Enter` でフォーカス行の `/report/:id` に遷移
- フォーカスセルを DiffGrid と同じハイライトスタイルで表示

## やらないこと

- ページをまたいだカーソル移動
- 履歴0件時のキーボード操作

## 完了条件

- [ ] テスト (B-038) がグリーンになる
- [ ] 画面表示時に左上にカーソルが置かれる
- [ ] 上下左右キーでカーソルが移動する
- [ ] Enter で詳細画面に遷移する
- [ ] フォーカスセルがハイライト表示される
