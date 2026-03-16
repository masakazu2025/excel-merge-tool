---
id: TASK-030
title: pyproject.toml に pyinstaller を追加
type: impl
status: done
refs:
  - https://github.com/masakazu2025/excel-merge-tool/issues/1
files:
  - backend/pyproject.toml
---

# TASK-030 pyproject.toml に pyinstaller を追加

## やること

`backend/pyproject.toml` の `dependencies` に `pyinstaller>=6.0` を追加する。

## やらないこと

- `build.bat` の変更
- 環境構築手順の整備（別 Issue）
- ツール用フォルダの設計（別 Issue）

## 完了条件

- [x] `backend/pyproject.toml` の `dependencies` に `pyinstaller>=6.0` が追加されている
- [x] `files:` 以外のファイルを変更していない
