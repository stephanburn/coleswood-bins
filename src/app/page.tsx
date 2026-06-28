"use client";

import { useEffect, useState } from "react";

interface Collection {
  type: string;
  serviceName: string;
  nextCollection: string | null;
  lastCollection: string | null;
  schedule: string | null;
}

interface DisplayCollection extends Collection {
  days: number | null;
}

const COLOURS: Record<string, { card: string; badge: string; dot: string }> = {
  refuse: {
    card: "bg-amber-800 text-white",
    badge: "bg-amber-900 text-amber-100",
    dot: "bg-amber-400",
  },
  recycling: {
    card: "bg-green-700 text-white",
    badge: "bg-green-800 text-green-100",
    dot: "bg-green-300",
  },
  garden: {
    card: "bg-green-400 text-green-950",
    badge: "bg-green-500 text-green-950",
    dot: "bg-green-200",
  },
  other: {
    card: "bg-slate-600 text-white",
    badge: "bg-slate-700 text-slate-100",
    dot: "bg-slate-300",
  },
};

function londonDateParts(date: Date): { y: number; mo: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);
  return { y: get("year"), mo: get("month"), d: get("day") };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function daysAway(iso: string): number | null {
  const target = new Date(iso);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const np = londonDateParts(now);
  const tp = londonDateParts(target);
  const nowMs = Date.UTC(np.y, np.mo - 1, np.d);
  const targetMs = Date.UTC(tp.y, tp.mo - 1, tp.d);
  return Math.round((targetMs - nowMs) / 86_400_000);
}

function daysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`;
  return `In ${days} day${days !== 1 ? "s" : ""}`;
}

export default function Home() {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bins")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load bin data");
        return r.json();
      })
      .then(setCollections)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  // Exclude food waste, compute days once, sort by next collection date ascending
  const displayCollections: DisplayCollection[] | null =
    collections
      ?.filter((c) => c.type !== "food")
      .map((c) => ({
        ...c,
        days: c.nextCollection ? daysAway(c.nextCollection) : null,
      }))
      .sort((a, b) => {
        const da = a.days ?? Infinity;
        const db = b.days ?? Infinity;
        return da - db;
      }) ?? null;

  // displayCollections is already sorted, so the next upcoming is the first with days >= 0
  const nextIndex =
    displayCollections?.findIndex((c) => c.days != null && c.days >= 0) ?? -1;

  // Reminder banner: check all collections (including food) for today/tomorrow
  const minDays =
    collections
      ?.filter((c) => c.nextCollection)
      .map((c) => daysAway(c.nextCollection!))
      .filter((d): d is number => d !== null && d >= 0)
      .reduce((min, d) => Math.min(min, d), Infinity) ?? Infinity;

  const banner =
    minDays === 0
      ? { text: "Put out your bins this morning!", bg: "bg-red-500" }
      : minDays === 1
      ? { text: "Put out your bins tonight!", bg: "bg-amber-500" }
      : null;

  // Week type: whichever fortnightly bin is coming up soonest (list is already sorted)
  const weekType = (() => {
    if (!displayCollections) return null;
    const fortnightly = displayCollections.find(
      (c) => (c.type === "refuse" || c.type === "recycling") && c.days != null && c.days >= 0
    );
    if (!fortnightly) return null;
    return fortnightly.type === "refuse" ? "Refuse week" : "Recycling week";
  })();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Reminder banner */}
      {banner && (
        <div className={`${banner.bg} text-white text-center text-sm font-semibold py-2.5 px-4`}>
          {banner.text}
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-4 py-5 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Coleswood Road bin days
            </h1>
            {weekType && (
              <p className="mt-1 text-sm font-medium text-slate-500">{weekType}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 sm:px-8 flex-1">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!displayCollections && !error && (
          <div className="flex items-center justify-center py-24">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700"
              role="status"
              aria-label="Loading bin collection data"
            />
          </div>
        )}

        {displayCollections && displayCollections.length === 0 && (
          <p className="text-sm text-slate-500">No collections found.</p>
        )}

        {displayCollections && displayCollections.length > 0 && (
          <>
            <div className="flex flex-col gap-4">
              {displayCollections.map((c, i) => {
                const colours = COLOURS[c.type] ?? COLOURS.other;
                const isNext = i === nextIndex;

                return (
                  <div
                    key={c.serviceName}
                    className={`relative rounded-2xl p-5 shadow-sm flex flex-col gap-3 ${colours.card} ${isNext ? "ring-4 ring-white/60" : ""}`}
                  >
                    {isNext && (
                      <span
                        className={`absolute top-4 right-4 rounded-full px-2.5 py-0.5 text-xs font-semibold ${colours.badge}`}
                      >
                        Next collection
                      </span>
                    )}

                    <div className="flex items-center gap-2.5 pr-28">
                      <span className={`h-3 w-3 rounded-full shrink-0 ${colours.dot}`} />
                      <h2 className="font-semibold text-base leading-tight">{c.serviceName}</h2>
                    </div>

                    {c.nextCollection ? (
                      <div>
                        <p className="text-xl font-bold leading-snug">
                          {formatDate(c.nextCollection)}
                        </p>
                        <p className="mt-0.5 text-sm font-medium opacity-80">
                          {c.days != null ? daysLabel(c.days) : ""}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm opacity-70">No date available</p>
                    )}

                    {c.schedule && (
                      <p className="text-xs opacity-70 mt-auto">{c.schedule}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-sm text-slate-500">
              🟠 Food waste caddy goes out every bin day.
            </p>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-8">
        <p className="max-w-4xl mx-auto text-xs text-slate-400 text-center">
          Data from St Albans District Council. Updates automatically.
        </p>
      </footer>
    </div>
  );
}
