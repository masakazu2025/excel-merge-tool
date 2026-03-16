---
id: TASK-029
title: extractor.py をパッケージ分割する（B-004/B-005/B-006 実装後）
type: impl
status: draft
refs:
  - docs/requirements/backend/REQ-001_extraction/design.md
files:
  - backend/src/extractor/
  - backend/src/extractor/__init__.py
  - backend/src/extractor/cells.py
  - backend/src/extractor/comments.py
  - backend/src/extractor/shapes.py
  - backend/src/extractor/rules.py
  - backend/src/api/compare.py
---

## やること

TASK-021（B-004/B-005/B-006 実装）完了後に、extractor.py をパッケージに分割する。
実装済みコードの共通部分・依存関係を見て、適切な境界を決めてから分割する。

## やらないこと

- ロジックの変更（純粋なリファクタ）
- テストの追加（既存テストが通ることで完了とする）
- TASK-021 より先に着手する

## 完了条件

- [ ] `backend/src/extractor/` パッケージに分割されている
- [ ] `__init__.py` が外部インターフェース（compare 関数など）のみ公開している
- [ ] `backend/src/api/compare.py` のインポートパスが更新されている
- [ ] 既存テスト（pytest）が全件 Green のまま
- [ ] `backend/src/extractor.py` が削除されている

## 備考

- 分割の境界は実装後のコードを見て決める（事前に決めない）
- cells / comments / shapes / rules の4ファイルはあくまで目安
