# CLAUDE.md - Backend

## 技術スタック

- Python 3.12+
- FastAPI + uvicorn
- Excel 解析: zipfile + xml.etree.ElementTree（openpyxl 禁止）
- テスト: pytest + httpx

## ディレクトリ構成

```
backend/
├── src/
│   ├── app.py          # FastAPI アプリ・ルーター登録
│   ├── main.py         # エントリポイント（uvicorn 起動）
│   ├── extractor.py    # Excel 差分抽出ロジック
│   ├── logger.py       # ロガー設定
│   └── api/
│       ├── compare.py  # POST /api/compare
│       └── reports.py  # GET /api/reports, GET /api/reports/{id}
├── config/
│   └── logging.yaml    # ログレベル・ローテーション設定
├── tests/
│   ├── conftest.py     # テスト共通ヘルパー（make_xlsx 等）
│   └── test_*.py       # 振舞ごとのテストファイル
└── pyproject.toml
```

## コーディング規約

### ロガー
- 各モジュールで `from logger import get_logger; logger = get_logger(__name__)` を使用
- エラーは `logger.exception()` でスタックトレースを記録
- `print()` は使用禁止
- uvicorn のアクセスログは意図的に無効（`log_config=None`）
  - 理由: デスクトップツールのため処理量が少なく、アクセスログの価値が低い
  - 有効化する場合は main.py のコメントを参照すること

### エラーハンドリング
- 業務エラーは `AppError(error_code, message)` を raise する
- エラーコードは `docs/requirements/backend/REQ-006_error_handling/errors.md` を参照
- API 層で `AppError` を catch して `HTTPException(422)` に変換する

### Excel 解析
- openpyxl は使用禁止（zipfile + ElementTree のみ）
- テスト用 xlsx 生成は `conftest.py` の `make_xlsx()` ヘルパーを使用

### テスト
- 振舞ファイル（B-XXX.md）1つにつきテストファイル1つ
- 未実装の振舞は Red テストを書いてから実装する（TDD）
- API テストは `TestClient` + `monkeypatch` で OUTPUT_DIR を tmp_path に差し替える
