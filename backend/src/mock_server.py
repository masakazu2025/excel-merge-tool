"""モック用FastAPIサーバー - フロントエンド開発用

起動:
    python src/mock_server.py

その後、別ターミナルで:
    cd frontend && npm run dev
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Excel Merge Tool - Mock Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# モックデータ
# ---------------------------------------------------------------------------

def _make_reports() -> list:
    base = [
        {
            "report_id": "20260314_153042",
            "created_at": "2026-03-14T15:30:42",
            "base_file": "base.xlsx",
            "file_b": "file_b.xlsx",
            "file_c": "file_c.xlsx",
            "total_diffs": 17,
            "total_conflicts": 3,
        },
        {
            "report_id": "20260310_091200",
            "created_at": "2026-03-10T09:12:00",
            "base_file": "base_v2.xlsx",
            "file_b": "tanaka.xlsx",
            "file_c": "suzuki.xlsx",
            "total_diffs": 5,
            "total_conflicts": 0,
        },
    ]
    # ページネーション確認用に25件に水増し
    extra = [
        {
            "report_id": f"2026030{i}_120000",
            "created_at": f"2026-03-0{i}T12:00:00",
            "base_file": f"base_{i}.xlsx",
            "file_b": f"compare_{i}.xlsx",
            "file_c": None,
            "total_diffs": i * 3,
            "total_conflicts": 0,
        }
        for i in range(1, 24)
    ]
    return base + extra

MOCK_REPORTS = _make_reports()

MOCK_DIFF: dict = {
    "meta": MOCK_REPORTS[0],
    "sheets": {
        "Sheet1": {
            "cells": [
                {
                    "id": "Sheet1__B4",
                    "cell": "B4",
                    "base_value": "100",
                    "b_value": "150",
                    "c_value": None,
                    "type": "value",
                    "conflict": False,
                    "review_required": False,
                    "diff_hint": "replace",
                },
                {
                    "id": "Sheet1__D7",
                    "cell": "D7",
                    "base_value": "東京支店",
                    "b_value": "東京本社",
                    "c_value": "東京オフィス",
                    "type": "value",
                    "conflict": True,
                    "review_required": True,
                    "diff_hint": "replace",
                },
                {
                    "id": "Sheet1__E12",
                    "cell": "E12",
                    "base_value": "=SUM(E1:E11)",
                    "b_value": "=SUM(E1:E12)",
                    "c_value": None,
                    "type": "formula",
                    "conflict": False,
                    "review_required": True,
                    "diff_hint": "replace",
                },
                {
                    "id": "Sheet1__A3",
                    "cell": "A3",
                    "base_value": "",
                    "b_value": None,
                    "c_value": "新規追加テキスト",
                    "type": "value",
                    "conflict": False,
                    "review_required": False,
                    "diff_hint": "new",
                },
                {
                    "id": "Sheet1__F5",
                    "cell": "F5",
                    "base_value": "2024/01/15",
                    "b_value": "2024/03/20",
                    "c_value": None,
                    "type": "date",
                    "conflict": False,
                    "review_required": False,
                    "diff_hint": "newer_date",
                },
            ],
            "comments": [
                {
                    "id": "Sheet1__comment__C3",
                    "cell": "C3",
                    "base_value": "旧コメント内容",
                    "b_value": "更新されたコメント",
                    "c_value": None,
                    "type": "comment",
                    "conflict": False,
                    "review_required": False,
                    "diff_hint": "replace",
                }
            ],
            "shapes": {
                "matched": [
                    {
                        "id": "1",
                        "kind": "sp",
                        "name": "テキスト ボックス 1",
                        "base_text": "旧テキスト内容",
                        "b_text": "新テキスト内容",
                        "c_text": None,
                        "conflict": False,
                    }
                ],
                "added_b": [{"id": "5", "kind": "pic", "name": "画像 2"}],
                "added_c": [],
                "deleted_b": [],
                "deleted_c": [{"id": "3", "kind": "graphicFrame", "name": "グラフ 1"}],
            },
        },
        "Sheet2": {
            "cells": [
                {
                    "id": "Sheet2__C5",
                    "cell": "C5",
                    "base_value": "承認待ち",
                    "b_value": "承認済み",
                    "c_value": "却下",
                    "type": "value",
                    "conflict": True,
                    "review_required": True,
                    "diff_hint": "replace",
                },
                {
                    "id": "Sheet2__B2",
                    "cell": "B2",
                    "base_value": "山田太郎",
                    "b_value": "山田 太郎",
                    "c_value": None,
                    "type": "value",
                    "conflict": False,
                    "review_required": False,
                    "diff_hint": "replace",
                },
                {
                    "id": "Sheet2__D8",
                    "cell": "D8",
                    "base_value": "旧備考",
                    "b_value": None,
                    "c_value": "新備考テキスト（長文）",
                    "type": "rich_text",
                    "conflict": False,
                    "review_required": True,
                    "diff_hint": "replace",
                },
                {
                    "id": "Sheet2__A10",
                    "cell": "A10",
                    "base_value": "削除予定",
                    "b_value": "",
                    "c_value": None,
                    "type": "value",
                    "conflict": False,
                    "review_required": False,
                    "diff_hint": "delete_only",
                },
                {
                    "id": "Sheet2__G3",
                    "cell": "G3",
                    "base_value": "",
                    "b_value": "追記内容A",
                    "c_value": None,
                    "type": "value",
                    "conflict": False,
                    "review_required": False,
                    "diff_hint": "insert_only",
                },
                {
                    "id": "Sheet2__J5",
                    "cell": "J5",
                    "base_value": "既存値",
                    "b_value": "変更B",
                    "c_value": "変更C",
                    "type": "value",
                    "conflict": True,
                    "review_required": True,
                    "diff_hint": "replace",
                },
            ],
            "comments": [],
            "shapes": {
                "matched": [],
                "added_b": [],
                "added_c": [],
                "deleted_b": [],
                "deleted_c": [],
            },
        },
        "Sheet3（差分なし）": {
            "cells": [],
            "comments": [],
            "shapes": {
                "matched": [],
                "added_b": [{"id": "10", "kind": "sp", "name": "説明ボックス"}],
                "added_c": [],
                "deleted_b": [],
                "deleted_c": [],
            },
        },
    },
}


# ---------------------------------------------------------------------------
# エンドポイント
# ---------------------------------------------------------------------------

@app.get("/api/reports")
def list_reports(page: int = 1, limit: int = 20):
    start = (page - 1) * limit
    items = MOCK_REPORTS[start: start + limit]
    return {"items": items, "total": len(MOCK_REPORTS), "page": page, "limit": limit}


@app.get("/api/reports/{report_id}")
def get_report(report_id: str):
    return MOCK_DIFF


@app.post("/api/compare")
async def compare():
    """アップロードを受け取り、モックレポートIDを返す"""
    import asyncio
    await asyncio.sleep(1.5)  # 処理時間をシミュレート
    return MOCK_REPORTS[0]


# ---------------------------------------------------------------------------
# 起動
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("Mock server: http://localhost:8080")
    print("フロントエンド: cd frontend && npm run dev")
    uvicorn.run("mock_server:app", host="127.0.0.1", port=8080, reload=True)
