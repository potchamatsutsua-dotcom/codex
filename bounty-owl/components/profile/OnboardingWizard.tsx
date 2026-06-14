"use client";

import { useState, useTransition } from "react";
import { Check, ChevronRight, ChevronLeft, Globe, Languages, Layers, Award, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContestCategory, ExperienceLevel } from "@/types";

const COUNTRIES = [
  { code: "JP", name: "日本", flag: "🇯🇵" },
  { code: "US", name: "アメリカ", flag: "🇺🇸" },
  { code: "GB", name: "イギリス", flag: "🇬🇧" },
  { code: "DE", name: "ドイツ", flag: "🇩🇪" },
  { code: "FR", name: "フランス", flag: "🇫🇷" },
  { code: "BR", name: "ブラジル", flag: "🇧🇷" },
  { code: "AU", name: "オーストラリア", flag: "🇦🇺" },
  { code: "CA", name: "カナダ", flag: "🇨🇦" },
  { code: "KR", name: "韓国", flag: "🇰🇷" },
  { code: "CN", name: "中国", flag: "🇨🇳" },
];

const LANGUAGES = [
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
];

const CATEGORIES: { id: ContestCategory; label: string; emoji: string; description: string }[] = [
  { id: "novel", label: "小説", emoji: "📚", description: "小説・文学賞" },
  { id: "illustration", label: "イラスト", emoji: "🎨", description: "イラスト・漫画" },
  { id: "programming", label: "プログラミング", emoji: "💻", description: "ハッカソン・コーディング" },
  { id: "ai", label: "AI", emoji: "🤖", description: "AI・機械学習" },
  { id: "photography", label: "写真", emoji: "📷", description: "写真コンテスト" },
  { id: "video", label: "動画", emoji: "🎬", description: "動画・映像" },
  { id: "design", label: "デザイン", emoji: "✏️", description: "グラフィック・UI" },
];

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; description: string }[] = [
  { id: "beginner", label: "初心者", description: "始めて3年未満" },
  { id: "intermediate", label: "中級者", description: "3〜7年の経験" },
  { id: "advanced", label: "上級者", description: "7年以上の経験" },
  { id: "professional", label: "プロ", description: "職業として従事" },
];

interface OnboardingData {
  country: string;
  languages: string[];
  categories: ContestCategory[];
  experience_level: ExperienceLevel;
  skills: string;
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => Promise<void>;
}

const STEPS = [
  { title: "居住国", icon: Globe },
  { title: "使用言語", icon: Languages },
  { title: "カテゴリ", icon: Layers },
  { title: "経験レベル", icon: Award },
  { title: "スキル・実績", icon: Sparkles },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<OnboardingData>({
    country: "",
    languages: [],
    categories: [],
    experience_level: "beginner",
    skills: "",
  });

  const canProceed = () => {
    if (step === 0) return data.country !== "";
    if (step === 1) return data.languages.length > 0;
    if (step === 2) return data.categories.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    startTransition(async () => {
      await onComplete(data);
    });
  };

  const toggle = <T extends string>(arr: T[], item: T, setter: (v: T[]) => void) => {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🦉</span>
          <h1 className="text-2xl font-black mb-1">プロフィール設定</h1>
          <p className="text-muted-foreground text-sm">AIがあなたに最適なコンテストを見つけます</p>
        </div>

        {/* Step progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                i < step ? "bg-amber-500 text-white"
                : i === step ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                : "bg-muted text-muted-foreground"
              )}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-6 mx-1 rounded-full transition-all", i < step ? "bg-amber-500" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border shadow-sm p-6">
          {/* Step title */}
          <h2 className="text-base font-black mb-4 flex items-center gap-2">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="h-4 w-4 text-amber-500" />; })()}
            {STEPS[step].title}
          </h2>

          {/* Step 0: Country */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-2">
              {COUNTRIES.map((c) => (
                <button key={c.code} onClick={() => setData((p) => ({ ...p, country: c.code }))}
                  className={cn("flex items-center gap-2.5 p-3 rounded-xl border text-sm transition-all text-left",
                    data.country === c.code ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 font-semibold text-amber-700 dark:text-amber-300" : "hover:bg-muted")}>
                  <span className="text-xl">{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Languages */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button key={l.code}
                  onClick={() => toggle(data.languages, l.code, (v) => setData((p) => ({ ...p, languages: v })))}
                  className={cn("flex items-center gap-2.5 p-3 rounded-xl border text-sm transition-all text-left",
                    data.languages.includes(l.code) ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 font-semibold text-amber-700 dark:text-amber-300" : "hover:bg-muted")}>
                  <span className="text-xl">{l.flag}</span>
                  <span className="flex-1">{l.name}</span>
                  {data.languages.includes(l.code) && <Check className="h-3.5 w-3.5 text-amber-500" />}
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Categories */}
          {step === 2 && (
            <div className="grid grid-cols-1 gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat.id}
                  onClick={() => toggle(data.categories, cat.id, (v) => setData((p) => ({ ...p, categories: v })))}
                  className={cn("flex items-center gap-3 p-3 rounded-xl border text-sm transition-all text-left",
                    data.categories.includes(cat.id) ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : "hover:bg-muted")}>
                  <span className="text-2xl">{cat.emoji}</span>
                  <div className="flex-1">
                    <div className={cn("font-semibold", data.categories.includes(cat.id) && "text-amber-700 dark:text-amber-300")}>{cat.label}</div>
                    <div className="text-xs text-muted-foreground">{cat.description}</div>
                  </div>
                  {data.categories.includes(cat.id) && <Check className="h-4 w-4 text-amber-500 shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Experience */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <button key={level.id}
                  onClick={() => setData((p) => ({ ...p, experience_level: level.id }))}
                  className={cn("flex flex-col items-start p-4 rounded-xl border text-sm transition-all text-left",
                    data.experience_level === level.id ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : "hover:bg-muted")}>
                  <div className={cn("font-bold", data.experience_level === level.id && "text-amber-700 dark:text-amber-300")}>{level.label}</div>
                  <div className="text-xs text-muted-foreground">{level.description}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Skills */}
          {step === 4 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                過去の受賞歴、代表作、資格など（任意）
              </p>
              <textarea
                value={data.skills}
                onChange={(e) => setData((p) => ({ ...p, skills: e.target.value }))}
                placeholder="例：第3回〇〇小説賞受賞、TOEIC 900点、GitHub Stars 500以上..."
                className="w-full h-28 p-3 rounded-xl border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-5">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                <ChevronLeft className="h-4 w-4" />
                戻る
              </Button>
            )}
            <Button
              variant="gradient"
              onClick={handleNext}
              disabled={!canProceed() || isPending}
              className="flex-1 font-bold"
            >
              {step === STEPS.length - 1
                ? isPending ? "設定中..." : "完了 🎉"
                : (<>次へ <ChevronRight className="h-4 w-4" /></>)
              }
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          あとでプロフィール設定からいつでも変更できます
        </p>
      </div>
    </div>
  );
}
