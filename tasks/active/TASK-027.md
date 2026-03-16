---
id: TASK-027
title: 結合テスト（TestClient）を追加する
type: test
status: draft
refs:
  - docs/requirements/backend/REQ-002_api/spec.md
files:
  - backend/tests/test_integration.py
  - backend/tests/fixtures/base.xlsx
  - backend/tests/fixtures/file_b.xlsx
---

## やること

FastAPI TestClient を使った結合テストを追加する。
ユニットテストでは検証できない「ファイルアップロード → 差分抽出 → API レスポンス」の一連のフローを自動テストで確認できるようにする。

## やらないこと

- フロントエンドを含む E2E テスト（Playwright 等）
- サーバーを別途起動する形式のテスト
- 既存のユニットテスト（test_b0xx.py）の変更

## 完了条件

### TDD ステップ
- [ ] B-XXX の Given/When/Then をテストケースに変換した
- [ ] テストを実行して Red になることを確認した
- [ ] 実装して Green になった
- [ ] `files:` 以外のファイルを変更していない

### シナリオ（最低限）
- [ ] 正常系：base + file_b をアップロード → 200 + diff JSON が返る
- [ ] 正常系：差分件数が期待値と一致する
- [ ] 異常系：file_b なしでアップロード → 適切なエラーコードが返る
- [ ] 異常系：壊れた xlsx をアップロード → E00x エラーが返る

## 備考

- fixtures/ に既知の差分を持つ .xlsx ペアを手動で用意する
- `@pytest.mark.integration` タグを付けてユニットテストと分離できるようにする
- 通常の `pytest` 実行にも含める（分離は任意）
