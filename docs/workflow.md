# 開発ワークフロー

このプロジェクトの開発手順と、docs/tasks構造の使い方。

---

## 基本ルール

- **実装の前に振舞（behavior）が必要**
- **振舞の前に要件（REQ）が必要**
- ただし、**メモ・アイデアはどのフェーズでも `status: draft` で自由に書いてよい**
- 上位の仕様が変わったら、下位（振舞・タスク）を再確認する

---

## フォルダ構成

```
docs/
├── purpose.md              # 目的（ほぼ変えない）
├── architecture.md         # アーキテクチャ図（Mermaid）
├── design/                 # 複数REQをまたぐ横断的な設計・スキーマ
└── requirements/
    └── REQ-XXX_name/
        ├── spec.md         # 概要・受け入れ条件
        ├── constraints.md  # 制限事項・対応しない範囲（必要なら）
        ├── design.md       # 処理フロー・決定事項とその理由（必要なら）
        ├── schema/
        │   └── *.md        # データ構造（JSON・YAML形式など）（必要なら）
        └── behaviors/
            └── B-XXX.md    # 振舞仕様（Given/When/Then）

tasks/
├── _template.md            # タスク作成テンプレート
├── active/                 # 進行中タスク（Claudeのスコープ）
└── done/                   # 完了済みタスク
```

---

## ステータス一覧

各ドキュメントのフロントマター（`---` で囲まれた冒頭部分）に書く。

| status | 意味 |
|--------|------|
| `draft` | メモ・作業中。前提条件不問で書いてよい |
| `approved` | 確定。これを前提に下位を進められる |
| `ready` | タスク専用。着手してよい状態 |
| `done` | 完了 |

---

## 開発の流れ

### 1. 要件を書く

`docs/requirements/REQ-XXX_name/spec.md` を作成する。

```markdown
---
id: REQ-XXX
title: 機能名
status: approved
---

## 概要
（何を達成するか）

## 受け入れ条件
- [ ] 〜できる
```

必要に応じて `constraints.md`（対応しない範囲）、`design.md`（設計・決定事項）、`schema/*.md`（データ構造）を追加する。

REQが `approved` になって初めて、振舞を `approved` にできる。

---

### 2. 振舞を書く

`docs/requirements/REQ-XXX_name/behaviors/B-XXX.md` を作成する。

```markdown
---
id: B-XXX
title: 〜できる
status: approved
req: REQ-XXX
---

## 振舞

Given: 〜の状態で
When:  〜したとき
Then:  〜になる
```

振舞が `approved` になって初めて、タスクを `ready` にできる。

---

### 3. タスクを作る

`tasks/_template.md` をコピーして `tasks/active/TASK-XXX.md` を作る。

```markdown
---
id: TASK-XXX
type: docs | design | behavior | impl | test
status: ready
files:
  - docs/requirements/REQ-XXX/behaviors/B-XXX.md
---

## やること
（1つのことだけ）

## やらないこと
（スコープ外を明示）
```

**`files:` が Claudeのスコープになる。ここに書いたファイル以外は変更されない。**
タスクはドキュメント作成・設計・振舞定義・実装・テストなど、あらゆる作業単位になる。

---

### 4. Claudeに作業させる

```
「TASK-001をやって」
```

Claudeは `tasks/active/TASK-001.md` を読み、`files:` のファイルだけ変更する。

---

### 5. 完了処理

確認が終わったら、タスクの `status` を `done` に変更して `tasks/done/` に移動する。

---

## ドラフトメモの使い方

気づいたことやアイデアは、どこでも `status: draft` で書いてよい。

- 要件を書きながら振舞のメモ → `behaviors/B-XXX.md` を `draft` で作っておく
- 作業中に上位仕様の問題に気づいた → `spec.md` に `## メモ` セクションを追記
- 次のREQのアイデア → `REQ-XXX/spec.md` を `draft` で作っておく

---

## よくある操作

| やりたいこと | 操作 |
|-------------|------|
| 新しい要件を追加 | `docs/requirements/REQ-XXX_name/spec.md` を作成 |
| 制限事項を記録する | `constraints.md` を作成 |
| 設計・決定事項を記録する | `design.md` を作成 |
| データ構造を定義する | `schema/*.md` を作成 |
| 振舞を追加 | `behaviors/B-XXX.md` を作成 |
| タスクを作る | `_template.md` をコピーして `tasks/active/` に置く |
| Claudeのスコープを制限 | タスクの `files:` に変更対象ファイルだけ書く |
| 横断的な設計を書く | `docs/design/` に置く |
