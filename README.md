# Excel 差分比較ツール

Excel ファイル（2〜3ファイル）のセル差分をブラウザで確認するためのデスクトップツール。

## 特徴

- `.xlsx` / `.xlsm` を 2〜3ファイル同時に比較
- 変更種別（新規・追記・削除・更新・競合）を色分け表示
- セルをクリックして Base / B / C の値を詳細比較
- 矢印キーでモーダルを開いたまま変更セル間を移動
- 比較履歴の保存と再閲覧

## 使い方

→ [docs/manual/getting_started.md](docs/manual/getting_started.md)

## 変更履歴

→ [CHANGELOG.md](CHANGELOG.md)

## 技術スタック

| 層 | 技術 |
|----|------|
| フロントエンド | React + TypeScript + Vite + Tailwind CSS |
| バックエンド | Python + FastAPI |
| Excel 解析 | zipfile + xml.etree.ElementTree（openpyxl 不使用） |
| 配布 | PyInstaller（単一 exe） |
