"""ロガー設定モジュール"""

import logging
import sys
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

import yaml

_initialized = False


def setup_logging(base_dir: Path) -> None:
    """
    アプリ起動時に1回だけ呼び出す。
    base_dir: exe と同じディレクトリ（config/ と logs/ の基準）
    """
    global _initialized
    if _initialized:
        return
    _initialized = True

    # 設定ファイル読み込み
    config_path = base_dir / "config" / "logging.yaml"
    config = _load_config(config_path)

    level_console = getattr(logging, config["log_level_console"].upper(), logging.WARNING)
    level_file = getattr(logging, config["log_level_file"].upper(), logging.INFO)
    rotate_when = config.get("rotate_when", "midnight")
    backup_count = int(config.get("backup_count", 30))
    log_dir = base_dir / config.get("log_dir", "logs")
    log_dir.mkdir(exist_ok=True)

    fmt = logging.Formatter(
        "%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    root = logging.getLogger()
    root.setLevel(logging.DEBUG)  # ハンドラ側でフィルタリング

    # コンソールハンドラ（WARNING 以上）
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(level_console)
    console_handler.setFormatter(fmt)
    root.addHandler(console_handler)

    # ファイルハンドラ（INFO 以上、日次ローテーション）
    log_file = log_dir / "app.log"
    file_handler = TimedRotatingFileHandler(
        filename=str(log_file),
        when=rotate_when,
        backupCount=backup_count,
        encoding="utf-8",
    )
    file_handler.setLevel(level_file)
    file_handler.setFormatter(fmt)
    # ローテーション後のファイル名: app_YYYY-MM-DD.log
    file_handler.suffix = "_%Y-%m-%d.log"
    file_handler.namer = lambda name: name  # suffix をそのまま使う
    root.addHandler(file_handler)


def get_logger(name: str) -> logging.Logger:
    """各モジュールで使用するロガーを返す"""
    return logging.getLogger(name)


def _load_config(path: Path) -> dict:
    """設定ファイルを読み込む。存在しない場合はデフォルト値を返す"""
    defaults = {
        "log_level_console": "WARNING",
        "log_level_file": "INFO",
        "rotate_when": "midnight",
        "backup_count": 30,
        "log_dir": "logs",
    }
    if not path.exists():
        return defaults
    try:
        with open(path, encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        return {**defaults, **data}
    except Exception:
        return defaults
