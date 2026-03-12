# Step 1: Pythonコアロジック（解凍・パース・差分抽出）

## 概要

3つのExcelファイルをZIP解凍してXMLを直接比較し、差分を辞書形式で抽出する。
`openpyxl` 等のライブラリは使わず、XMLを直接扱うことで高速処理を実現する。

---

## 入力

| 項目 | 内容 |
|------|------|
| マージ元ファイル | `base.xlsx` （変更を受け入れる側） |
| ファイルB | `file_b.xlsx` （変更者1の編集済みファイル） |
| ファイルC | `file_c.xlsx` （変更者2の編集済みファイル） |

## 出力

差分データを格納した辞書（Python dict）。Step 2に渡してJSONに変換する。

```python
{
  "sheets": {
    "Sheet1": {
      "cells": [
        {
          "id": "Sheet1__B4",
          "cell": "B4",
          "base_value": "旧値",
          "b_value": "新値B",         # Bが変更していなければ null
          "c_value": null,             # Cが変更していなければ null
          "type": "value",             # "value" | "formula" | "rich_text" | "date"
          "conflict": false,           # BとCが同じセルを異なる値に変更した場合 true
          "review_required": true,     # 人間が確認すべき場合 true
          "diff_hint": "replace"       # "new"(baseが空) | "insert_only" | "delete_only" | "replace" | "newer_date"
        }
      ],
      "comments": [...],
      "shapes": [...]
    }
  }
}
```

---

## 処理フロー

### 1. ZIP解凍（メモリ上）

```
zipfile.ZipFile でメモリ上に展開（ディスク書き出しなし）
```

- `xl/sharedStrings.xml`
- `xl/worksheets/sheet*.xml`
- `xl/drawings/drawing*.xml`
- `xl/drawings/vmlDrawing*.xml`

### 2. sharedStrings の展開

- `sharedStrings.xml` をパースし、インデックス → 文字列のリストを生成する
- 各 `sheet*.xml` 内のセル値を置換する
- インライン文字列（`<is>` タグ）も別途処理する（sharedStrings非使用の場合がある）

### 3. シートの対応付け

- `xl/workbook.xml` からシート名とリレーションIDを取得し、シート名でマッピングする
- マージ元に存在するシートを基準として比較する（B・Cにのみ存在するシートは対象外）

### 4. セル比較

各シートの `sheet*.xml` をパースし、以下を抽出・比較する。

| 属性 | XMLタグ | 備考 |
|------|---------|------|
| セル位置 | `<c r="B4">` の `r` 属性 | |
| セル値 | `<v>` タグ | sharedStrings展開後の値 |
| 数式 | `<f>` タグ | 存在する場合のみ |
| セル型 | `<c t="...">` の `t` 属性 | `s`=shared string, `str`=formula string, etc. |

比較ルール:
- `base` と `B` が異なる → Bの変更として記録
- `base` と `C` が異なる → Cの変更として記録
- `B` と `C` の両方が `base` と異なり、かつ `B ≠ C` → `conflict: true`

### 5. コメント比較

- `xl/comments*.xml` をパースし、セル位置 → コメントテキストのマッピングを生成
- 同様にbase vs B, base vs Cで比較

### 6. 図形比較

- `xl/drawings/drawing*.xml`（標準図形）をパース
- `xl/drawings/vmlDrawing*.xml`（旧形式・ActiveX等）をパース
- `<sp>` / `<pic>` / `<graphicFrame>` をそれぞれ収集し、IDと種別（`kind`）を記録する
- **図形IDで対応付け**（各タグの `<cNvPr id="...">` の `id` 属性）
- IDが一致した `<sp>` → テキスト変更を検出する
- IDが一致した `<pic>` / `<graphicFrame>` → 増減なし（変更なし扱い）
- IDが一致しない要素 → `added` / `deleted` として記録し、人間が確認する

#### 図形比較の出力形式

比較対象のXMLタグと取得する情報:

| 種別 | XMLタグ | テキスト比較 | 増減検知 |
|------|---------|------------|---------|
| テキストボックス等 | `<sp>` | ✓ | ✓ |
| 貼り付け画像 | `<pic>` | — | ✓ |
| グラフ | `<graphicFrame>` | — | ✓ |

