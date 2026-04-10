"""
栄養記事自動生成エンジン — Claude Opus 4.6 powered

note.com収益化のための栄養記事を自動生成。
以下の原則を厳守:
- 再現性のある具体的行動のみ記載
- 3日以内に読者が体感できる内容
- 主観表現禁止
- すべて因果関係で説明
- 手順化必須
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional
import anthropic

client = anthropic.Anthropic()
MODEL = "claude-opus-4-6"

# =========================
# 記事品質ドクトリン
# =========================

NUTRITION_DOCTRINE = """あなたは管理栄養士の資格を持つ医療コンテンツライターです。

【絶対禁止】
・主観表現（「おいしい」「気持ちいい」「快適」など感覚的評価）
・エビデンスなき断言（「〜に効く」「〜を治す」）
・曖昧な量（「適量」「少々」「たくさん」）
・測定不能な効果（「なんとなく」「少し」「ちょっと」）
・3日以内に生理学的に不可能な変化の主張
・栄養素名・食品名の誤記

【絶対義務】
・すべての記述に因果関係の説明（〇〇を摂取すると→〇〇の合成が促進される→その結果〇〇が体感できる）
・具体的な数値（食品名・g数・ml数・時間帯・回数）
・手順の番号化（Step 1→Step 2→Step 3）
・3日間のタイムライン明示
・科学的メカニズムの説明（酵素・ホルモン・神経伝達物質名を使用）

違反を発見した場合：問題を特定→修正箇所を明示→修正→再出力"""

ARTICLE_TEMPLATE = """【必須記事構造】

# タイトル
形式: 「3日で[具体的体感]できる[栄養素/食品/プロトコル]：[量/手順]の完全ガイド」
条件: 数値を含む、体感内容が具体的、誇張なし

## 1. 作用機序（なぜ3日以内に効果が出るのか）
- 摂取/実践 → 生理学的変化の連鎖を説明
- タイムライン（摂取後〇時間→〇日後→〇日後）
- 関与する酵素・ホルモン・神経伝達物質名を明記

## 2. 対象者と前提条件
- 効果が出る対象（年齢・性別・状態の条件）
- 除外条件（禁忌・相互作用のある薬剤）

## 3. 3日間プロトコル（完全手順）
### Day 1（準備・開始フェーズ）
Step 1: [食品名/量/タイミング/調理法]
Step 2: ...
### Day 2（継続・調整フェーズ）
### Day 3（確認・定着フェーズ）

## 4. 効果確認の指標（測定可能な変数）
- 確認方法（計測・観察・記録の手順）
- 期待される変化の数値範囲

