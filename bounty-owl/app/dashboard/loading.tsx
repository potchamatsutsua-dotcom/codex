export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-64 bg-muted rounded-xl mb-2" />
        <div className="h-4 w-40 bg-muted rounded-lg" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-2xl" />
        ))}
      </div>

      {/* Cards skeleton */}
      <div>
        <div className="h-6 w-36 bg-muted rounded-lg mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
