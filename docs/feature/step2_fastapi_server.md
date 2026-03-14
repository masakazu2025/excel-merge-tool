# Step 2: FastAPI サーバー

## 概要

Step 1のPythonコアロジックをAPIとして公開し、Reactフロントエンドを静的配信する。
`python src/main.py` 一発で起動し、ブラウザから `http://localhost:8080` で利用できる。

---

## エンドポイント一覧

| メソッド | パス | 処理 |
|----------|------|------|
| `POST` | `/api/compare` | Excelファイル3つを受け取り比較実行 → diff.json保存 |
| `GET` | `/api/reports` | 保存済みレポート一覧を返す |
| `GET` | `/api/reports/{report_id}` | 指定レポートのdiff.jsonを返す |
| `GET` | `/*` | Reactビルド成果物（`frontend/dist/`）を静的配信 |

---

## POST /api/compare

### リクエスト

`multipart/form-data` でExcelファイル3つを受け取る。

```
base_file:  base.xlsx
file_b:     file_b.xlsx
file_c:     file_c.xlsx
```

### 処理フロー

1. アップロードされたファイルをメモリ上で受け取る
2. Step 1のコアロジックを呼び出して差分抽出
3. `output/{timestamp}_diff.json` として保存
4. レポートIDとメタ情報を返す

### レスポンス

```json
{
  "report_id": "20260314_153042",
  "created_at": "2026-03-14T15:30:42",
  "base_file": "base.xlsx",
  "file_b": "file_b.xlsx",
  "file_c": "file_c.xlsx",
  "total_diffs": 42,
  "total_conflicts": 3
}
```

---

## GET /api/reports

### レスポンス

```json
[
  {
    "report_id": "20260314_153042",
    "created_at": "2026-03-14T15:30:42",
    "base_file": "base.xlsx",
    "file_b": "file_b.xlsx",
    "file_c": "file_c.xlsx",
    "total_diffs": 42,
    "total_conflicts": 3
  }
]
```

`output/` フォルダ内の `*_diff.json` を降順（新しい順）で返す。
メタ情報はJSONファイル内の `meta` キーから取得する。

---

## GET /api/reports/{report_id}

Step 1の出力形式そのままのdiff.jsonを返す（step1ドキュメント参照）。

---

## 静的ファイル配信

```python
from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
```

`frontend/dist/` はReactのViteビルド成果物。
APIルートより後に登録することで `/api/*` が優先される。

---

## ファイル構成

```
excel-merge-tool/
├── src/
│   ├── main.py          # FastAPI アプリ定義・エントリポイント
│   └── extractor.py     # Step 1 コアロジック
├── frontend/
│   └── dist/            # Vite ビルド成果物（git管理外）
├── output/              # 生成されたレポートJSON
└── pyproject.toml
```

---

## 起動方法

```bash
# 依存インストール
pip install fastapi uvicorn python-multipart

# フロントエンドビルド（初回・変更時）
cd frontend && npm install && npm run build

# サーバー起動
python src/main.py
# → http://localhost:8080 で利用可能
```

---

## 決定事項

| 項目 | 決定内容 |
|------|----------|
| フレームワーク | FastAPI + uvicorn |
| ポート | 8080 |
| レポート保存先 | `output/` フォルダ（タイムスタンプ付きJSON） |
| 静的配信 | `frontend/dist/` を FastAPI がそのまま配信 |
| ファイル受け取り | `python-multipart` による multipart/form-data |
