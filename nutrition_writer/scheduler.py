"""
栄養記事 自動スケジューラー

定期的に記事を生成してnote.com投稿用ファイルを蓄積する。
使い方:
  python scheduler.py --mode once          # 今すぐ1記事生成
  python scheduler.py --mode daily --hour 6      # 毎朝6時に1記事生成
  python scheduler.py --mode weekly --count 7    # 週1回7記事バッチ生成
  python scheduler.py --mode batch --count 10    # 今すぐ10記事バッチ生成
  python scheduler.py --list                     # 生成済み記事一覧
  python scheduler.py --stats                    # 収益予測レポート
"""

import argparse
import json
import os
import time
from datetime import datetime, timedelta
from pathlib import Path

from nutrition_writer import TOPIC_BANK, batch_generate, generate_article


STATE_FILE = Path("scheduler_state.json")
OUTPUT_DIR = Path("output_articles")


# =========================
# 状態管理
# =========================

def load_state() -> dict:
    """スケジューラーの実行状態を読み込む。"""
    if STATE_FILE.exists():
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {
        "next_topic_index": 0,
        "total_generated": 0,
        "last_run": None,
        "runs": [],
    }


def save_state(state: dict) -> None:
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


# =========================
# 収益レポート
# =========================

def revenue_report() -> None:
    """生成済み記事の収益予測レポートを表示する。"""
    manifest_path = OUTPUT_DIR / "manifest.json"
    if not manifest_path.exists():
        print("記事がまだ生成されていません。先に記事を生成してください。")
        return

    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)

    if not manifest:
        print("記事がありません。")
        return

    print(f"\n{'='*60}")
    print("収益予測レポート")
    print(f"{'='*60}\n")

    # 価格別集計
    price_map = {"300円": 300, "500円": 500, "1000円": 1000}
    total_articles = len(manifest)
    total_potential = 0

    price_counts = {"300円": 0, "500円": 0, "1000円": 0, "不明": 0}
    for article in manifest:
        raw = article.get("price", "500円")
        matched = False
        for p_str, p_val in price_map.items():
            if p_str in raw:
                price_counts[p_str] += 1
                total_potential += p_val
                matched = True
                break
        if not matched:
            price_counts["不明"] += 1
            total_potential += 500  # デフォルト500円で計算

    avg_price = total_potential / total_articles if total_articles else 0

    print(f"生成済み記事数: {total_articles} 件\n")
    print("価格別内訳:")
    for p_str, count in price_counts.items():
        if count > 0:
            print(f"  {p_str}: {count} 件")

    print(f"\n平均推奨価格: {avg_price:.0f}円")
    print(f"全記事販売想定収益（1購入ずつ）: {total_potential:,}円")

    # 月間目標シミュレーション
    print(f"\n{'─'*40}")
    print("月間収益シミュレーション（仮定：各記事 月5〜50購入）")
    print(f"{'─'*40}")
    for purchases_per_article in [5, 10, 30, 50]:
        monthly = sum(
            price_map.get(
                next((p for p in price_map if p in article.get("price", "")), "500円"),
                500
            ) * purchases_per_article
            for article in manifest
        )
        print(f"  月{purchases_per_article:2d}購入/記事 → 月間 {monthly:,}円")

    # 高スコア記事トップ5
    sorted_articles = sorted(manifest, key=lambda x: x.get("score", 0), reverse=True)
    print(f"\n{'─'*40}")
    print("品質スコア TOP5（投稿優先記事）")
    print(f"{'─'*40}")
    for i, art in enumerate(sorted_articles[:5]):
        print(f"  {i+1}. [{art.get('score', 0):.0f}点] {art.get('title', '不明')[:50]}")
        print(f"      タグ: {', '.join(art.get('tags', [])[:3])}")
        print(f"      推奨価格: {art.get('price', '?')}")

    print(f"\n出力ディレクトリ: {OUTPUT_DIR.resolve()}\n")


# =========================
# 記事一覧表示
# =========================

def list_articles() -> None:
    """生成済み記事の一覧を表示する。"""
    manifest_path = OUTPUT_DIR / "manifest.json"
    if not manifest_path.exists():
        print("記事がまだ生成されていません。")
        return

    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)

    print(f"\n{'='*60}")
    print(f"生成済み記事一覧（{len(manifest)}件）")
    print(f"{'='*60}\n")
    for i, art in enumerate(manifest):
        dt = art.get("generated_at", "")[:10]
        score = art.get("score", 0)
        price = art.get("price", "?")
        title = art.get("title", "無題")[:50]
        print(f"  [{i+1:3d}] {dt} | {score:5.0f}点 | {price} | {title}")

    print()


# =========================
# スケジューラー本体
# =========================

