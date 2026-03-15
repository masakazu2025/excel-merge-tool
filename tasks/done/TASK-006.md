---
id: TASK-006
title: フロントエンドエラーハンドリング実装
type: impl
status: ready
refs:
  - docs/requirements/backend/REQ-006_error_handling/behaviors/B-031.md
  - docs/requirements/backend/REQ-006_error_handling/errors.md
files:
  - frontend/src/pages/Home.tsx
  - frontend/src/pages/Report.tsx
  - frontend/src/pages/History.tsx
  - frontend/src/components/DiffGrid.tsx
---

## やること

B-031 の全振舞を実装する。

- fetch を共通ラッパーでラップし F001・F002 をハンドリング
- Report.tsx で F003（sheets undefined / JSON不正）をハンドリング
- DiffGrid で不正セルデータをスキップ（クラッシュ防止）

## やらないこと

- バックエンドの変更
- エラー専用コンポーネントの作成（インラインで表示）

## 完了条件

- [ ] サーバー停止時に "サーバーに接続できません" が表示される
- [ ] バックエンドエラー時にそのメッセージが表示される
- [ ] 不正 JSON 受信時に "レポートの形式が正しくありません" が表示される
- [ ] sheets が undefined でもクラッシュしない
- [ ] DiffGrid に不正セルデータが来てもクラッシュしない
