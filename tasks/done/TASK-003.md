---
id: TASK-003
title: ファイル選択画面の実装（モック）
type: impl
status: done
refs:
  - docs/requirements/frontend/REQ-003_file_selection/spec.md
files:
  - frontend/src/pages/Home.tsx
  - frontend/src/components/FileSelectionList.tsx
---

# TASK-003 ファイル選択画面の実装（モック）

## やること

REQ-003の仕様に従いファイル選択UIを実装する。
API呼び出しはモック（console.log）にする。

## やらないこと

- API接続
- 結果画面の変更
- ReportListの変更

## 完了条件

- [ ] ボタンでファイルを追加できる
- [ ] DnDでファイルを追加できる
- [ ] 複数ファイルを一度に追加できる
- [ ] ファイル名省略表示・マウスオーバーでフルネーム
- [ ] 先頭行がデフォルトで比較元選択
- [ ] ラジオで比較元を変更できる
- [ ] 比較元行に[比較元]バッジ表示
- [ ] ×ボタンで削除できる
- [ ] 比較元行削除で先頭行が自動選択
- [ ] 1ファイル以下で比較実行がグレーアウト
