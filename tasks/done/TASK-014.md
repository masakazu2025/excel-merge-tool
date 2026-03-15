---
id: TASK-014
title: B-004/B-005テスト修正（xfail→Red）＋conftest拡張
type: test
status: done
refs:
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-004.md
  - docs/requirements/backend/REQ-001_extraction/behaviors/B-005.md
files:
  - backend/tests/conftest.py
  - backend/tests/test_b004_comments.py
  - backend/tests/test_b005_shapes.py
---

## やること

- xfail で書いていた B-004/B-005 のテストを、正しく Red になるテストに書き直す
- conftest.py にコメント付き xlsx・図形付き xlsx のヘルパーを追加する

## やらないこと

- 実装コードの変更
- B-004/B-005 以外の振舞のテスト

## 完了条件

- [x] pytest を実行したとき B-004/B-005 関連テストが FAILED（Red）になる
- [x] スタブ動作確認テスト（comments フィールドが存在する等）は PASSED のまま
