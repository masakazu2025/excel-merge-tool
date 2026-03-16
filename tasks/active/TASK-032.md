---
id: TASK-032
title: ルート直下の build.bat / build.sh を削除・移動する
type: impl
status: ready
refs:
  - https://github.com/masakazu2025/excel-merge-tool/issues/5
files:
  - build.bat
  - build.sh
  - scripts/build.sh
---

# TASK-032 ルート直下の build.bat / build.sh を削除・移動する

## やること

- ルート直下の `build.bat` を削除する（`scripts/build.bat` に置き換え済み）
- ルート直下の `build.sh` を `scripts/build.sh` に移動する

## やらないこと

- `scripts/build.sh` の内容変更
- `scripts/` 以外のファイルの変更

## 完了条件

- [ ] ルート直下に `build.bat` が存在しない
- [ ] `scripts/build.sh` が存在する
- [ ] ルート直下に `build.sh` が存在しない
- [ ] `files:` 以外のファイルを変更していない
