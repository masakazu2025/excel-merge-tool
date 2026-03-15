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
  "c_value": "旧値",
  "type": "value",
  "changed_by": "b",
  "status": "update"
}
```

| フィールド | 型 | 内容 |
|-----------|-----|------|
| id | string | `{シート名}__{セル位置}` |
| cell | string | セル位置（例: `B4`） |
| base_value | string\|null | ベースの値（常に実値を保持） |
| b_value | string\|null | Bの値（常に実値を保持） |
| c_value | string\|null | Cの値（2ファイル比較時は null） |
| type | string | `value` \| `formula` \| `rich_text` \| `date` |
| changed_by | string\|null | 変更者（下表参照） |
| status | string | 変更種別（下表参照） |

### changed_by

| 値 | 意味 |
|----|------|
| `"b"` | B のみ変更 |
| `"c"` | C のみ変更 |
| `"both"` | B と C 両方変更 |
| `null` | 変更なし |

### status

| 値 | 意味 |
|--------|------|
| `"new"` | null → 値（新規入力） |
| `"delete"` | 値 → null（削除） |
| `"add"` | 元の値の末尾にテキストが追記 |
| `"sub"` | 元の値の末尾からテキストが削除 |
| `"update"` | 上記以外の変更（途中編集・全置換など） |
| `"conflict"` | `changed_by: "both"` かつ B ≠ C |
| `"no_change"` | 変更なし |

### changed_by × status の組み合わせ例

| changed_by | status | 意味 |
|-----------|--------|------|
| `"b"` | `"new"` | B が新規入力 |
| `"b"` | `"add"` | B が末尾追記 |
| `"b"` | `"sub"` | B が末尾削除 |
| `"b"` | `"update"` | B が更新 |
| `"b"` | `"delete"` | B が削除 |
| `"both"` | `"update"` | B と C が同じ値に更新 |
| `"both"` | `"conflict"` | B と C が異なる値に更新 |
| `null` | `"no_change"` | 変更なし |

## comments（コメント差分）

セル差分（cells）と同じフィールド構成。テキスト値の代わりにコメントテキストを保持する。

```json
{
  "cell": "B4",
  "base_text": "確認済み",
  "b_text": "確認済み\n追記あり",
  "c_text": "確認済み",
  "changed_by": "b",
  "status": "add"
}
```

| フィールド | 型 | 内容 |
|-----------|-----|------|
| cell | string | セル位置（例: `B4`） |
| base_text | string\|null | ベースのコメントテキスト |
| b_text | string\|null | B のコメントテキスト |
| c_text | string\|null | C のコメントテキスト（2ファイル比較時は null） |
| changed_by | string\|null | cells と同じ定義 |
| status | string | cells と同じ定義（new/delete/add/sub/update/conflict） |

### 備考

- `id` フィールドは持たない（セル座標が識別子）
- スレッドコメントはスレッド内の全返信テキストを結合して1つのテキストとして比較する
- 変更なしのコメントは出力しない（cells と同じ挙動）
- 将来的に cells と統合し階層構造へ移行予定（TASK-021）

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
      "c_text": "旧テキスト",
      "changed_by": "b",
      "status": "update"
    }
  ],
  "added_b": [{"id": "5", "kind": "pic", "name": "画像 2", "status": "new"}],
  "added_c": [...],
  "deleted_b": [{"id": "3", "kind": "graphicFrame", "name": "グラフ 1", "status": "delete"}],
  "deleted_c": [...]
}
```

| kind | 内容 |
|------|------|
| `sp` | テキストボックス等（テキスト比較対象） |
| `pic` | 貼り付け画像（増減のみ） |
| `graphicFrame` | グラフ（増減のみ） |