def run_once(verbose: bool = True) -> None:
    """1記事生成する。次のトピックは状態ファイルで管理。"""
    state = load_state()
    idx = state["next_topic_index"] % len(TOPIC_BANK)
    topic = TOPIC_BANK[idx]

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] 記事生成開始（トピック#{idx}: {topic[:50]}...）")

    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        results = batch_generate(n=1, start_index=idx, output_dir=str(OUTPUT_DIR))

        state["next_topic_index"] = (idx + 1) % len(TOPIC_BANK)
        state["total_generated"] += 1
        state["last_run"] = datetime.now().isoformat()
        state["runs"].append(
            {
                "timestamp": datetime.now().isoformat(),
                "topic_index": idx,
                "topic": topic,
                "success": "error" not in results[0] if results else False,
            }
        )
        save_state(state)

    except Exception as e:
        print(f"エラー: {e}")


def run_batch(count: int) -> None:
    """指定した数の記事をバッチ生成する。"""
    state = load_state()
    idx = state["next_topic_index"] % len(TOPIC_BANK)

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] バッチ生成開始（{count}件, 開始インデックス#{idx}）")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results = batch_generate(n=count, start_index=idx, output_dir=str(OUTPUT_DIR))

    success_count = len([r for r in results if "error" not in r])
    state["next_topic_index"] = (idx + count) % len(TOPIC_BANK)
    state["total_generated"] += success_count
    state["last_run"] = datetime.now().isoformat()
    state["runs"].append(
        {
            "timestamp": datetime.now().isoformat(),
            "topic_index": idx,
            "count": count,
            "success_count": success_count,
        }
    )
    save_state(state)


def run_daily(hour: int = 6) -> None:
    """
    毎日指定時刻に1記事生成するループ（無限ループ）。
    Ctrl+C で停止。
    """
    print(f"デイリースケジューラー起動。毎日 {hour:02d}:00 に記事生成します。")
    print("停止するには Ctrl+C を押してください。\n")

    try:
        while True:
            now = datetime.now()
            next_run = now.replace(hour=hour, minute=0, second=0, microsecond=0)
            if next_run <= now:
                next_run += timedelta(days=1)

            wait_seconds = (next_run - now).total_seconds()
            print(f"次回実行: {next_run.strftime('%Y-%m-%d %H:%M')} （{wait_seconds/3600:.1f}時間後）")

            time.sleep(wait_seconds)
            run_once()

    except KeyboardInterrupt:
        print("\nスケジューラーを停止しました。")


def run_weekly(weekday: int = 0, hour: int = 6, count: int = 7) -> None:
    """
    毎週指定曜日の指定時刻にcount記事をバッチ生成するループ（無限ループ）。
    weekday: 0=月曜, 1=火曜, ..., 6=日曜
    Ctrl+C で停止。
    """
    weekday_names = ["月", "火", "水", "木", "金", "土", "日"]
    print(f"ウィークリースケジューラー起動。毎週{weekday_names[weekday]}曜 {hour:02d}:00 に {count}記事生成します。")
    print("停止するには Ctrl+C を押してください。\n")

    try:
        while True:
            now = datetime.now()
            days_ahead = weekday - now.weekday()
            if days_ahead < 0 or (days_ahead == 0 and now.hour >= hour):
                days_ahead += 7
            next_run = (now + timedelta(days=days_ahead)).replace(
                hour=hour, minute=0, second=0, microsecond=0
            )

            wait_seconds = (next_run - now).total_seconds()
            print(
                f"次回実行: {next_run.strftime('%Y-%m-%d (%a) %H:%M')} （{wait_seconds/3600:.1f}時間後, {count}記事）"
            )

            time.sleep(wait_seconds)
            run_batch(count)

    except KeyboardInterrupt:
        print("\nスケジューラーを停止しました。")


# =========================
# エントリーポイント
# =========================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="栄養記事自動スケジューラー",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  python scheduler.py --mode once               今すぐ1記事生成
  python scheduler.py --mode batch --count 5    今すぐ5記事バッチ生成
  python scheduler.py --mode daily --hour 6     毎朝6時に1記事生成（常駐）
  python scheduler.py --mode weekly --count 7   毎週月曜6時に7記事生成（常駐）
  python scheduler.py --list                    生成済み記事一覧
  python scheduler.py --stats                   収益予測レポート
""",
    )

    parser.add_argument(
        "--mode",
        choices=["once", "batch", "daily", "weekly"],
        help="実行モード",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=5,
        help="バッチ/週次生成の記事数（デフォルト: 5）",
    )
    parser.add_argument(
        "--hour",
        type=int,
        default=6,
        help="デイリー/ウィークリーの実行時刻（0-23, デフォルト: 6）",
    )
    parser.add_argument(
        "--weekday",
        type=int,
        default=0,
        help="週次実行の曜日（0=月, 1=火, ..., 6=日, デフォルト: 0）",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="生成済み記事一覧を表示",
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="収益予測レポートを表示",
    )

    args = parser.parse_args()

    if args.list:
        list_articles()
    elif args.stats:
        revenue_report()
    elif args.mode == "once":
        run_once()
    elif args.mode == "batch":
        run_batch(args.count)
    elif args.mode == "daily":
        run_daily(hour=args.hour)
    elif args.mode == "weekly":
        run_weekly(weekday=args.weekday, hour=args.hour, count=args.count)
    else:
        parser.print_help()
