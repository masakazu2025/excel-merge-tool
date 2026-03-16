---
id: TASK-XXX
title: （タスクの一言タイトル）
type: docs           # docs | design | behavior | impl | test
status: draft        # draft | ready | done
refs:
  - docs/requirements/REQ-XXX/spec.md
files:
  - docs/requirements/REQ-XXX/behaviors/B-XXX.md  # 変更してよいファイルのみ列挙
---

# TASK-XXX （タイトル）

## やること

（1つのことだけ書く）

## やらないこと

（スコープ外を明示して、Claudeが膨らませないようにする）

## 完了条件

### impl タスクの場合（TDDステップ）
- [ ] B-XXX の Given/When/Then をテストケースに変換した
- [ ] テストを実行して Red になることを確認した
- [ ] 実装して Green になった
- [ ] `files:` 以外のファイルを変更していない

### その他のタスク
- [ ] （確認できる基準を書く）
