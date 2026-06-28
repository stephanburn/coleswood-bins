"use client";

import { useEffect, useState } from "react";
import { BinType, BIN_META } from "@/lib/bins";
import { daysAway } from "@/lib/date";
import { BinCard } from "@/components/BinCard";

interface Collection {
  type: BinType;
  serviceName: string;
  nextCollection: string | null;
  schedule: string | null;
}

interface DisplayCollection extends Collection {
  days: number | null;
}

export default function Home() {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/bins")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load bin data");
        return r.json();
      })
      .then(setCollections)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e))
      );
  }, []);

  // Recompute day labels at midnight and on tab focus to prevent stale "Today/Tomorrow"
  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      100
    );
    const timer = setTimeout(refresh, nextMidnight.getTime() - now.getTime());
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [tick]);

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

  const nextIndex =
    displayCollections?.findIndex((c) => c.days != null && c.days >= 0) ?? -1;

  const minDays =
    collections
      ?.filter((c) => c.nextCollection)
      .map((c) => daysAway(c.nextCollection!))
      .filter((d): d is number => d !== null && d >= 0)
      .reduce((min, d) => Math.min(min, d), Infinity) ?? Infinity;

  const banner =
    minDays === 0
      ? { text: "Put out your bins this morning!", classes: "bg-red-600 text-white" }
      : minDays === 1
      ? {
          text: "Put out your bins tonight!",
          classes: "bg-amber-100 text-amber-950 border-b border-amber-300",
        }
      : null;

  const weekType = (() => {
    if (!displayCollections) return null;
    const fortnightly = displayCollections.find(
      (c) =>
        (c.type === "refuse" || c.type === "recycling") &&
        c.days != null &&
        c.days >= 0
    );
    if (!fortnightly) return null;
    return fortnightly.type === "refuse" ? "Refuse week" : "Recycling week";
  })();

  const foodMeta = BIN_META.food;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Fixed-height wrapper prevents layout shift when banner mounts/unmounts */}
      <div className="min-h-[44px]">
        {banner && (
          <div
            role="status"
            aria-live="polite"
            className={`text-center text-sm font-semibold py-2.5 px-4 ${banner.classes}`}
          >
            {banner.text}
          </div>
        )}
      </div>

      <header className="bg-white border-b border-slate-200 px-4 py-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Coleswood Road bin days
          </h1>
          {weekType && (
            <p className="mt-1 text-sm font-medium text-slate-500">{weekType}</p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 sm:px-8 flex-1 min-h-[320px]">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
            Couldn't load collection dates. Check your connection or try again.
          </div>
        )}

        {!displayCollections && !error && (
          <div className="flex items-center justify-center gap-3 py-24">
            <div
              className="h-10 w-10 animate-spin motion-reduce:hidden rounded-full border-4 border-slate-300 border-t-slate-700"
              aria-hidden="true"
            />
            <p className="hidden motion-reduce:block text-sm text-slate-500">Loading…</p>
            <span className="sr-only motion-reduce:hidden">
              Loading bin collection data
            </span>
          </div>
        )}

        {displayCollections && displayCollections.length === 0 && (
          <p className="text-sm text-slate-500">
            No upcoming collections found for this address.
          </p>
        )}

        {displayCollections && displayCollections.length > 0 && (
          <>
            <ul
              role="list"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {displayCollections.map((c, i) => {
                const isNext = i === nextIndex;
                return (
                  <BinCard
                    key={c.serviceName}
                    type={c.type}
                    serviceName={c.serviceName}
                    nextCollection={c.nextCollection}
                    schedule={c.schedule}
                    days={c.days}
                    isNext={isNext}
                    className={isNext ? "sm:col-span-2" : ""}
                  />
                );
              })}
            </ul>

            <p className="mt-6 text-sm text-slate-600 flex items-center gap-1.5">
              <span
                className={`h-3 w-3 rounded-full shrink-0 ${foodMeta.dot}`}
                aria-hidden="true"
              />
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${foodMeta.chip}`}
              >
                {foodMeta.label}
              </span>
              caddy goes out every bin day.
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
