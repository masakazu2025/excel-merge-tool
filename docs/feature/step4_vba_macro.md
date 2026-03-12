# Step 4: VBAマクロ（安全なマージ処理）

## 概要

Step 3が出力した `merge_commands.csv` を読み込み、
マージ元ファイルの指定されたセル・図形に値をコピー（上書き）する。

---

## 入力

| 項目 | 内容 |
|------|------|
| `merge_commands.csv` | マージ指示書（Step 3のUIで生成） |
| `base.xlsx` | マージ元ファイル（VBAマクロを含むファイル） |
| `file_b.xlsx` | ファイルB（参照元。VBAが開いてコピーする） |
| `file_c.xlsx` | ファイルC（参照元。VBAが開いてコピーする） |

## 出力

マージ元ファイルが上書き更新される（in-place）

---

## 処理フロー

### 0. 事前バックアップ（必須）

マージ実行前に、マージ元ファイルを自動でバックアップコピーする。

```
base_backup_YYYYMMDD_HHMMSS.xlsx
```

Ctrl+Zでの取り消しはVBAの変更に対して機能しないため、バックアップは省略不可。

### 1. CSVファイルの読み込み

- ダイアログでCSVのパスを選択させる（ファイルパスのハードコーディングをしない）
- 1行目をヘッダーとして読み飛ばす
- 各行をカンマ区切りでパース（ダブルクォートエスケープを正しく処理する）

### 2. ソースファイルを開く

- CSVの `source` カラムに応じて `file_b.xlsx` または `file_c.xlsx` を開く
- ファイルパスはVBA実行時にダイアログで選択させる（初回のみ設定）
- 既に開いているファイルは再度開かない

### 3. 各行のマージ処理

```
For 各行 in CSV:
  Select Case type
    Case "value"      → ソースのセルから値のみをコピー（PasteSpecial xlPasteValues）
    Case "formula"    → ソースのセルから数式をコピー（PasteSpecial xlPasteFormulas）
    Case "rich_text"  → ソースのセルをまるごとコピー（値＋書式。通常のPaste）
    Case "comment"    → ソースのコメントをコピー
    Case "shape_text" → ソースの図形テキストを取得してマージ元の図形に設定
  End Select
Next
```

### 4. 完了通知

- 成功件数・失敗件数をメッセージボックスで表示
- 失敗した行（存在しないシート・セルなど）をログシートまたはテキストファイルに出力

---

## マージ処理の型別仕様

### value（値のみ）

```vb
destCell.Value = srcCell.Value
```

書式・数式は変更しない。値のみ上書き。

### rich_text（リッチテキスト・セルまるごとコピー）

```vb
srcCell.Copy
destCell.PasteSpecial xlPasteAllUsingSourceTheme
' または通常のPaste（書式＋値を両方上書き）
```

セル内の部分書式（一部の文字色・太字等）が変更されたセルに使用する。
値と書式を両方上書きするため、base側のセル書式（背景色・罫線等）も上書きされる点に注意。

### formula（数式）

```vb
destCell.Formula = srcCell.Formula
' または日本語環境では
destCell.FormulaLocal = srcCell.FormulaLocal
```

相対参照の数式をコピーすると参照がずれる可能性があるため、絶対参照かどうかを確認する。

### comment（コメント）

```vb
' 既存コメントを削除して新規作成
destCell.Comment.Delete  ' なければエラーになるためOn Error Resume Next
destCell.AddComment srcCell.Comment.Text
```

### shape_text（図形テキスト）

```vb
' 図形名またはIDで検索
Dim shp As Shape
Set shp = destSheet.Shapes(shapeName)
shp.TextFrame.Characters.Text = newText
```

---

## merge_commands.csv 形式

```csv
sheet,cell,source,value,type
Sheet1,B4,B,新しい値,value
Sheet1,D7,B,競合を解決した値,value
Sheet2,C10,C,=SUM(A1:A10),formula
Sheet3,,C,図形テキスト内容,shape_text
```

→ Step 3と共通仕様。最終確定は両ステップ合わせて行う。

---

## 懸念・未解決事項

### 【最高】バックアップを取らずに実行した場合の取り返しのつかない変更

VBAの変更はCtrl+Zで取り消せない。
バックアップ処理を必須とし、ユーザーが無効化できない設計にする。

### 【高】図形の対応付け

「マージ元の図形」と「ソースファイルの図形」を何で対応付けるか。
Step 1と同じ問題が発生する。
- 図形名（`Shape.Name`）が一致するものを対応付けとするのが最もシンプル
- ただし図形名はデフォルトで「テキスト ボックス 1」等になるため、名前が被る可能性がある

### 【高】ファイルパスの扱い

VBAで外部ファイルを開く場合、ファイルパスをどう渡すか:
- ダイアログで毎回選択 → 安全だが手間がかかる
- CSVにパスを含める → パスに日本語・スペースが含まれると問題になることがある
- マクロの先頭に定数として書く → 柔軟性が低い

推奨: ダイアログで選択。CSVにはパスを含めない。

### 【高】数式の相対参照ズレ

別ファイルの数式をコピーすると、相対参照がずれる。
`PasteSpecial` の代わりに `Formula` プロパティを直接使うことで回避できるが、
ファイルをまたぐ参照（`=[file_b.xlsx]Sheet1!A1` 等）が残る場合がある。

### 【中】Excel for Mac との互換性

`FileDialog`、`FileSystemObject` 等のWindows固有オブジェクトはMac Excelで動作しない。
Mac対応が必要な場合は別途実装が必要。

### 【中】結合セルへの書き込み

結合セルに書き込む場合、結合の先頭セル以外に書き込もうとするとエラーになる。
エラーハンドリングで処理を継続するか、事前にチェックするか決める必要がある。

### 【低】CSVのBOM（文字コード）

VBAのファイル読み込みはデフォルトでShift-JISを想定する場合がある。
Step 3がUTF-8 BOM付きでCSVを出力することで、Excelがシームレスに開けるようにする。
VBAでの読み込み時も文字コードを明示的に指定する（`ADODB.Stream` を使用）。
