# CLAUDE.md - Excel Merge Tool

## 開発ルール

### フェーズ依存関係
- 振舞（behavior）を書く前に、対応する要件（REQ）が `status: approved` であること
- 実装を始める前に、対応する振舞が `status: approved` であること
- **作業は `tasks/active/` にある `status: ready` のタスクに基づいて行うこと**

### スコープルール
- 1回の指示で行うのは **1タスク（TASK-XXX）のみ**
- タスクファイルの `files:` に記載されたファイル **のみ** 変更する
- 指示されていないファイルを変更・作成しない
- タスク完了後、タスクの `status` を `done` に更新し `tasks/done/` に移動する

### ドキュメントルール
- 仕様変更は `docs/requirements/` のファイルに反映してから実装する
- メモ・アイデアは `status: draft` で自由に書いてよい
- 実装なしに仕様を `approved` にしてよい（仕様先行）

### アーキテクチャ図
- `docs/architecture.md` の Mermaid 図は実装変更のたびに更新する

---

## プロジェクト構成

```
docs/
├── purpose.md              # 目的（変えない）
├── architecture.md         # アーキテクチャ図（Mermaid）
├── design/                 # 複数REQをまたぐ横断的な設計・スキーマ
└── requirements/
    └── REQ-001_name/       # 要件ごとのフォルダ
        ├── spec.md         # 概要・受け入れ条件
        ├── constraints.md  # 制限事項・対応しない範囲
        ├── design.md       # 処理フロー・決定事項とその理由
        ├── schema/
        │   └── *.md        # データ構造（JSON・YAML形式など）
        └── behaviors/
            └── B-XXX.md    # 振舞仕様（Given/When/Then）

tasks/
├── _template.md            # タスク作成テンプレート
├── active/                 # 進行中タスク（Claudeのスコープ）
└── done/                   # 完了済みタスク

src/                        # Python バックエンド実装
frontend/src/               # React フロントエンド実装
```

---

## タスクファイルのフォーマット

```markdown
---
id: TASK-XXX
title: （タスクの一言タイトル）
type: docs | design | behavior | impl | test
status: draft | ready | done
refs:
  - docs/requirements/REQ-XXX/requirement.md
files:
  - docs/requirements/REQ-XXX/behavior/B-XXX.md
---

## やること
（1つのことだけ）

## やらないこと
（スコープ外を明示）

## 完了条件
- [ ] （確認できる基準）
```
