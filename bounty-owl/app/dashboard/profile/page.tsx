"use client";

import { useState, useEffect } from "react";
import { Save, User, Languages, Layers, Award, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Profile, User as UserType } from "@/types";

const CATEGORIES = [
  { id: "novel", label: "小説", emoji: "📚" },
  { id: "illustration", label: "イラスト", emoji: "🎨" },
  { id: "programming", label: "プログラミング", emoji: "💻" },
  { id: "ai", label: "AI", emoji: "🤖" },
  { id: "photography", label: "写真", emoji: "📷" },
  { id: "video", label: "動画", emoji: "🎬" },
  { id: "design", label: "デザイン", emoji: "✏️" },
];

const LANGUAGES = [
  { code: "ja", name: "日本語" },
  { code: "en", name: "English" },
  { code: "zh", name: "中文" },
  { code: "ko", name: "한국어" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
];

const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "初心者" },
  { id: "intermediate", label: "中級者" },
  { id: "advanced", label: "上級者" },
  { id: "professional", label: "プロ" },
];


export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [skills, setSkills] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user: UserType; profile: Profile }) => {
        setUser(data.user);
        setProfile(data.profile);
        setName(data.user?.name ?? "");
        setBio(data.profile?.bio ?? "");
        setPortfolioUrl(data.profile?.portfolio_url ?? "");
        setGithubUrl(data.profile?.github_url ?? "");
        setWebsiteUrl(data.profile?.website_url ?? "");
        setSelectedCategories(data.profile?.categories ?? []);
        setSelectedLanguages(data.profile?.languages ?? ["ja"]);
        setExperienceLevel(data.profile?.experience_level ?? "beginner");
        setSkills((data.profile?.skills ?? []).join(", "));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          portfolio_url: portfolioUrl,
          github_url: githubUrl,
          website_url: websiteUrl,
          categories: selectedCategories,
          languages: selectedLanguages,
          experience_level: experienceLevel,
          skills: skills.split(/[,、\n]/).map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      toast({ title: "プロフィールを更新しました ✓" });
    } catch {
      toast({ title: "エラーが発生しました", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggle = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">プロフィール設定</h1>
        <p className="text-muted-foreground mt-1">プロフィールを充実させてAIの精度を上げましょう</p>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-amber-500" />
            基本情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">ニックネーム</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="賞金ハンター太郎"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="bio">自己紹介</Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="得意なジャンルや活動について..."
              className="w-full mt-1.5 h-20 p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <Label htmlFor="portfolio">ポートフォリオURL</Label>
            <Input
              id="portfolio"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://your-portfolio.com"
              className="mt-1.5"
              type="url"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/you"
                className="mt-1.5"
                type="url"
              />
            </div>
            <div>
              <Label htmlFor="website">ウェブサイト</Label>
              <Input
                id="website"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://your-site.com"
                className="mt-1.5"
                type="url"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-500" />
            カテゴリ
          </CardTitle>
          <CardDescription>応募したいジャンルを選択（複数可）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggle(selectedCategories, cat.id, setSelectedCategories)}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all text-left",
                  selectedCategories.includes(cat.id)
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted"
                )}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-4 w-4 text-amber-500" />
            使用言語
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => toggle(selectedLanguages, lang.code, setSelectedLanguages)}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-sm transition-all",
                  selectedLanguages.includes(lang.code)
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted"
                )}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            経験レベル
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setExperienceLevel(level.id)}
                className={cn(
                  "p-3 rounded-lg border text-sm font-medium transition-all",
                  experienceLevel === level.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            スキル・実績
          </CardTitle>
          <CardDescription>受賞歴、資格、代表作など（コンマ区切りで入力）</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="例：第3回〇〇小説賞受賞、TOEIC 900点、GitHub Stars 500以上..."
            className="w-full h-24 p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </CardContent>
      </Card>

      <Button
        variant="gradient"
        size="lg"
        className="w-full"
        onClick={handleSave}
        disabled={isSaving}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "保存中..." : "プロフィールを保存"}
      </Button>
    </div>
  );
}
