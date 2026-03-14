---
id: TASK-001
title: REQ-001（差分抽出）の振舞定義を作成する
type: behavior
status: done
refs:
  - docs/requirements/REQ-001_extraction/spec.md
  - docs/feature/step1_python_extraction.md
files:
  - docs/requirements/REQ-001_extraction/behaviors/B-001.md
  - docs/requirements/REQ-001_extraction/behaviors/B-002.md
  - docs/requirements/REQ-001_extraction/behaviors/B-003.md
  - docs/requirements/REQ-001_extraction/behaviors/B-004.md
  - docs/requirements/REQ-001_extraction/behaviors/B-005.md
  - docs/requirements/REQ-001_extraction/behaviors/B-006.md
  - docs/requirements/REQ-001_extraction/spec.md
---

# TASK-001 REQ-001の振舞定義を作成する

## やること

`step1_python_extraction.md` の内容をもとに、REQ-001の振舞ファイルを作成する。

| ID | 内容 |
|----|------|
| B-001 | セル値の差分を検出する |
| B-002 | 競合（B≠C）を検出する |
| B-003 | diff_hint と review_required を付与する |
| B-004 | コメントの差分を検出する |
| B-005 | 図形（テキストボックス・画像・グラフ）の差分を検出する |
| B-006 | カスタムルール（merge_rules.yaml）を適用する |

spec.md の振舞一覧テーブルも更新する。

## やらないこと

- 実装コードの変更
- 新しい仕様の追加（step1ドキュメントに書かれている内容のみ）

## 完了条件

- [ ] B-001〜B-006.md が作成されている
- [ ] 各ファイルの status が approved になっている
- [ ] spec.md の振舞一覧テーブルが更新されている
