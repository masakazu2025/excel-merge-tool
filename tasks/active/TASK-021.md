---
id: TASK-021
title: 次フェーズ：スキーマ階層化 + コメント・図形・カスタムルール実装
type: design
status: draft
refs:
  - docs/requirements/backend/REQ-001_extraction/schema/diff_json.md
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-004.md
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-005.md
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-006.md
files:
  - docs/requirements/backend/REQ-001_extraction/schema/diff_json.md
  - backend/src/extractor.py
  - frontend/src/types/diff.ts
  - frontend/src/components/DiffGrid.tsx
  - frontend/src/components/CellDetailModal.tsx
  - frontend/src/pages/Report.tsx
---

## やること

以下をまとめて次フェーズで実施する。

### 1. スキーマ階層化（リファクタ）

フラットなセル差分スキーマを階層構造に変更する。

```json
{
  "cell": "B4",
  "display_status": "update",
  "text": {
    "base_value": "旧値",
    "b_value": "新値",
    "c_value": "旧値",
    "changed_by": "b",
    "status": "update"
  },
  "comment": {
    "base_value": "元コメント",
    "b_value": "元コメント追記",
    "c_value": "元コメント",
    "changed_by": "b",
    "status": "add"
  }
}
```

### 2. B-004 コメント差分実装

階層化と同時に実装。`xl/comments*.xml` / `xl/threadedComments/*.xml` をパース。

### 3. B-005 図形差分実装

階層化と同時に実装。`xl/drawings/drawing*.xml` / `vmlDrawing*.xml` をパース。

### 4. B-006 カスタムルール実装

`config/merge_rules.yaml` による除外文字列・優先度ルールの適用。

### 5. UI更新

- セル・コメント統合表示
- 色分け3色化（赤・青・黄）
- 詳細モーダルにテキスト差分・コメント差分を並列表示

## やらないこと

- 今フェーズの既存実装の変更

## 完了条件

- [ ] B-004/B-005/B-006 の status を approved に戻す
- [ ] 振舞テスト（test_b004/b005/b006）が全件 Green
- [ ] diff_json.md スキーマ更新
- [ ] extractor.py の出力構造を変更
- [ ] frontend の型・コンポーネント一式を更新
- [ ] 既存テストが通る

## 備考

- 現フェーズの `comments: []` / `shapes: {...空...}` スタブはそのまま残す
- B-004/B-005/B-006 の Red テスト（test_b004, test_b005, test_b006）は仕様の意図として保持
- 着手前に B-004/B-005/B-006 を `approved` に戻すこと
