export function londonDateParts(date: Date): { y: number; mo: number; d: number } {
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

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function daysAway(iso: string): number | null {
  const target = new Date(iso);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const np = londonDateParts(now);
  const tp = londonDateParts(target);
  const nowMs = Date.UTC(np.y, np.mo - 1, np.d);
  const targetMs = Date.UTC(tp.y, tp.mo - 1, tp.d);
  return Math.round((targetMs - nowMs) / 86_400_000);
}

export function daysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`;
  return `In ${days} day${days !== 1 ? "s" : ""}`;
}
