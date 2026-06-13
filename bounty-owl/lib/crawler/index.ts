"use server";

import { supabaseAdmin } from "@/lib/db/client";
import { analyzeContest } from "@/lib/ai/analyzer";
import type { Contest } from "@/types";

interface CrawlSource {
  name: string;
  url: string;
  category: string;
}

const CONTEST_SOURCES: CrawlSource[] = [
  { name: "文学賞の窓", url: "https://bungakusho.info", category: "novel" },
  { name: "コンテスト一覧", url: "https://contest.jp", category: "illustration" },
  { name: "Kaggle", url: "https://kaggle.com/competitions", category: "programming" },
  { name: "Devpost", url: "https://devpost.com/hackathons", category: "programming" },
  { name: "Lakey", url: "https://lakey.jp", category: "photography" },
];

async function crawlWithFirecrawl(url: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return "";

  try {
    const response = await fetch("https://api.firecrawl.dev/v0/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url, pageOptions: { onlyMainContent: true } }),
    });

    if (!response.ok) return "";
    const data = (await response.json()) as { data?: { markdown?: string } };
    return data.data?.markdown ?? "";
  } catch {
    return "";
  }
}

async function extractContestsFromContent(
  content: string,
  source: CrawlSource
): Promise<Partial<Contest>[]> {
  if (!content) return [];

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a contest data extractor. From the following web content, extract all contest/competition listings.

Source: ${source.name} (${source.url})
Category hint: ${source.category}

Content:
${content.slice(0, 8000)}

Extract contests and return ONLY valid JSON array. Each contest object should have:
{
  "title": string,
  "description": string (optional),
  "prize_amount": number (optional, in original currency),
  "currency": string (e.g., "JPY", "USD"),
  "deadline": string (ISO date, optional),
  "official_url": string,
  "organizer": string (optional),
  "estimated_entries": number (optional),
  "country": string (2-letter ISO code, optional),
  "languages": string[] (e.g., ["ja", "en"])
}

Return [] if no contests found. Return ONLY the JSON array, no other text.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const contests = JSON.parse(jsonMatch[0]) as Partial<Contest>[];
    return contests.map((c) => ({ ...c, category: source.category, source: source.name }));
  } catch {
    return [];
  }
}

export async function runCrawler(): Promise<{
  found: number;
  added: number;
  errors: string[];
}> {
  const logStart = await supabaseAdmin
    .from("crawler_logs")
    .insert({ source: "all" })
    .select()
    .single();

  let totalFound = 0;
  let totalAdded = 0;
  const errors: string[] = [];

  for (const source of CONTEST_SOURCES) {
    try {
      const content = await crawlWithFirecrawl(source.url);
      const extracted = await extractContestsFromContent(content, source);
      totalFound += extracted.length;

      for (const contest of extracted) {
        if (!contest.title || !contest.official_url) continue;

        const { data: existing } = await supabaseAdmin
          .from("contests")
          .select("id")
          .eq("official_url", contest.official_url)
          .single();

        if (existing) continue;

        const { data: newContest } = await supabaseAdmin
          .from("contests")
          .insert({
            title: contest.title,
            description: contest.description,
            category: contest.category ?? source.category,
            country: contest.country,
            languages: contest.languages ?? [],
            prize_amount: contest.prize_amount,
            currency: contest.currency ?? "JPY",
            deadline: contest.deadline,
            official_url: contest.official_url,
            organizer: contest.organizer,
            estimated_entries: contest.estimated_entries,
            status: "active",
            tags: [],
            eligibility: {},
            source: source.name,
          })
          .select()
          .single();

        if (newContest) {
          totalAdded++;

          try {
            const analysis = await analyzeContest(newContest as Contest);
            await supabaseAdmin.from("contest_analysis").insert({
              contest_id: newContest.id,
              difficulty_score: analysis.difficulty,
              competition_score: analysis.competition,
              quality_score: analysis.quality,
              ai_summary: analysis.summary,
              success_patterns: analysis.success_patterns,
              recommended_for: analysis.recommended_for,
              tags: analysis.tags,
            });
          } catch (analysisError) {
            errors.push(`Analysis failed for ${newContest.id}: ${String(analysisError)}`);
          }
        }
      }
    } catch (sourceError) {
      errors.push(`Crawl failed for ${source.name}: ${String(sourceError)}`);
    }
  }

  if (logStart.data) {
    await supabaseAdmin
      .from("crawler_logs")
      .update({
        contests_found: totalFound,
        contests_added: totalAdded,
        errors: errors.length ? errors : null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", logStart.data.id);
  }

  return { found: totalFound, added: totalAdded, errors };
}
