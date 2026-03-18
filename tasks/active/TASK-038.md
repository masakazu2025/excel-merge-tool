---
id: TASK-038
title: レポートヘッダーに新規比較・履歴ナビゲーションを追加
type: impl
status: draft
refs:
  - docs/requirements/frontend/REQ-005_report/spec.md
files:
  - frontend/src/pages/Report.tsx
---

## 背景

TASK-037（全画面化対応）でApp.tsxのHeaderをReport以外に限定した結果、
レポート画面のヘッダーに「新規比較」「履歴」へのナビゲーションリンクがなくなった。

## やること

- レポート画面のダークヘッダーに「新規比較」「履歴」へのリンクを追加する

## やらないこと

- ヘッダーのデザイン全面変更

## 完了条件

- [ ] レポート画面から「新規比較」（ホームへ戻る）に移動できる
- [ ] レポート画面から「履歴」画面に移動できる
