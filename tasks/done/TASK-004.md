---
id: TASK-004
title: 比較履歴一覧画面の実装
type: impl
status: done
refs:
  - docs/requirements/frontend/REQ-004_history/spec.md
files:
  - frontend/src/App.tsx
  - frontend/src/components/Header.tsx
  - frontend/src/pages/History.tsx
  - frontend/src/pages/Home.tsx
---

# TASK-004 比較履歴一覧画面の実装

## やること

- Header コンポーネント（ナビ）を新規作成
- History ページを新規作成
- App.tsx に /history ルートを追加
- Home.tsx から ReportList を削除

## やらないこと

- 結果画面の変更
- API の変更

## 完了条件

- [ ] ヘッダーに「新規比較」「履歴」のナビが表示される
- [ ] /history で履歴テーブルが表示される
- [ ] 行クリックで /report/:id に遷移する
- [ ] 履歴0件で空メッセージが表示される
- [ ] Home.tsx から ReportList が削除されている
