"""
AI Novel Writer — Claude Opus 4.6 powered novel generation system.

Generates award-quality mystery novels with:
- Evolutionary optimization across candidate plots
- Structural enforcement (hook, reversals, revelations)
- Multi-reader simulation (casual, mystery, emotional, editorial)
- Iterative refinement passes
"""

import re
import random
import sys
from typing import Optional
import anthropic

client = anthropic.Anthropic()
MODEL = "claude-opus-4-6"

# =========================
# Core writing doctrine
# =========================

CORE_DOCTRINE = """あなたは商業出版レベルのミステリー小説を書く専門家です。

【絶対禁止】
・ご都合主義（偶然による解決、後出し設定）
・メタ発言（読者への直接語りかけ）
・時系列・動機・因果の不整合

【絶対義務】
・全ての展開に明確な因果関係
・伏線は2つ以上設置し、必ず回収
・キャラクターの動機は欲望・恐怖・合理性で説明可能

違反を発見した場合：問題を特定→説明→修正→再出力"""

STRUCTURE_TEMPLATE = """【必須物語構造】
・冒頭3行：日常を破る異常事態の提示
・10%地点：主人公の明確な目的の確立
・30%地点：第一の反転（予想を裏切る展開）
・60%地点：半真相の開示（読者と主人公が半分だけ真実に近づく）
・90%地点：真の犯人・動機の完全開示
・結末：価値観の反転（始まりとは異なる世界の提示）"""


# =========================
# Streaming Claude calls
# =========================

def call_claude(system: str, user: str, temperature: float = 0.7) -> str:
    """Call Claude with streaming, return full response text."""
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
# Evaluation
# =========================

def evaluate(text: str) -> float:
    """Score a story candidate. Returns weighted score (higher = better)."""
    response = call_claude(
        CORE_DOCTRINE,
        text + """

以下の7項目を各10点満点で評価してください。必ず「項目名: X/10」の形式で出力してください。

論理性: ?/10
整合性: ?/10
因果関係: ?/10
感情的共鳴: ?/10
フック強度: ?/10
独自性: ?/10
商品性: ?/10

各項目の後に1行の評価コメントを付けてください。""",
        temperature=0.3,
    )

    scores = re.findall(r"(\d+)/10", response)
    if len(scores) < 7:
        return -999.0

    logic, consistency, causality, emotion, hook, novelty, market = [int(s) for s in scores[:7]]

    score = (
        causality * 2.0
        + hook * 2.0
        + logic * 1.5
        + consistency * 1.5
        + novelty * 1.5
        + market * 1.2
        + emotion * 1.0
    )

    # Bonus for balanced scores (no weak spots)
    all_scores = [logic, consistency, causality, emotion, hook, novelty, market]
    variance = max(all_scores) - min(all_scores)
    score += variance * 0.5

    # Fatal flaw detection
    flaw_check = call_claude(
        CORE_DOCTRINE,
        text + "\n\n致命的な欠陥（ご都合主義・矛盾・不整合）があれば具体的に指摘してください。なければ「問題なし」と答えてください。",
        temperature=0.2,
    )
    if "致命" in flaw_check or "ご都合" in flaw_check:
        score -= 300
    if "矛盾" in flaw_check and "問題なし" not in flaw_check:
        score -= 200

    return score


# =========================
# Refinement passes
# =========================

def enforce_structure(text: str) -> str:
    return call_claude(
        CORE_DOCTRINE,
        STRUCTURE_TEMPLATE + "\n\n以下のテキストを上記の構造に完全に適合させて再構成してください:\n\n" + text,
    )


def rebuild_hook(text: str) -> str:
    return call_claude(
        CORE_DOCTRINE,
        text + """

冒頭3行を以下の原則で書き直してください:
・1行目: 日常を完全に破壊する異常な事実の提示
・2行目: その異常さへの違和感・疑問の深化
・3行目: 読者が先を読まずにいられない未解決の謎

書き直した冒頭3行のみを先頭に置き、残りのテキストは変更なしで続けてください。""",
    )


