---
id: REQ-001-schema-merge_rules
status: approved
req: REQ-001
---

# スキーマ: merge_rules.yaml

カスタムルール設定ファイルの形式。配置場所: `config/merge_rules.yaml`

## フォーマット

```yaml
defaults:
  date_newer_auto_merge: true   # 日付が新しい場合の自動マージ（デフォルト: 有効）
  excluded_values:              # 全シート・全列に適用する除外文字列
    - "（ここに入力してください）"
    - "未記入"

rules:
  - sheet: "案件管理"
    column: "C"
    rule: "date_newer"
    excluded_values:
      - "日付未定"

  - sheet: "進捗管理"
    column: "E"
    rule: "status_transition"
    transitions:
      - from: "未着手"
        to: ["進行中", "完了"]
      - from: "進行中"
        to: ["完了"]

  - sheet: "進捗管理"
    cell: "D5"
    rule: "date_newer"
```

## ルール種別

| rule | 内容 | 必須パラメータ |
|------|------|--------------|
| `date_newer` | 新しい日付への変更をマージ可とする | なし |
| `status_transition` | 定義した遷移方向のみマージ可とする | `transitions` |

## 適用優先度

```
cell（特定セル） > column（列） > sheet（シート全体） > defaults（グローバル）
```

## 除外文字列の適用

- `defaults.excluded_values`（グローバル）とマッチしたルールの `excluded_values` の**和集合**が適用される
- 除外文字列と完全一致するセル値は比較前に `null` とみなす
