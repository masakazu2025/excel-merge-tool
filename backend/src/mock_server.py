"""モック用FastAPIサーバー - フロントエンド開発用

起動:
    python src/mock_server.py

その後、別ターミナルで:
    cd frontend && npm run dev
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Excel Merge Tool - Mock Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# モックデータ
# ---------------------------------------------------------------------------

def _make_reports() -> list:
    base = [
        {
            "report_id": "20260314_153042",
            "created_at": "2026-03-14T15:30:42",
            "base_file": "base.xlsx",
            "file_b": "file_b.xlsx",
            "file_c": "file_c.xlsx",
            "total_diffs": 17,
            "total_conflicts": 3,
        },
        {
            "report_id": "20260310_091200",
            "created_at": "2026-03-10T09:12:00",
            "base_file": "base_v2.xlsx",
            "file_b": "tanaka.xlsx",
            "file_c": "suzuki.xlsx",
            "total_diffs": 5,
            "total_conflicts": 0,
        },
    ]
    # ページネーション確認用に25件に水増し
    extra = [
        {
            "report_id": f"2026030{i}_120000",
            "created_at": f"2026-03-0{i}T12:00:00",
            "base_file": f"base_{i}.xlsx",
            "file_b": f"compare_{i}.xlsx",
            "file_c": None,
            "total_diffs": i * 3,
            "total_conflicts": 0,
        }
        for i in range(1, 24)
    ]
    return base + extra

MOCK_REPORTS = _make_reports()

def _cell(sheet, cell, base, b, c=None, *, typ="value"):
    """changed_by / status を値から自動計算するヘルパー"""
    base_v = base or None
    b_changed = b != base
    c_changed = c is not None and c != base
    if b_changed and c_changed:
        changed_by = "both"
    elif b_changed:
        changed_by = "b"
    elif c_changed:
        changed_by = "c"
    else:
        changed_by = None

    def _status(bv, nv):
        if changed_by == "both" and b != c:
            return "conflict"
        nv = b if changed_by in ("b", "both") else c
        if not base_v and nv:
            return "new"
        if base_v and not nv:
            return "delete"
        if nv and base_v and nv.startswith(base_v) and len(nv) > len(base_v):
            return "add"
        if nv and base_v and base_v.startswith(nv) and len(base_v) > len(nv):
            return "sub"
        return "update"

    status = _status(base_v, b) if changed_by else "no_change"

    return {
        "id": f"{sheet}__{cell}",
        "cell": cell,
        "base_value": base_v,
        "b_value": b,
        "c_value": c,
        "type": typ,
        "changed_by": changed_by,
        "status": status,
    }

S = "不具合管理表"

MOCK_DIFF: dict = {
    "meta": MOCK_REPORTS[0],
    "sheets": {
        S: {
            "cells": [
                # --- E列: 不具合内容（詳細） ---
                _cell(S, "E3",
                    base="ログイン画面にて、パスワード入力後にEnterキーを押した場合にログインが実行されない。\n手順：\n1. ログイン画面を開く\n2. IDとパスワードを入力\n3. Enterキーを押す\n結果：何も起きない\n期待：ログイン処理が実行されること",
                    b="ログイン画面にて、パスワード入力後にEnterキーを押した場合にログインが実行されない。\n手順：\n1. ログイン画面を開く\n2. IDとパスワードを入力\n3. Enterキーを押す\n結果：何も起きない\n期待：ログイン処理が実行されること\n※Tabキーでフォーカスが当たらない場合も同様の事象あり"),
                _cell(S, "E5",
                    base="帳票出力処理でデータ件数が1000件を超えるとタイムアウトエラーが発生する。\nエラーメッセージ：「処理がタイムアウトしました（504）」\n発生条件：対象期間が3ヶ月以上かつ件数1000件超",
                    b="帳票出力処理でデータ件数が1000件を超えるとタイムアウトエラーが発生する。\nエラーメッセージ：「処理がタイムアウトしました（504）」\n発生条件：対象期間が3ヶ月以上かつ件数1000件超\n追記：500件でも発生するケースを確認（2026/03/10）",
                    c="帳票出力処理でデータ件数が500件を超えるとタイムアウトエラーが発生する。\nエラーメッセージ：「処理がタイムアウトしました（504）」\n発生条件：対象期間が2ヶ月以上かつ件数500件超"),
                _cell(S, "E7",
                    base="検索結果画面にて、ソート順を変更後にページを切り替えると、ソート条件がリセットされる。\n再現率：100%\n影響範囲：顧客一覧・案件一覧・請求一覧",
                    b="検索結果画面にて、ソート順を変更後にページを切り替えると、ソート条件がリセットされる。\n再現率：100%\n影響範囲：顧客一覧・案件一覧・請求一覧\nブラウザ：Chrome / Edge 両方で確認"),
                _cell(S, "E9",
                    base="",
                    b="ユーザー設定画面でメールアドレス変更後、確認メールが届かない。\n手順：\n1. ユーザー設定を開く\n2. メールアドレスを変更して保存\n3. 確認メール待機\n結果：メールが届かない（迷惑メールフォルダにも無し）\n発生頻度：約30%の確率で発生"),
                _cell(S, "E11",
                    base="PDF出力時に日本語フォントが文字化けする。\n対象帳票：請求書・見積書\n環境：Windows11 / Adobe Reader DC",
                    b="PDF出力時に日本語フォントが文字化けする。\n対象帳票：請求書・見積書・納品書\n環境：Windows11 / Adobe Reader DC\n※macOSのプレビューでは正常表示"),
                _cell(S, "E13",
                    base="管理者画面のユーザー一覧で、100件以上表示するとスクロールが重くなる。\n測定値：100件で約3秒、500件で約15秒の描画遅延",
                    b="管理者画面のユーザー一覧で、100件以上表示するとスクロールが重くなる。\n測定値：100件で約3秒、500件で約15秒の描画遅延",
                    c="管理者画面のユーザー一覧で、50件以上表示するとスクロールが重くなる。\n測定値：50件で約2秒、100件で約8秒、500件で約30秒の描画遅延\n仮想スクロール未実装が原因と推測"),
                _cell(S, "E15",
                    base="CSVエクスポート機能で、全角文字を含むデータが文字化けする。\nエンコード：UTF-8で出力されているがExcelで開くと化ける\n回避策：メモ帳で開き直すと正常",
                    b="CSVエクスポート機能で、全角文字を含むデータが文字化けする。\nエンコード：UTF-8で出力されているがExcelで開くと化ける\n回避策：メモ帳で開き直すと正常\nBOM付きUTF-8への変更で対応可能か検証中"),
                _cell(S, "E17",
                    base="日付入力フィールドで「2月30日」など存在しない日付が入力可能になっている。\nバリデーションが実装されていない",
                    b="日付入力フィールドで「2月30日」など存在しない日付が入力可能になっている。\nバリデーションが実装されていない\n該当箇所：発生日・完了予定日・承認日の3フィールド"),
                _cell(S, "E19",
                    base="",
                    b="セッションタイムアウト後に操作しようとすると、エラー画面ではなく空白ページが表示される。\nユーザーが状況を把握できず混乱を招く。\nタイムアウト時間：30分\n期待動作：ログイン画面へリダイレクトしてメッセージ表示"),
                _cell(S, "E21",
                    base="添付ファイルのダウンロード時、ファイル名に日本語が含まれると「%XX」形式にエンコードされたファイル名でDLされる。",
                    b="添付ファイルのダウンロード時、ファイル名に日本語が含まれると「%XX」形式にエンコードされたファイル名でDLされる。\n影響ブラウザ：Chrome・Edge（Firefoxは正常）\nContent-Dispositionヘッダの設定が原因"),

                # --- F列: 対応内容（詳細） ---
                _cell(S, "F3",
                    base="form要素のonSubmitイベントハンドラを追加する対応を実施。",
                    b="form要素のonSubmitイベントハンドラを追加する対応を実施。\n合わせてTabキーのフォーカス制御も修正。\n対応バージョン：v2.3.1\n対応者：山田"),
                _cell(S, "F5",
                    base="クエリのインデックスを見直し、実行計画を最適化。\nタイムアウト上限を30秒から120秒に変更。",
                    b="クエリのインデックスを見直し、実行計画を最適化。\nタイムアウト上限を30秒から120秒に変更。\n非同期処理化も検討中（次スプリント対応予定）",
                    c="バックグラウンド処理に変更し、処理完了後にメール通知する方式に変更。\nタイムアウト問題を根本解決。\n対応工数：5人日"),
                _cell(S, "F7",
                    base="URLクエリパラメータにソート条件を保持するよう修正。",
                    b="URLクエリパラメータにソート条件を保持するよう修正。\nあわせてブラウザバック時の挙動も改善。\nPR#482でレビュー中"),
                _cell(S, "F11",
                    base="フォント埋め込み設定を見直し中。",
                    b="iTextライブラリのフォント設定でIPAexフォントを明示的に埋め込むよう修正。\n帳票生成クラスを共通化し、全帳票で同一フォントを使用する。\n対応完了：2026/03/12"),
                _cell(S, "F15",
                    base="調査中",
                    b="BOM付きUTF-8（UTF-8-BOM）で出力するよう変更。\nExcelでの文字化けが解消することを確認済み。\n対応者：鈴木\n対応完了：2026/03/11"),
                _cell(S, "F17",
                    base="",
                    b="日付フィールドにサーバーサイドバリデーションを追加。\nフロントエンドのdate型inputも合わせて修正し、不正な日付は入力不可にする。\n対応予定：2026/03/20"),
                _cell(S, "F21",
                    base="",
                    b="Content-DispositionヘッダをRFC 5987形式（filename*=UTF-8''...）に変更。\n主要ブラウザでの動作確認済み。\nPR#491"),

                # --- G列: ステータス変更 ---
                _cell(S, "G3",  base="対応中", b="完了"),
                _cell(S, "G7",  base="対応中", b="レビュー中"),
                _cell(S, "G11", base="調査中",  b="完了"),
                _cell(S, "G15", base="調査中",  b="完了"),
                _cell(S, "G17", base="未着手",  b="対応中"),
                _cell(S, "G21", base="調査中",  b="完了"),

                # --- D列: 担当者変更 ---
                _cell(S, "D5",  base="田中",  b="田中",   c="佐藤"),
                _cell(S, "D13", base="未定",  b="鈴木"),
                _cell(S, "D19", base="",      b="山田"),
            ],
            "comments": [],
            "shapes": {"matched": [], "added_b": [], "added_c": [], "deleted_b": [], "deleted_c": []},
        },
        "課題管理": {
            "cells": [
                _cell("課題管理", "C4",
                    base="設計レビューの実施タイミングが不明確で、手戻りが多発している。\n関係者間で認識の齟齬が生じている。",
                    b="設計レビューの実施タイミングが不明確で、手戻りが多発している。\n関係者間で認識の齟齬が生じている。\n→ レビューチェックリストを作成して対応予定"),
                _cell("課題管理", "C7",
                    base="テスト環境のデータが本番と乖離しており、テスト精度が低下している。",
                    b="テスト環境のデータが本番と乖離しており、テスト精度が低下している。",
                    c="テスト環境のデータが本番と乖離しており、テスト精度が低下している。\n本番データのマスキング処理後の定期同期を提案。"),
                _cell("課題管理", "D4", base="未着手", b="対応中"),
                _cell("課題管理", "D7", base="未着手", b="未着手", c="対応中"),
            ],
            "comments": [],
            "shapes": {"matched": [], "added_b": [], "added_c": [], "deleted_b": [], "deleted_c": []},
        },
    },
}


# ---------------------------------------------------------------------------
# エンドポイント
# ---------------------------------------------------------------------------

@app.get("/api/reports")
def list_reports(page: int = 1, limit: int = 20):
    start = (page - 1) * limit
    items = MOCK_REPORTS[start: start + limit]
    return {"items": items, "total": len(MOCK_REPORTS), "page": page, "limit": limit}


@app.get("/api/reports/{report_id}")
def get_report(report_id: str):
    return MOCK_DIFF


@app.post("/api/compare")
async def compare():
    """アップロードを受け取り、モックレポートIDを返す"""
    import asyncio
    await asyncio.sleep(1.5)  # 処理時間をシミュレート
    return MOCK_REPORTS[0]


# ---------------------------------------------------------------------------
# 起動
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("Mock server: http://localhost:8080")
    print("フロントエンド: cd frontend && npm run dev")
    uvicorn.run("mock_server:app", host="127.0.0.1", port=8080, reload=True)
