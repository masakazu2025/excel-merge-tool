# Step 2: PythonからHTMLレポート生成

## 概要

Step 1で抽出した差分データをJSONに変換し、
ReactベースのUIを含む単一HTMLファイル（`report.html`）として出力する。

---

## 入力

Step 1の差分データ（Python dict）

## 出力

`report.html` — 差分データを埋め込んだ自己完結型の静的HTMLファイル

---

## HTMLの構造

```html
<!DOCTYPE html>
<html>
<head>
  <!-- ライブラリはHTMLにインライン埋め込み（オフライン対応） -->
  <script>/* react.production.min.js の中身 */</script>
  <script>/* react-dom.production.min.js の中身 */</script>
  <!-- Babelは不使用。React.createElement()で直接記述 -->
  <style>/* bootstrap.min.css の中身 */</style>
</head>
<body>
  <div id="root"></div>

  <!-- 差分データをJSONとして分離埋め込み（JSONインジェクション対策） -->
  <script type="application/json" id="diff-data">
    { ...JSONデータ... }
  </script>

  <script>
    // JSONを取得してReactに渡す
    const diffData = JSON.parse(document.getElementById('diff-data').textContent);
    // Step 3のReactコンポーネントをここに記述（React.createElement()で実装。JSX/Babel不使用）
  </script>
</body>
</html>
```

---

## 処理フロー

### 1. 差分データのJSON変換

```python
import json
diff_json = json.dumps(diff_data, ensure_ascii=False, indent=None)
```

- `ensure_ascii=False`: 日本語文字列をそのまま埋め込む
- `indent=None`: ファイルサイズ削減のため最小化

### 2. HTMLテンプレートへの埋め込み

Pythonの文字列テンプレート（f-string または `string.Template`）でJSONを挿入する。

```python
html = HTML_TEMPLATE.replace("__DIFF_DATA__", diff_json)
```

### 3. ファイル出力

```python
with open("report.html", "w", encoding="utf-8") as f:
    f.write(html)
```

---

## インライン埋め込みライブラリ

オフライン環境対応のため、CDNを使わずライブラリをHTMLに直接埋め込む。
Pythonスクリプトのビルド時に各ライブラリのminified版を取得してHTMLに結合する。

| ライブラリ | 用途 | サイズ（minified） |
|-----------|------|-----------------|
| React 18 production | UIフレームワーク | 約45KB |
| ReactDOM 18 production | DOMレンダリング | 約130KB |
| Bootstrap 5 CSS | スタイリング | 約230KB |

合計: 約405KB（gzip圧縮なし）。report.html のベースサイズとして許容範囲。
Bootstrap の JS（bootstrap.bundle.min.js）は不要。ReactがUI制御を担うためCSS のみ使用する。
Babel standalone（約900KB）は**不使用**。JSXを使わず `React.createElement()` で直接記述する。

---

## 決定事項

| 項目 | 決定内容 |
|------|----------|
| CSSフレームワーク | Bootstrap 5（社内承認済み）。JSは不使用、CSSクラスのみ使用。TailwindはNG。 |
| JSX/Babel | 不使用。`React.createElement()` で直接記述。Babel の提供元・ライセンスが社内確認未了のため、および900KB削減のため排除。 |
| オフライン対応 | ライブラリをHTMLにインライン埋め込み。CDN不使用。 |
| 差分件数の上限 | 1000件超でブラウザ起動時に警告を表示する。上限は設けない（全件表示する）。 |
| JSONインジェクション対策 | `<script type="application/json" id="diff-data">` タグに分離埋め込み。`</script>` を含む値があってもHTMLが壊れない。 |
| 文字コード | UTF-8で出力。xlsx内部もUTF-8のため問題なし。 |
