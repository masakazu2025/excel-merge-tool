"""エントリポイント"""

import sys
import webbrowser
import threading
from pathlib import Path
import uvicorn


def get_base_dir() -> Path:
    """PyInstaller の場合は exe と同じディレクトリ、通常実行時はプロジェクトルート"""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).parent.parent.parent


def main():
    base_dir = get_base_dir()

    # ロガー初期化（最初に行う）
    from logger import setup_logging
    setup_logging(base_dir)

    # output ディレクトリをベースに設定（レポート保存先）
    import api.compare as compare_module
    import api.reports as reports_module
    output_dir = base_dir / "output"
    output_dir.mkdir(exist_ok=True)
    compare_module.OUTPUT_DIR = output_dir
    reports_module.OUTPUT_DIR = output_dir

    # ブラウザを自動オープン（少し遅延させてサーバー起動を待つ）
    def open_browser():
        import time
        time.sleep(1.0)
        webbrowser.open("http://127.0.0.1:8080")

    threading.Thread(target=open_browser, daemon=True).start()

    from app import app
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8080,
        # uvicorn のアクセスログは無効（処理量が少ないデスクトップツールのため不要）
        # 有効化する場合は log_config=None を削除し、パターンAの統合ログを検討すること
        log_config=None,
    )


if __name__ == "__main__":
    main()
