---
id: REQ-002
title: FastAPI サーバー
status: approved
---

# REQ-002 FastAPI サーバー

## 概要

差分比較APIと過去レポート管理APIを提供する。フロントエンドの静的配信も兼ねる。
ファイル選択はブラウザのFile API（ドラッグ＆ドロップ含む）で行い、multipart/form-dataで受け取る。

## 受け入れ条件

- [x] `POST /api/compare` で3ファイルを受け取り差分抽出を実行できる
- [x] `GET /api/reports` で過去レポート一覧を返せる
- [x] `GET /api/reports/{id}` で指定レポートの diff.json を返せる
- [x] `GET /api/reports/{id}/cell-range` で指定行/列のセル値を返せる
- [x] `frontend/dist/` を静的配信できる

## ファイル構成

```
backend/src/
├── main.py          # 起動エントリポイントのみ
├── app.py           # FastAPI app定義・ルーター登録
├── api/
│   ├── compare.py   # POST /api/compare
│   └── reports.py   # GET /api/reports, GET /api/reports/{id}
└── extractor.py     # 差分抽出ロジック（REQ-001）
```

## 振舞一覧

| ID | 内容 | status |
|----|------|--------|
| B-007 | 3ファイルをアップロードして比較を実行できる | done |
| B-008 | 過去レポート一覧を取得できる | done |
| B-009 | 指定レポートの内容を取得できる | done |
| B-036 | 指定行/列のセル値を取得できる（cell-rangeエンドポイント） | done |
