"use client";

import { useEffect, useState } from "react";

const UPRN = "100080830667";

interface Collection {
  type: string;
  serviceName: string;
  nextCollection: string | null;
  lastCollection: string | null;
  schedule: string | null;
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function daysAway(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  const diff = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.round(diff / 86_400_000);
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
    fetch(`/api/bins?uprn=${UPRN}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load bin data");
        return r.json();
      })
      .then(setCollections)
      .catch((e: Error) => setError(e.message));
  }, []);

  // Exclude food waste from cards, sort by next collection date ascending
  const displayCollections =
    collections
      ?.filter((c) => c.type !== "food")
      .slice()
      .sort((a, b) => {
        const da = a.nextCollection ? daysAway(a.nextCollection) : Infinity;
        const db = b.nextCollection ? daysAway(b.nextCollection) : Infinity;
        return da - db;
      }) ?? null;

  // Find the next upcoming non-food collection index (within displayCollections)
  const nextIndex =
    displayCollections
      ?.map((c, i) => ({
        i,
        days: c.nextCollection ? daysAway(c.nextCollection) : Infinity,
      }))
      .filter(({ days }) => days >= 0)
      .sort((a, b) => a.days - b.days)[0]?.i ?? -1;

  // Reminder banner: check all collections (including food) for today/tomorrow
  const minDays =
    collections
      ?.filter((c) => c.nextCollection)
      .map((c) => daysAway(c.nextCollection!))
      .filter((d) => d >= 0)
      .reduce((min, d) => Math.min(min, d), Infinity) ?? Infinity;

  const banner =
    minDays === 0
      ? { text: "Put out your bins this morning!", bg: "bg-red-500" }
      : minDays === 1
      ? { text: "Put out your bins tonight!", bg: "bg-amber-500" }
      : null;

  // Week type: whichever fortnightly bin (refuse or recycling) is coming up next
  const weekType = (() => {
    if (!displayCollections) return null;
    const fortnightly = displayCollections
      .filter((c) => (c.type === "refuse" || c.type === "recycling") && c.nextCollection)
      .map((c) => ({ type: c.type, days: daysAway(c.nextCollection!) }))
      .filter(({ days }) => days >= 0)
      .sort((a, b) => a.days - b.days)[0];
    if (!fortnightly) return null;
    return fortnightly.type === "refuse" ? "Refuse week" : "Recycling week";
  })();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col" style={{ fontFamily: "var(--font-geist-sans, sans-serif)" }}>
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
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
          </div>
        )}

        {displayCollections && (
          <>
            <div className="flex flex-col gap-4">
              {displayCollections.map((c, i) => {
                const colours = COLOURS[c.type] ?? COLOURS.other;
                const isNext = i === nextIndex;
                const days = c.nextCollection ? daysAway(c.nextCollection) : null;

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
                          {daysLabel(days!)}
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
