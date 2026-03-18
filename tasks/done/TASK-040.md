---
id: TASK-040
title: Ctrl+ホイールでグリッドズーム（B-035実装）
type: impl
status: done
refs:
  - docs/requirements/frontend/REQ-005_report/behaviors/B-035.md
files:
  - frontend/src/components/DiffGrid.tsx
  - frontend/src/tests/report.test.tsx
---

## やること

- Ctrl+ホイールで縮尺変更（50%〜100%、10%刻み）
- 縮尺インジケーター表示（100%未満のとき）
- インジケータークリックで100%にリセット

## やらないこと

- ピンチズーム（タッチ操作）
- シートをまたいだ縮尺の保持

## 完了条件

- [ ] Ctrl+ホイールで縮尺が変わる
- [ ] 縮尺インジケーターが表示される
- [ ] インジケータークリックでリセットされる
- [ ] テストが通る
