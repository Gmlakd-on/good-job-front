"use client";

export function DiaryListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 animate-pulse"
          style={{
            borderRadius: "var(--radius-md)",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-16 rounded-full" style={{ background: "var(--warm-sand)" }} />
            <div className="flex gap-2">
              <div className="h-5 w-5 rounded-full" style={{ background: "var(--warm-sand)" }} />
              <div className="h-5 w-5 rounded-full" style={{ background: "var(--warm-sand)" }} />
            </div>
          </div>
          <div className="h-3 w-full rounded-full mb-2" style={{ background: "var(--warm-sand)" }} />
          <div className="h-3 w-3/4 rounded-full" style={{ background: "var(--warm-sand)" }} />
        </div>
      ))}
    </div>
  );
}

export function DiaryDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-16 rounded-full" style={{ background: "var(--warm-sand)" }} />
        <div className="h-6 w-16 rounded-full" style={{ background: "var(--warm-sand)" }} />
      </div>
      <div
        className="p-5 mb-4"
        style={{
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="h-3 w-20 rounded-full mb-4" style={{ background: "var(--warm-sand)" }} />
        <div className="space-y-3">
          <div className="h-3 w-full rounded-full" style={{ background: "var(--warm-sand)" }} />
          <div className="h-3 w-5/6 rounded-full" style={{ background: "var(--warm-sand)" }} />
          <div className="h-3 w-4/6 rounded-full" style={{ background: "var(--warm-sand)" }} />
        </div>
      </div>
      <div
        className="p-6"
        style={{
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="h-4 w-24 rounded-full mb-4" style={{ background: "var(--warm-sand)" }} />
        <div className="space-y-3">
          <div className="h-3 w-full rounded-full" style={{ background: "var(--warm-sand)" }} />
          <div className="h-3 w-5/6 rounded-full" style={{ background: "var(--warm-sand)" }} />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="p-3 text-center"
          style={{
            borderRadius: "var(--radius-md)",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="h-3 w-16 rounded-full mx-auto mb-2" style={{ background: "var(--warm-sand)" }} />
          <div className="h-6 w-10 rounded-full mx-auto" style={{ background: "var(--warm-sand)" }} />
        </div>
      ))}
    </div>
  );
}