## 5. 注意事項
- 過剰摂取のリスクと上限量
- 相互作用する医薬品・食品"""

# =========================
# トピックバンク（50テーマ）
# =========================

TOPIC_BANK = [
    # 消化器・腸内環境
    "食物繊維20gで腸内細菌叢が変化する3日間プロトコル",
    "難消化性デキストリン摂取による食後血糖スパイク抑制手順",
    "酪酸産生菌を増やす短鎖脂肪酸前駆体の摂取プロトコル",
    "腸内pH調整のためのオリゴ糖摂取と便性改善手順",
    "グルタミン15gで腸粘膜バリア機能を回復させる3日プログラム",
    # 血糖・代謝
    "食事順序変更による食後血糖値20%低下プロトコル",
    "クロム摂取とインスリン感受性改善の3日間実施手順",
    "マグネシウム400mgで空腹時血糖を下げる摂取タイムライン",
    "αリポ酸300mgによるミトコンドリア機能最適化手順",
    "シナモン1gの血糖降下作用を最大化する摂取プロトコル",
    # 睡眠・概日リズム
    "トリプトファン500mgからセロトニン・メラトニン合成を促す3日手順",
    "マグネシウムグリシネート400mgで睡眠の深さを変える摂取プログラム",
    "グリシン3gの体温降下作用を利用した入眠時間短縮プロトコル",
    "L-テアニン200mgで睡眠α波を増加させる就寝前ルーティン",
    "ビタミンB6投与によるメラトニン合成量を増加させる手順",
    # 炎症・抗酸化
    "EPA+DHA 2gで炎症性サイトカインを3日で抑制するプロトコル",
    "クルクミン500mg+ピペリン20mgの生体利用率最大化手順",
    "ビタミンC 500mgの食事前後タイミングと抗酸化能向上手順",
    "ケルセチン500mgで肥満細胞からのヒスタミン放出を抑制するプロトコル",
    "レスベラトロール250mgのNF-κB阻害を最大化する摂取条件",
    # エネルギー・疲労
    "鉄10mgとビタミンC同時摂取でフェリチンレベルを変える手順",
    "CoQ10 100mgでATP産生を最大化するユビキノール摂取プロトコル",
    "ビタミンB12 1000μgで神経伝導速度を改善する3日手順",
    "L-カルニチン2gで脂肪酸β酸化を促進する摂取タイムライン",
    "クレアチン5gのローディングなしで筋内貯蔵量を増やす3日手順",
    # 水分・電解質
    "ナトリウム・カリウム比2:1の電解質補給で細胞内外液を最適化する手順",
    "体重×35mlの水分補給で血漿浸透圧を正常化する3日プロトコル",
    "マグネシウムと一緒にカリウムを摂取して筋クランプを解消する手順",
    # 免疫
    "亜鉛30mgで樹状細胞活性を高める3日間プロトコル",
    "ビタミンD 2000IUで自然免疫の第一線応答を変える摂取手順",
    "プロバイオティクス100億CFUで分泌型IgA産生を促す3日プログラム",
    "ベータグルカン500mgでマクロファージ活性化を促すタイムライン",
    # 筋肉・回復
    "BCAA 5gの運動前後タイミングで筋タンパク合成を最大化する手順",
    "HMB 3gで筋タンパク分解を抑制する3日間プロトコル",
    "L-シトルリン6gで一酸化窒素産生を増加させる摂取手順",
    "ホエイプロテイン20gの摂取タイミングと筋合成シグナル最適化",
    # 精神・集中
    "チロシン500mgでドーパミン・ノルアドレナリン合成を促す手順",
    "ホスファチジルセリン200mgで記憶力変化を体感する3日プロトコル",
    "コリン600mgでアセチルコリン産生量を増やす摂取タイムライン",
    "ライオンズメイン猿頭菸350mgでNGF産生を促す3日手順",
    # ホルモン・内分泌
    "亜鉛+マグネシウムの同時摂取でテストステロン産生を促す手順",
    "インドール-3-カルビノール200mgでエストロゲン代謝を変える3日手順",
    "アシュワガンダ300mgでコルチゾール値を下げる3日間プロトコル",
    "ロディオラ 200mgでHPA軸の反応性を変える摂取手順",
    # 皮膚・コラーゲン
    "ビタミンC500mgとグリシン5gでコラーゲン合成を増加させる手順",
    "シリカ10mgで皮膚バリア機能の水分保持を改善する3日プロトコル",
    # 骨・ミネラル
    "カルシウム500mg+ビタミンD+ビタミンK2の骨吸収最大化プロトコル",
    "ケイ酸とコラーゲンペプチドの組み合わせで骨密度変化を促す手順",
    # 特殊プロトコル
    "間欠的断食16:8で自食作用を誘導する3日間移行プロトコル",
    "食前酢大さじ1杯で胃酸分泌と消化酵素活性を最大化する手順",
]

# =========================
# Claude APIコール
# =========================

def call_claude(system: str, user: str, temperature: float = 0.5) -> str:
    """ストリーミングでClaudeを呼び出し、完全な応答テキストを返す。"""
    stream = client.messages.stream(
        model=MODEL,
        max_tokens=8000,
        temperature=temperature,
        thinking={"type": "adaptive"},
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    with stream as s:
        return s.get_final_message().content[-1].text


# =========================
# 品質評価
# =========================

def score_article(text: str) -> dict:
    """
    記事を7項目で評価しスコアと詳細を返す。
    Returns: {"total": float, "details": dict, "violations": list}
    """
    response = call_claude(
        NUTRITION_DOCTRINE,
        text + """