```python
"shapes": {
  "matched": [          # IDが一致したテキストボックス等 → テキスト差分検出対象
    {
      "id": "1",
      "kind": "sp",                  # "sp" | "pic" | "graphicFrame"
      "name": "テキスト ボックス 1",
      "base_text": "旧テキスト",
      "b_text": "新テキストB",       # 変更なければ null。pic/graphicFrameは常に null
      "c_text": null,
      "conflict": false
    }
  ],
  "added_b": [          # BにのみあってBaseにないID → 追加（sp/pic/graphicFrame 全て）
    {"id": "5", "kind": "pic", "name": "画像 2"}
  ],
  "added_c": [...],     # CにのみあってBaseにないID → 追加
  "deleted_b": [        # BaseにあってBにないID → 削除
    {"id": "3", "kind": "graphicFrame", "name": "グラフ 1"}
  ],
  "deleted_c": [...]    # BaseにあってCにないID → 削除
}
```

---

## カスタムルール設定

### 設定ファイルの場所

```
excel-merge-tool/
├── config/
│   └── merge_rules.yaml   ← ここ
├── src/
└── ...
```

### merge_rules.yaml の形式

```yaml
# グローバルデフォルト設定
defaults:
  date_newer_auto_merge: true   # 日付が新しい場合の自動マージ（全体デフォルト）

  # 除外文字列（グローバル）: 全シート・全列に適用
  # これと完全一致するセル値は null とみなして比較する
  excluded_values:
    - "（ここに入力してください）"
    - "未記入"
    - "TBD"

rules:
  # 優先度: cell（特定セル） > column（列） > sheet（シート全体）
  # 同じ粒度のルールが複数ある場合は上に書いたものが優先
  #
  # excluded_values は グローバル値 + ルール指定値 の和集合として適用される

  - sheet: "案件管理"
    column: "C"
    rule: "date_newer"
    excluded_values:            # このシート・列にのみ追加される除外文字列
      - "日付未定"

  - sheet: "進捗管理"
    column: "E"
    rule: "status_transition"
    transitions:
      - from: "未着手"
        to: ["進行中", "完了"]
      - from: "進行中"
        to: ["完了"]
    excluded_values:
      - "（ステータスを選択）"

  - sheet: "進捗管理"
    cell: "D5"
    rule: "date_newer"
```

### ルール種別一覧

| rule | 内容 | 必須パラメータ |
|------|------|--------------|
| `date_newer` | 新しい日付への変更をマージ可とする | なし |
| `status_transition` | 定義した遷移方向のみマージ可とする | `transitions` |

### 優先度解決ロジック

```
1. 対象セルに一致する cell 指定ルールを探す
2. なければ、対象列に一致する column 指定ルールを探す
3. なければ、対象シートに一致するシート全体ルールを探す（列指定なし）
4. なければ、defaults のグローバル設定を使う
5. それもなければ、デフォルトの判定ロジック（判定テーブル）を使う
```

### 将来的な拡張ルール候補（未実装）

| rule | 内容 |
|------|------|
| `always_merge` | 常にマージ可（無条件） |
| `always_review` | 常に要確認（無条件） |
| `numeric_increase` | 数値が増加する変更をマージ可 |
| `regex_match` | 新しい値が正規表現にマッチすればマージ可 |

---

## 自動マージ判定ロジック

差分ごとに `review_required` と `diff_hint` を付与する。
Step 3のUIで `review_required: false` の行はデフォルトチェック済みにし、人間は `true` の行だけ読む。

### 除外文字列の前処理

比較前に、セル値が `excluded_values` に完全一致する場合は `null` に置換してから判定する。

適用される除外文字列は **グローバル値 + マッチしたルールの値の和集合**。

```python
def resolve_excluded_values(sheet: str, col: str, cell: str, config: dict) -> set[str]:
    excluded = set(config["defaults"].get("excluded_values", []))
    # マッチしたルール（cell > column > sheet の順）の excluded_values を追加
    for rule in config["rules"]:
        if rule.get("sheet") == sheet:
            if rule.get("cell") == cell or rule.get("column") == col or (
                "cell" not in rule and "column" not in rule
            ):
                excluded |= set(rule.get("excluded_values", []))
    return excluded

def normalize_value(value: str, excluded: set[str]) -> str | None:
    return None if value in excluded else value
```

これにより、テンプレート文字列が入ったセルへの新規入力が `diff_hint: "new"` として扱われる。

### 判定テーブル

