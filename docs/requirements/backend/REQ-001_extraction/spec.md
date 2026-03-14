---
id: REQ-001
title: Excel差分抽出コアロジック
status: approved
detail: docs/feature/step1_python_extraction.md
---

# REQ-001 Excel差分抽出コアロジック

## 概要

3つのxlsxファイルをZIP解凍してXMLを直接比較し、差分を `diff.json` として出力する。

## 受け入れ条件

- [ ] セル（値・数式・日付・リッチテキスト）の差分を検出できる
- [ ] ノート（旧形式コメント）の差分を検出できる
- [ ] スレッドコメント（新形式）の差分を検出できる
- [ ] 図形（テキストボックス・画像・グラフ）の増減を検出できる
- [ ] BとCが同じセルを異なる値に変更した場合、`conflict: true` になる
- [ ] 各差分に `review_required` と `diff_hint` が付与される
- [ ] `config/merge_rules.yaml` のルールが適用される

## 詳細仕様

詳細は [step1_python_extraction.md](../../feature/step1_python_extraction.md) を参照。

## 振舞一覧

| ID | 内容 | status |
|----|------|--------|
| B-001 | セル値の差分を検出する | approved |
| B-002 | 競合を検出する | approved |
| B-003 | diff_hint と review_required を付与する | approved |
| B-004 | コメントの差分を検出する | approved |
| B-005 | 図形の差分を検出する | approved |
| B-006 | カスタムルール（merge_rules.yaml）を適用する | approved |
