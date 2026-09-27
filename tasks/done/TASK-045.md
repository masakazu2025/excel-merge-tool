---
id: TASK-045
title: ロックファイルを最新化する（poetry.lock / package-lock.json）
type: impl
status: done
refs: []
files:
  - backend/poetry.lock
  - frontend/package-lock.json
---

# TASK-045 ロックファイルを最新化する

## やること

作業ツリーにある、次の2つのロックファイルの更新をコミットする。
- `backend/poetry.lock`：`pyproject.toml` との不整合を解消（`poetry lock`）
- `frontend/package-lock.json`：`npm audit fix` で脆弱性18件を解消（`package.json` は変更なし）

CI（TASK-049）で `poetry install` / `npm ci` を通すための前提になる。

## やらないこと

- `pyproject.toml` / `package.json` の依存バージョン変更
- `npm audit fix --force` によるメジャーバージョン更新

## 完了条件

- [x] `poetry install --extras dev` がエラーなく完了する
- [x] `npm ci` が完了し、`npm audit` の結果が 0 vulnerabilities
- [x] `npm test` が全件 pass