以下の7項目を各10点満点で評価してください。
必ず「項目名: X/10」の形式で出力してください。

再現性: ?/10    （手順が誰でも再現できるか）
具体性: ?/10    （数値・食品名・時間が明確か）
因果説明: ?/10  （すべての記述に因果関係があるか）
3日実現性: ?/10 （3日以内に体感できる内容か）
客観性: ?/10    （主観表現が排除されているか）
安全性: ?/10    （禁忌・リスクが明記されているか）
読者価値: ?/10  （note読者が500円払う価値があるか）

各項目の後に1行の評価コメントと、違反事項があれば「違反: 〇〇」として記してください。""",
        temperature=0.2,
    )

    scores_raw = re.findall(r"(\d+)/10", response)
    keys = ["再現性", "具体性", "因果説明", "3日実現性", "客観性", "安全性", "読者価値"]

    if len(scores_raw) < 7:
        return {"total": -999.0, "details": {}, "violations": ["スコア解析失敗"]}

    details = {k: int(v) for k, v in zip(keys, scores_raw[:7])}

    weights = {
        "再現性": 2.0,
        "具体性": 2.0,
        "因果説明": 2.0,
        "3日実現性": 1.5,
        "客観性": 1.5,
        "安全性": 1.5,
        "読者価値": 1.2,
    }
    total = sum(details[k] * weights[k] for k in keys)

    # 違反の抽出
    violations = re.findall(r"違反[：:]\s*([^\n]+)", response)

    # 致命的違反のペナルティ
    if details["客観性"] < 5:
        total -= 200  # 主観表現は致命的
    if details["因果説明"] < 5:
        total -= 200  # 因果関係なしは致命的
    if details["安全性"] < 5:
        total -= 150  # 安全性欠如は重大

    return {"total": total, "details": details, "violations": violations}


# =========================
# 記事改善パス
# =========================

def enforce_causality(text: str) -> str:
    """すべての記述を因果関係構造に変換する。"""
    return call_claude(
        NUTRITION_DOCTRINE,
        text + """

以下の手順で因果関係を強化してください:
1. 主観表現を特定し、すべて削除する
2. 「〇〇を摂取する」だけの記述を「〇〇を摂取する → 〇〇酵素が活性化される → その結果〇〇が体感できる」形式に変換する
3. 曖昧な量（適量・少々）を具体的なg/ml数値に置き換える
4. タイムライン（摂取後〇時間/〇日後）を各効果に追記する

修正した完全版を出力してください。""",
    )


def enforce_steps(text: str) -> str:
    """手順を番号付きの具体的なステップに変換する。"""
    return call_claude(
        NUTRITION_DOCTRINE,
        text + """

3日間プロトコルセクションを以下の形式に完全変換してください:

### Day N（フェーズ名）
**Step 1**: [時間帯] [食品名] [量：〇g/〇ml] を [調理/摂取方法]
　└ 理由: この操作により〇〇が〇〇されるため
**Step 2**: ...（続く）

各Stepに必ず「└ 理由:」を付けてください。
修正した完全版を出力してください。""",
    )


def enforce_timeline(text: str) -> str:
    """3日以内に生理学的に実現可能かを検証し修正する。"""
    return call_claude(
        NUTRITION_DOCTRINE,
        text + """

「作用機序」セクションを以下の観点で検証・修正してください:
1. 摂取から体感まで3日以内に生理学的に可能か確認する
2. 不可能な場合（例：骨密度変化は3日では不可能）は体感できる変化に修正する
3. 時系列を「摂取後〇分→〇時間後→〇日後」の形式で明示する
4. 関与する生理学的プロセスの名称を各段階に記載する

