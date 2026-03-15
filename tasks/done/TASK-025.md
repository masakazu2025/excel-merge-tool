---
id: TASK-025
title: ビルド出力先の整理
type: impl
status: done
refs: []
files:
  - build.bat
  - backend/excel_merge_tool.spec
---

## やること

- ビルド後に dist/vN.NN_yyyymmddhhmmss/ に成果物を集める
- フロントエンドのビルド成果物をバックエンド下（backend/frontend_dist/）に配置してからビルド
- 移動後に PyInstaller の中間ファイル（build/ / dist/excel-merge-tool/）を削除する
- build.bat にコピー・クリーンアップ処理を追加

## やらないこと

- ビルドロジック本体の変更

## 完了条件

- [ ] ビルド後に dist/v0.1_yyyymmddhhmmss/ フォルダが生成される
- [ ] 移動後に build/ と dist/excel-merge-tool/ が削除されている
- [ ] そのフォルダを配布物として使える状態になっている
