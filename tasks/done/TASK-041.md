---
id: TASK-041
title: cell-rangeエンドポイント実装（B-036）
type: impl
status: done
refs:
  - docs/requirements/backend/REQ-002_api/behaviors/B-036.md
files:
  - backend/src/api/reports.py
  - backend/src/api/compare.py
  - backend/tests/test_b036_cell_range.py
---

## やること

`GET /api/reports/{id}/cell-range?sheet=Sheet1&row=1` エンドポイントを追加する

- row指定: base.xlsxの指定行のすべての列値を返す
- col指定: base.xlsxの指定列のすべての行値を返す
- row/colどちらも/両方指定は400エラー
- 存在しないIDは404エラー

## やらないこと

- file_bやfile_cの値取得
- 複数行・複数列の同時取得

## 完了条件

- [x] row指定でセル値が返る
- [x] col指定でセル値が返る
- [x] バリデーションエラーが返る
- [x] テストが通る
