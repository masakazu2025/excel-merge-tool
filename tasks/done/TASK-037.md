---
id: TASK-037
title: グリッド全画面化・スクロールバー常時表示
type: impl
status: done
refs:
  - docs/requirements/frontend/REQ-005_report/behaviors/B-033.md
files:
  - frontend/src/pages/Report.tsx
  - frontend/src/components/DiffGrid.tsx
  - frontend/src/tests/report.test.tsx
---

## やること

- レポート画面のグリッドエリアを縦横ともビューポート最大に広げる
- 差分グリッドに縦・横スクロールバーを常時表示する

## やらないこと

- ブラウザのフルスクリーンモード切り替え
- ヘッダー・シートタブ・フィルタバーのレイアウト変更

## 完了条件

- [ ] グリッドが画面の残り高さ・幅をすべて使って表示される
- [ ] 縦・横スクロールバーが常時表示される
- [ ] テストが通る
