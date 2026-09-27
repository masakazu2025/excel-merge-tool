---
id: TASK-047
title: E005/E007 の API テストを OS に依存しない形にする
type: test
status: done
refs:
  - docs/requirements/backend/REQ-006_error_handling/behaviors/B-039.md
files:
  - backend/tests/test_api.py
---

# TASK-047 E005/E007 の API テストを OS に依存しない形にする

## 背景

`TestE005SaveApi.test_save_failure_returns_422_e005` と
`TestE007Api.test_unreadable_file_returns_404_e007` は、`chmod` を使って書き込み・読み取りを失敗させている。
Windows では `chmod` による権限制限が効かないため、実装は正しくてもこの2件が失敗する。

## やること

`chmod` の代わりに `monkeypatch` で書き込み・読み込み処理が `PermissionError` を送出するようにし、
Windows でも Linux でも同じ振る舞いを検証できるようにする。

## やらないこと

- `api/compare.py` / `api/reports.py` の実装変更
- 他のテストの変更

## 完了条件

- [x] Windows で 2 件とも pass する
- [x] 振舞 B-039（E005 レポート保存失敗 / E007 読み込み失敗）の Then を引き続き検証している
