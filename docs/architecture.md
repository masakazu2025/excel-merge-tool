---
type: architecture
status: approved
---

# アーキテクチャ

```mermaid
graph TD
  Browser["ブラウザ (React)"]
  FastAPI["FastAPI サーバー (Python)"]
  Extractor["差分抽出 (extractor.py)"]
  Output["output/ diff.json"]

  Browser -->|"POST /api/compare (3ファイル)"| FastAPI
  FastAPI --> Extractor
  Extractor -->|差分データ| Output
  FastAPI -->|"GET /api/reports/:id"| Output
  Output -->|diff.json| Browser
  FastAPI -->|"静的配信 frontend/dist/"| Browser
```

## コンポーネント概要

| コンポーネント | 技術 | 役割 |
|-------------|------|------|
| フロントエンド | React 18 / Vite / TypeScript / Tailwind | アップロード・差分レビューUI |
| APIサーバー | FastAPI / uvicorn | ファイル受付・結果配信 |
| 差分抽出 | Python（標準ライブラリのみ） | ZIP解凍・XML比較・diff.json生成 |

## データフロー

```mermaid
sequenceDiagram
  participant U as ユーザー
  participant F as フロントエンド
  participant A as FastAPI
  participant E as Extractor

  U->>F: 3ファイル選択 → 比較実行
  F->>A: POST /api/compare
  A->>E: 差分抽出実行
  E->>A: diff dict
  A->>A: output/{timestamp}_diff.json 保存
  A->>F: report_id
  F->>A: GET /api/reports/{id}
  A->>F: diff.json
  F->>U: 差分レビュー画面表示
```

## フォルダ構成

```
backend/
├── src/
│   ├── main.py          # FastAPI アプリ定義・エントリポイント
│   └── extractor.py     # 差分抽出コアロジック
├── pyproject.toml
├── poetry.lock
└── .venv/               # 仮想環境（git管理外）

frontend/
├── src/                 # Reactソース
├── dist/                # Viteビルド成果物（FastAPIが静的配信）
└── package.json

output/                  # 生成されたレポートJSON
```

## 起動方法

```bash
# バックエンド
cd backend
poetry install
poetry run python src/main.py
# → http://localhost:8080

# フロントエンド（初回・変更時）
cd frontend
npm install
npm run build
```