def rebuild_plot(text: str) -> str:
    return call_claude(
        CORE_DOCTRINE,
        text + """

物語構造を以下の観点で再設計してください:
・因果関係の鎖を強化（すべての出来事に原因を）
・伏線の再配置（少なくとも3つの伏線と回収）
・トリックの再設計（より精緻で予想外の真相）

再設計した完全な物語を出力してください。""",
    )


def simulate_readers(text: str) -> str:
    return call_claude(
        CORE_DOCTRINE,
        text + """

以下4種類の読者の視点から同時評価し、各読者が「離脱する箇所」を特定して修正してください:

1. **飽きやすい読者**: テンポと興奮を重視、説明が続くと離脱
2. **推理読者**: 論理的整合性を重視、矛盾があれば即離脱
3. **感情読者**: キャラクターへの共感を重視、動機が薄いと離脱
4. **新人賞審査員**: 文学的完成度・独自性・商業性を評価

各読者の離脱ポイントを修正した完全版を出力してください。""",
    )


def compress_density(text: str) -> str:
    return call_claude(
        CORE_DOCTRINE,
        text + """

以下の基準で密度を最大化してください:
・冗長な説明の削除（1文でいえることを3文で言わない）
・受動的な表現を能動的に変換
・感情の「説明」を「描写」に変換

圧縮した完全版を出力してください。""",
    )


# =========================
# Evolutionary engine
# =========================

