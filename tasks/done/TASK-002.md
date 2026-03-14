---
id: TASK-002
title: backend/src/ のファイル分割
type: impl
status: done
refs:
  - docs/requirements/REQ-002_api/spec.md
  - docs/requirements/REQ-002_api/behaviors/B-007.md
  - docs/requirements/REQ-002_api/behaviors/B-008.md
  - docs/requirements/REQ-002_api/behaviors/B-009.md
files:
  - backend/src/main.py
  - backend/src/app.py
  - backend/src/api/compare.py
  - backend/src/api/reports.py
---

# TASK-002 backend/src/ のファイル分割

## やること

現在の `main.py` を以下の構成に分割する。

```
backend/src/
├── main.py        # uvicorn起動のみ
├── app.py         # FastAPI app定義・ルーター登録・静的配信
├── api/
│   ├── compare.py # POST /api/compare
│   └── reports.py # GET /api/reports, GET /api/reports/{id}
└── extractor.py   # 変更なし
```

## やらないこと

- extractor.py の変更
- 新しいエンドポイントの追加
- フロントエンドの変更

## 完了条件

- [ ] `python backend/src/main.py` で起動できる
- [ ] POST /api/compare が動作する
- [ ] GET /api/reports が動作する
- [ ] GET /api/reports/{id} が動作する
