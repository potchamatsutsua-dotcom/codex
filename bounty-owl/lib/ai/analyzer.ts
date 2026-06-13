"use server";

import Anthropic from "@anthropic-ai/sdk";
import type { Contest, AIAnalysisResult } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzeContest(contest: Contest): Promise<AIAnalysisResult> {
  const prompt = `You are an expert contest analyst. Analyze the following contest and provide a structured JSON response.

Contest Details:
- Title: ${contest.title}
- Category: ${contest.category}
- Description: ${contest.description ?? "N/A"}
- Prize: ${contest.prize_amount ? `${contest.prize_amount} ${contest.currency}` : "Unknown"}
- Deadline: ${contest.deadline ?? "Unknown"}
- Organizer: ${contest.organizer ?? "Unknown"}
- Estimated Entries: ${contest.estimated_entries ?? "Unknown"}
- Country: ${contest.country ?? "International"}
- Languages: ${contest.languages?.join(", ") ?? "Unknown"}
- Tags: ${contest.tags?.join(", ") ?? "None"}

Respond ONLY with valid JSON in this exact format:
{
  "difficulty": <0-100 integer, higher = harder to win>,
  "competition": <0-100 integer, higher = more competitors>,
  "quality": <0-100 integer, higher = more prestigious>,
  "recommended_for": [<array of strings: categories like "novel", "beginner", "professional", etc.>],
  "summary": "<2-3 sentence Japanese summary of this contest and why it's noteworthy>",
  "success_patterns": "<2-3 sentence Japanese description of patterns seen in past winners>",
  "tags": [<array of relevant Japanese/English tags, max 6>]
}`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  const result = JSON.parse(jsonMatch[0]) as AIAnalysisResult;
  return result;
}

export async function generateStrategyReport(
  contest: Contest,
  userProfile: { skills: string[]; experience_level: string; categories: string[] }
): Promise<string> {
  const prompt = `あなたはコンテスト攻略の専門家です。以下のコンテストに対して、このユーザーが勝利するための詳細な攻略レポートを作成してください。

コンテスト情報:
- タイトル: ${contest.title}
- カテゴリ: ${contest.category}
- 説明: ${contest.description ?? "N/A"}
- 賞金: ${contest.prize_amount ? `${contest.prize_amount} ${contest.currency}` : "不明"}
- 締切: ${contest.deadline ?? "不明"}

ユーザー情報:
- スキル: ${userProfile.skills.join(", ") || "未登録"}
- 経験レベル: ${userProfile.experience_level}
- カテゴリ: ${userProfile.categories.join(", ") || "未登録"}

以下の形式で日本語の攻略レポートを作成してください（Markdown形式）:

## この賞で評価される傾向
[3-4箇条書き]

## 過去受賞者の共通点
[3-4箇条書き]

## 落選しやすい要素
[3-4箇条書き]

## あなたへの作品改善ポイント
[ユーザーのスキル・経験レベルに基づいた具体的なアドバイス 3-4箇条書き]

## 戦略的タイムライン
[締切までの逆算スケジュール]`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  return content.text;
}