def evolve(structure: str, generations: int = 3, pop_size: int = 5) -> str:
    """Evolve a population of story candidates over multiple generations."""
    print(f"  初期集団 {pop_size} 個体を生成中...")

    mutations = [
        "冒頭フックを最大限に強化",
        "トリックをより精緻に再設計",
        "主人公の心理描写を深化",
        "結末の価値反転を強化",
        "全体の構造的圧縮",
    ]

    population = []
    for i in range(pop_size):
        candidate = call_claude(
            CORE_DOCTRINE,
            structure + "\n" + STRUCTURE_TEMPLATE + f"\n\nこの構造に基づいて完全な短編ミステリーを書いてください。個体番号{i+1}として、独自の切り口で。",
        )
        population.append(candidate)
        print(f"    個体 {i+1}/{pop_size} 生成完了")

    for gen in range(generations):
        print(f"  世代 {gen+1}/{generations}: 評価中...")

        scored = sorted(
            [(evaluate(p), p) for p in population],
            reverse=True,
        )
        elites = [p for _, p in scored[:max(2, len(scored) // 2)]]

        print(f"    最高スコア: {scored[0][0]:.1f}")

        next_gen = list(elites)

        # Crossbreeding top elites
        if len(elites) >= 2:
            for i in range(min(2, len(elites) - 1)):
                child = call_claude(
                    CORE_DOCTRINE,
                    elites[i] + "\n\n---\n\n" + elites[i + 1] + "\n\n上記2つの物語の最良の要素を融合し、より優れた1つの物語を作ってください。",
                )
                next_gen.append(child)

        # Directed mutations
        for elite in elites[:2]:
            mutation = random.choice(mutations)
            mutant = call_claude(
                CORE_DOCTRINE,
                elite + f"\n\n上記の物語を「{mutation}」という方向で変異・改善してください。",
            )
            next_gen.append(mutant)

        # Fresh candidates to maintain diversity
        fresh = call_claude(
            CORE_DOCTRINE,
            structure + "\n" + STRUCTURE_TEMPLATE + "\n\n全く新しい視点で、強烈なフックを持つ短編ミステリーを書いてください。",
        )
        next_gen.append(fresh)

        population = next_gen

    final_scored = sorted(
        [(evaluate(p), p) for p in population],
        reverse=True,
    )
    print(f"  進化完了。最終スコア: {final_scored[0][0]:.1f}")
    return final_scored[0][1]


# =========================
# Episode generation
# =========================

def generate_episode(episode_outline: str) -> str:
    """Generate and refine a single episode."""
    print("  [1/5] 進化エンジン起動...")
    text = evolve(episode_outline)

    print("  [2/5] 構造強制...")
    text = enforce_structure(text)

    print("  [3/5] フック再構築...")
    text = rebuild_hook(text)

    print("  [4/5] プロット再設計...")
    text = rebuild_plot(text)

    print("  [5/5] 読者シミュレーション...")
    text = simulate_readers(text)

    return text


# =========================
# Final optimization
# =========================

def final_optimize(text: str) -> str:
    print("最終最適化: タイトル...")
    text = call_claude(CORE_DOCTRINE, text + "\n\n最も商業的インパクトのあるタイトルを考え、冒頭に「タイトル: 〇〇」として追加してください。")

    print("最終最適化: ログライン...")
    text = call_claude(CORE_DOCTRINE, text + "\n\n50文字以内の強力なログライン（あらすじ1行）を「ログライン: 〇〇」として追加してください。")

    print("最終最適化: 新人賞対応...")
    text = call_claude(
        CORE_DOCTRINE,
        text + "\n\n新人賞審査員の目線で最終チェックし、文学的完成度を高めてください。特に冒頭と結末に注力してください。",
    )

    return text


# =========================
# Main generation pipeline
# =========================

def generate_novel(theme: str, num_episodes: int = 3) -> str:
    """
    Full novel generation pipeline.

    Args:
        theme: The theme or genre for the novel (e.g., "新人賞受賞ミステリー")
        num_episodes: Number of episodes/chapters (default 3 for demo; set to 10 for full novel)

    Returns:
        Complete novel text
    """
    print(f"\n{'='*60}")
    print(f"小説執筆AI 起動")
    print(f"テーマ: {theme}")
    print(f"{'='*60}\n")

    # Phase 1: Concept development
    print("[Phase 1] 企画立案中...")
    concept = call_claude(
        CORE_DOCTRINE,
        f"テーマ「{theme}」を元に、新人賞を狙える独自性のある短編ミステリーの企画書を作成してください。"
        "登場人物、舞台設定、核心となるトリック、テーマを含めてください。",
    )

    # Phase 2: Structure design
    print("[Phase 2] 全体構造設計中...")
    structure = call_claude(
        CORE_DOCTRINE,
        concept + "\n\n" + STRUCTURE_TEMPLATE + "\n\nこの企画を上記の必須構造に従って詳細なプロット設計書に変換してください。",
    )

    # Phase 3: Episode breakdown
    print(f"[Phase 3] {num_episodes}話分割中...")
    episodes_raw = call_claude(
        CORE_DOCTRINE,
        structure + f"\n\nこのプロットを{num_episodes}つの章・エピソードに分割し、各章のあらすじを箇条書きで出力してください。形式: 「第N章: 〇〇」",
    )

    episodes = [
        line.strip()
        for line in episodes_raw.split("\n")
        if line.strip() and ("章" in line or "話" in line or "第" in line)
    ][:num_episodes]

    if not episodes:
        episodes = [f"第{i+1}章" for i in range(num_episodes)]

    print(f"  {len(episodes)}章を検出")

    # Phase 4: Generate each episode
    novel_parts = []
    for i, ep in enumerate(episodes):
        print(f"\n[Phase 4-{i+1}/{len(episodes)}] エピソード生成: {ep[:40]}...")
        part = generate_episode(ep)
        novel_parts.append(part)

    # Phase 5: Final assembly
    print("\n[Phase 5] 最終統合中...")
    full_novel = "\n\n" + "=" * 40 + "\n\n".join(novel_parts)

    # Phase 6: Final optimization
    print("\n[Phase 6] 最終最適化中...")
    final = final_optimize(full_novel)

    print(f"\n{'='*60}")
    print("生成完了！")
    print(f"{'='*60}\n")

    return final


# =========================
# Entry point
# =========================

if __name__ == "__main__":
    theme = sys.argv[1] if len(sys.argv) > 1 else "新人賞受賞ミステリー"

    # num_episodes=3 for a demo; increase to 10 for a full novel
    novel = generate_novel(theme, num_episodes=3)

    output_path = "output_novel.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(novel)

    print(f"小説を '{output_path}' に保存しました。\n")
    print(novel[:2000] + ("\n...(続く)" if len(novel) > 2000 else ""))