修正した完全版を出力してください。""",
    )


def optimize_for_note(text: str) -> str:
    """note.com向けにタイトル・見出し・有料パートを最適化する。"""
    return call_claude(
        NUTRITION_DOCTRINE,
        text + """

note.com有料記事として最適化してください:

1. タイトル: 数値を含む具体的なタイトルに変更（例「3日で体感できる〇〇プロトコル：〇〇を〇g摂取する手順」）
2. 無料公開パート（冒頭200文字程度）: 問題提起と「この記事でわかること」を箇条書き3点
3. 有料パート（〒マーク後）: Day 1〜3の完全プロトコル
4. タグ候補: note.comで検索されやすい5タグをリスト
5. 推奨価格: 300円/500円/1000円のどれが最適か理由とともに記載

最終出力形式:
---
【タイトル】
【タグ】
【推奨価格】
【無料部分】
---有料ここから---
【有料部分：完全プロトコル】
---""",
    )


# =========================
# 記事生成パイプライン
# =========================

def generate_article(topic: str, verbose: bool = True) -> dict:
    """
    単一トピックの記事を生成・最適化する。

    Returns:
        {
            "topic": str,
            "title": str,
            "content": str,
            "score": dict,
            "tags": list[str],
            "price": str,
            "generated_at": str,
        }
    """
    log = print if verbose else lambda *a, **kw: None

    log(f"\n{'='*60}")
    log(f"記事生成開始: {topic[:50]}...")
    log(f"{'='*60}\n")

    # Phase 1: 初稿生成
    log("[Phase 1] 初稿生成中...")
    draft = call_claude(
        NUTRITION_DOCTRINE,
        ARTICLE_TEMPLATE + f"\n\n以下のトピックで上記の必須構造に従って記事を書いてください:\n\n{topic}",
    )

    # Phase 2: 因果関係強化
    log("[Phase 2] 因果関係を強化中...")
    draft = enforce_causality(draft)

    # Phase 3: 手順の具体化
    log("[Phase 3] 手順を具体化中...")
    draft = enforce_steps(draft)

    # Phase 4: タイムライン検証
    log("[Phase 4] 3日タイムラインを検証中...")
    draft = enforce_timeline(draft)

    # Phase 5: 品質評価
    log("[Phase 5] 品質評価中...")
    score = score_article(draft)
    log(f"  品質スコア: {score['total']:.1f}")
    if score["violations"]:
        log(f"  違反事項: {', '.join(score['violations'])}")

    # Phase 6: 低品質なら追加リファイン
    if score["total"] < 80.0 or score["details"].get("客観性", 10) < 7:
        log("[Phase 6] 品質改善中（追加リファイン）...")
        violations_text = "\n".join(score["violations"]) if score["violations"] else "なし"
        draft = call_claude(
            NUTRITION_DOCTRINE,
            draft + f"""

品質評価の結果、以下の問題が検出されました:
スコア: {score['total']:.1f}
違反: {violations_text}
各スコア: {json.dumps(score['details'], ensure_ascii=False)}

