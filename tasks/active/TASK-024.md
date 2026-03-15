---
id: TASK-024
title: specファイルをワンディレクトリ化・コンソール表示
type: impl
status: ready
refs: []
files:
  - backend/excel_merge_tool.spec
---

## やること

- PyInstaller の出力形式を onefile → onedir に変更
- console=False → console=True に変更（終了しやすくする）
- ビルド前に build/ dist/ の不要ファイルを削除する処理を build.bat に追加

## やらないこと

- spec 以外のファイルの変更

## 完了条件

- [ ] ビルド後 dist/excel-merge-tool/ ディレクトリが生成される
- [ ] コンソールウィンドウが表示される
- [ ] build.bat 実行前に build/ dist/ がクリーンアップされる