| type | 条件 | review_required | diff_hint |
|------|------|----------------|-----------|
| 全種別 | conflict: true（B≠C） | `true` | （各種別の値） |
| value / rich_text | baseが空 → B or Cに値あり | `false` | `"new"` |
| value / rich_text | テキストdiffが追加のみ（insert） | `false` | `"insert_only"` |
| value / rich_text | テキストdiffが削除のみ（delete） | `true` | `"delete_only"` |
| value / rich_text | テキストdiffに削除＋追加が混在（replace） | `true` | `"replace"` |
| date | baseが空 → B or Cに日付あり | `false` | `"new"` |
| date | B or Cの日付 > base（より新しい）かつ競合なし | `false`（※） | `"newer_date"` |
| date | B or Cの日付 ≤ base（古くなる） | `true` | `"replace"` |
| date | conflict: true（B≠C） | `true` | `"newer_date"` |
| formula | baseが空 → B or Cに数式あり | `false` | `"new"` |
| formula | baseに数式あり → 変更 | `true` | `"replace"` |
| comment | baseなし → B or Cにあり | `false` | `"new"` |
| comment | テキストdiffが追加のみ | `false` | `"insert_only"` |
| comment | テキストdiffに削除を含む | `true` | `"delete_only"` or `"replace"` |
| shape_text | value / rich_text と同様 | 同上 | 同上 |

※ `date` の `newer_date` 自動マージ可判定は**オプション設定（デフォルト: 有効）**とする。

### テキストdiff判定（Python実装）

```python
import difflib

def get_diff_hint(base: str, new: str) -> str:
    if not base:
        return "new"
    ops = {op for op, *_ in difflib.SequenceMatcher(None, base, new).get_opcodes()}
    ops.discard("equal")
    if ops == {"insert"}:
        return "insert_only"
    if ops == {"delete"}:
        return "delete_only"
    return "replace"
```

### 日付判定（Python実装）

ExcelのXML内で日付はシリアル値（数値）として保存されているため、数値比較で判定できる。

```python
def is_newer_date(base_serial: float, new_serial: float) -> bool:
    return new_serial > base_serial
```

---

## 決定事項

| 項目 | 決定内容 |
|------|----------|
| 数式の比較方針 | **案A: 数式文字列 `<f>` で比較**。計算済み値 `<v>` は比較しない。 |
| 図形の対応付け | **案A: 図形IDで対応付け**。IDが一致しない図形は「未対応付け図形」として出力し人間が判断する。 |
| リッチテキスト変更の検出 | sharedStringsの `<si>` XML全体を比較し、書式だけの変化も検出する。VBAは**セルまるごとコピー**（値＋書式）でマージする。 |
| 自動マージ判定 | 差分に `review_required` と `diff_hint` を付与する。テキスト系はdifflibで追加のみ判定、日付は新しい方を自動マージ可、競合は常に要確認。 |
| 日付の自動マージ | 日付が新しくなる変更（かつ競合なし）は `review_required: false` とする。オプション設定でOFF可能。競合（B≠C）は要確認。 |
| カスタムルール設定 | `config/merge_rules.yaml` にシート・列・セル単位でルールを定義できる。粒度が細い指定が優先（cell > column > sheet > global）。拡張可能な設計とする。 |
| 除外文字列 | グローバル（`defaults.excluded_values`）とルール単位（シート・列・セル指定）の両方で定義可能。適用値は和集合。完全一致するセル値を比較前に `null` とみなす。 |

---

## 制限事項（仕様上の割り切り）

本ツールが意図的に検出・対応しない範囲。ユーザーへの明示が必要。

| # | 制限内容 | 理由・補足 |
|---|----------|-----------|
| 1 | 数式の計算結果の変化は検出しない | 数式文字列が同じなら参照先の値変動は無視する（案A決定） |
| 2 | 図形の追加・削除・コピーはツールが自動マージしない | IDが変わるため対応付け不可。「未対応付け図形」として一覧表示し人間が処理する |
| 3 | セル全体の書式変更（背景色・罫線・フォントサイズ等）は検出しない | セル内リッチテキストの部分書式（一部の文字色・太字等）は検出対象。セルレベルの書式は対象外 |
| 4 | B・Cにのみ存在するシートは比較対象外 | マージ元に存在するシートを基準とする |
| 5 | B・Cでシート名がリネームされた場合は「新規シートの追加」とみなし比較しない | シート名が一致するもののみ比較する |
| 6 | 結合セルの結合範囲の変化（マージ・解除・拡張）は検出しない | 値の比較のみ行う。VBAでの値コピー時はbase側のマージ構造が維持されるため実害なし。「値を変えずにセル結合だけした」変更は検出不可 |
| 7 | 隠しシート・ロックされたセルは比較対象外とする | 意図せず非表示の情報がマージされるリスクを避ける |
| 8 | パスワード保護されたファイルは非対応 | ZIPとして展開できないため処理不可。エラーとして終了する |
| 9 | リッチテキストのマージ時はセルまるごとコピー（値＋書式）となる | 書式だけ変えたい・値だけ変えたいという細かい制御はできない |
| 10 | 貼り付け画像・グラフの**中身**の変更は検出しない | 増減（追加・削除）のみ検出する。画像の差し替えは「削除+追加」として表れる |
