import { Suspense } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ContestCard } from "@/components/contest/ContestCard";
import { requireAuth } from "@/lib/auth/server";
import { getContests } from "@/lib/db/contests";
import { getCategoryLabel } from "@/lib/utils";
import type { FilterCategory, SortOption } from "@/types";

const CATEGORIES: FilterCategory[] = ["all", "novel", "illustration", "programming", "ai", "photography"];
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "deadline", label: "締切順" },
  { value: "prize", label: "賞金順" },
  { value: "recommended", label: "おすすめ順" },
];

interface SearchParams {
  category?: string;
  sort?: string;
  q?: string;
  page?: string;
}

export default async function ContestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const authUser = await requireAuth();

  const category = (searchParams.category as FilterCategory) ?? "all";
  const sort = (searchParams.sort as SortOption) ?? "deadline";
  const search = searchParams.q ?? "";
  const page = parseInt(searchParams.page ?? "1");
  const limit = 18;
  const offset = (page - 1) * limit;

  const { contests, count } = await getContests({
    category,
    sort,
    limit,
    offset,
    userId: authUser.id,
    search,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">コンテスト一覧</h1>
        <p className="text-muted-foreground mt-1">
          {count ?? 0}件のアクティブなコンテスト
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={search}
            placeholder="コンテストを検索..."
            className="w-full h-10 pl-9 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {Object.entries(searchParams)
            .filter(([k]) => k !== "q")
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
        </form>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SORT_OPTIONS.map((opt) => (
            <a
              key={opt.value}
              href={`?${new URLSearchParams({ ...searchParams, sort: opt.value })}`}
              className={`shrink-0 flex items-center gap-1 px-3 h-10 rounded-lg border text-sm transition-colors ${
                sort === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {opt.label}
            </a>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <a
            key={cat}
            href={`?${new URLSearchParams({ ...searchParams, category: cat })}`}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {getCategoryLabel(cat)}
          </a>
        ))}
      </div>

      {/* Contest grid */}
      {contests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} showMatch />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">🦉</span>
          <p className="text-muted-foreground">該当するコンテストが見つかりませんでした</p>
        </div>
      )}

      {/* Pagination */}
      {(count ?? 0) > limit && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
              className="px-4 py-2 rounded-lg border text-sm hover:bg-muted transition-colors"
            >
              前へ
            </a>
          )}
          <span className="px-4 py-2 text-sm text-muted-foreground">
            {page} / {Math.ceil((count ?? 0) / limit)}
          </span>
          {(count ?? 0) > page * limit && (
            <a
              href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
              className="px-4 py-2 rounded-lg border text-sm hover:bg-muted transition-colors"
            >
              次へ
            </a>
          )}
        </div>
      )}
    </div>
  );
}
