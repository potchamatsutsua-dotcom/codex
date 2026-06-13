"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    country: "",
    languages: [],
    categories: [],
    experience_level: "beginner",
    skills: "",
  });

  const canProceed = () => {
    switch (step) {
      case 0: return data.country !== "";
      case 1: return data.languages.length > 0;
      case 2: return data.categories.length > 0;
      case 3: return data.experience_level !== "";
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        await onComplete(data);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const toggleLanguage = (code: string) => {
    setData((prev) => ({
      ...prev,
      languages: prev.languages.includes(code)
        ? prev.languages.filter((l) => l !== code)
        : [...prev.languages, code],
    }));
  };

  const toggleCategory = (id: ContestCategory) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🦉</span>
          <h1 className="text-2xl font-bold mb-2">プロフィール設定</h1>
          <p className="text-muted-foreground">AIがあなたに最適なコンテストを見つけます</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-8 mx-1", i < step ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="h-5 w-5 text-amber-500" />; })()}
            {STEPS[step].title}
          </h2>

          {step === 0 && (
            <div className="grid grid-cols-2 gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setData((prev) => ({ ...prev, country: c.code }))}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border text-sm transition-all",
                    data.country === c.code
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="text-xl">{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => toggleLanguage(l.code)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border text-sm transition-all",
                    data.languages.includes(l.code)
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="text-xl">{l.flag}</span>
                  <span>{l.name}</span>
                  {data.languages.includes(l.code) && (
                    <Check className="h-3.5 w-3.5 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border text-sm transition-all text-left",
                    data.categories.includes(cat.id)
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <div>
                    <div className="font-medium">{cat.label}</div>
                    <div className="text-xs text-muted-foreground">{cat.description}</div>
                  </div>
                  {data.categories.includes(cat.id) && (
                    <Check className="h-4 w-4 ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setData((prev) => ({ ...prev, experience_level: level.id }))}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border text-sm transition-all text-left",
                    data.experience_level === level.id
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  )}
                >
                  <div>
                    <div className="font-medium">{level.label}</div>
                    <div className="text-xs text-muted-foreground">{level.description}</div>
                  </div>
                  {data.experience_level === level.id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                過去の受賞歴、代表作、資格など自由に入力してください（任意）
              </p>
              <textarea
                value={data.skills}
                onChange={(e) => setData((prev) => ({ ...prev, skills: e.target.value }))}
                placeholder="例：第3回〇〇小説賞受賞、Twitterフォロワー10万人、GitHub Stars 500以上、TOEIC 900点..."
                className="w-full h-32 p-3 rounded-xl border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4" />
                戻る
              </Button>
            )}
            <Button
              variant="gradient"
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="flex-1"
            >
              {step === STEPS.length - 1 ? (
                isSubmitting ? "設定中..." : "完了 🎉"
              ) : (
                <>
                  次へ
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