上記の問題をすべて修正した完全版を出力してください。""",
        )
        # 再評価
        score = score_article(draft)
        log(f"  改善後スコア: {score['total']:.1f}")

    # Phase 7: note最適化
    log("[Phase 7] note.com向けに最適化中...")
    final = optimize_for_note(draft)

    # メタデータ抽出
    title_match = re.search(r"【タイトル】\s*(.+?)(?:\n|$)", final)
    tags_match = re.search(r"【タグ】\s*(.+?)(?:\n|$)", final)
    price_match = re.search(r"【推奨価格】\s*(.+?)(?:\n|$)", final)

    title = title_match.group(1).strip() if title_match else topic
    tags_raw = tags_match.group(1).strip() if tags_match else ""
    price = price_match.group(1).strip() if price_match else "500円"
    tags = [t.strip().lstrip("#") for t in re.split(r"[,、\s]+", tags_raw) if t.strip()]

    log(f"\n生成完了: {title}")
    log(f"品質スコア: {score['total']:.1f}")
    log(f"推奨価格: {price}\n")

    return {
        "topic": topic,
        "title": title,
        "content": final,
        "score": score,
        "tags": tags,
        "price": price,
        "generated_at": datetime.now().isoformat(),
    }


# =========================
# バッチ生成
# =========================

def batch_generate(
    n: int = 5,
    topics: Optional[list] = None,
    output_dir: str = "output_articles",
    start_index: int = 0,
) -> list:
    """
    N個の記事を順番に生成してJSONとテキストで保存する。

    Args:
        n: 生成する記事数
        topics: 指定トピックリスト（Noneの場合はTOPIC_BANKから選択）
        output_dir: 保存ディレクトリ
        start_index: TOPIC_BANKの開始インデックス

    Returns:
        生成した記事のメタデータリスト
    """
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # トピック選択
    if topics is None:
        end_idx = min(start_index + n, len(TOPIC_BANK))
        selected_topics = TOPIC_BANK[start_index:end_idx]
        # 足りない場合は先頭から補填
        if len(selected_topics) < n:
            selected_topics += TOPIC_BANK[: n - len(selected_topics)]
    else:
        selected_topics = topics[:n]

    results = []
    manifest_path = out_path / "manifest.json"

    # 既存マニフェスト読み込み
    if manifest_path.exists():
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)
    else:
        manifest = []

    for i, topic in enumerate(selected_topics):
        print(f"\n[{i+1}/{len(selected_topics)}] トピック: {topic[:60]}...")

        try:
            article = generate_article(topic)
            results.append(article)

            # テキストファイルとして保存
            safe_title = re.sub(r'[\\/:*?"<>|]', "_", article["title"])[:60]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_name = f"{timestamp}_{safe_title}.txt"
            file_path = out_path / file_name

            with open(file_path, "w", encoding="utf-8") as f:
                f.write(f"# {article['title']}\n\n")
                f.write(f"生成日時: {article['generated_at']}\n")
                f.write(f"推奨価格: {article['price']}\n")
                f.write(f"タグ: {', '.join(article['tags'])}\n")
                f.write(f"品質スコア: {article['score']['total']:.1f}\n")
                f.write("\n" + "=" * 60 + "\n\n")
                f.write(article["content"])

            # マニフェストに追記
            manifest.append(
                {
                    "file": file_name,
                    "title": article["title"],
                    "topic": article["topic"],
                    "price": article["price"],
                    "score": article["score"]["total"],
                    "tags": article["tags"],
                    "generated_at": article["generated_at"],
                }
            )

            print(f"  保存完了: {file_path}")

        except Exception as e:
            print(f"  エラー（{topic[:40]}）: {e}")
            results.append({"topic": topic, "error": str(e)})

    # マニフェスト保存
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"バッチ生成完了: {len([r for r in results if 'error' not in r])}/{len(selected_topics)} 件成功")
    print(f"出力先: {out_path.resolve()}")
    print(f"{'='*60}\n")

    return results


# =========================
# エントリーポイント
# =========================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="栄養記事自動生成システム")
    parser.add_argument(
        "--topic",
        type=str,
        help="生成するトピック（省略時はTOPIC_BANKから選択）",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=1,
        help="バッチ生成する記事数（デフォルト: 1）",
    )
    parser.add_argument(
        "--start",
        type=int,
        default=0,
        help="TOPIC_BANKの開始インデックス（デフォルト: 0）",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="output_articles",
        help="出力ディレクトリ（デフォルト: output_articles）",
    )
    args = parser.parse_args()

    if args.topic:
        # 単一記事生成
        article = generate_article(args.topic)
        out_path = Path(args.output)
        out_path.mkdir(parents=True, exist_ok=True)
        safe_title = re.sub(r'[\\/:*?"<>|]', "_", article["title"])[:60]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = out_path / f"{timestamp}_{safe_title}.txt"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(article["content"])
        print(f"\n記事を保存しました: {file_path}")
    else:
        # バッチ生成
        batch_generate(n=args.batch, start_index=args.start, output_dir=args.output)
