---
id: TASK-031
title: 環境構築とビルドをスクリプト分離する
type: impl
status: ready
refs:
  - https://github.com/masakazu2025/excel-merge-tool/issues/2
files:
  - scripts/setup.bat
  - scripts/build.bat
---

# TASK-031 環境構築とビルドをスクリプト分離する

## やること

`build.bat` を `scripts/setup.bat` と `scripts/build.bat` に分離する。

- `scripts/setup.bat`：frontend（npm install）+ backend（venv 作成・pip install）
- `scripts/build.bat`：ビルドのみ（npm run build → PyInstaller → リリースパッケージ収集）。venv がなければ「setup.bat を先に実行してください」と案内して終了する。

## やらないこと

- ルート直下の `build.bat` の削除（別タスクで判断する）
- スクリプト以外のファイルの変更

## 完了条件

- [ ] `scripts/setup.bat` が frontend・backend の環境構築を行う
- [ ] `scripts/build.bat` が venv なしの場合に案内メッセージを出して終了する
- [ ] `scripts/build.bat` でビルドが最後まで通る
- [ ] `files:` 以外のファイルを変更していない
