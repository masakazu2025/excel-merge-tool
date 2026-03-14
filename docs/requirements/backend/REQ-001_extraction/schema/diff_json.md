---
id: REQ-001-schema-diff_json
status: approved
req: REQ-001
---

# スキーマ: diff.json

差分抽出の出力形式。

## 全体構造

```json
{
  "meta": {
    "created_at": "2026-03-14T15:30:42",
    "base_file": "base.xlsx",
    "file_b": "file_b.xlsx",
    "file_c": "file_c.xlsx",
    "total_diffs": 42,
    "total_conflicts": 3
  },
  "sheets": {
    "Sheet1": {
      "cells": [...],
      "comments": [...],
      "shapes": {...}
    }
  }
}
```

## cells（セル差分）

```json
{
  "id": "Sheet1__B4",
  "cell": "B4",
  "base_value": "旧値",
  "b_value": "新値B",
  "c_value": null,
  "type": "value",
  "conflict": false,
  "review_required": true,
  "diff_hint": "replace"
}
```

| フィールド | 型 | 内容 |
|-----------|-----|------|
| id | string | `{シート名}__{セル位置}` |
| cell | string | セル位置（例: `B4`） |
| base_value | string\|null | ベースの値 |
| b_value | string\|null | Bの値（変更なしは null） |
| c_value | string\|null | Cの値（変更なしは null） |
| type | string | `value` \| `formula` \| `rich_text` \| `date` |
| conflict | boolean | B≠C の場合 true |
| review_required | boolean | 人間が確認すべき場合 true |
| diff_hint | string | `new` \| `insert_only` \| `delete_only` \| `replace` \| `newer_date` |

## shapes（図形差分）

```json
{
  "matched": [
    {
      "id": "1",
      "kind": "sp",
      "name": "テキスト ボックス 1",
      "base_text": "旧テキスト",
      "b_text": "新テキストB",
      "c_text": null,
      "conflict": false
    }
  ],
  "added_b": [{"id": "5", "kind": "pic", "name": "画像 2"}],
  "added_c": [...],
  "deleted_b": [{"id": "3", "kind": "graphicFrame", "name": "グラフ 1"}],
  "deleted_c": [...]
}
```

| kind | 内容 |
|------|------|
| `sp` | テキストボックス等（テキスト比較対象） |
| `pic` | 貼り付け画像（増減のみ） |
| `graphicFrame` | グラフ（増減のみ） |
