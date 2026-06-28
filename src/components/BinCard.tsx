import { BinType, BIN_META } from "@/lib/bins";
import { formatDate, daysLabel } from "@/lib/date";

function BinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
      <path
        fillRule="evenodd"
        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
      />
    </svg>
  );
}

interface BinCardProps {
  type: BinType;
  serviceName: string;
  nextCollection: string | null;
  schedule: string | null;
  days: number | null;
  isNext: boolean;
  className?: string;
}

export function BinCard({
  type,
  serviceName,
  nextCollection,
  schedule,
  days,
  isNext,
  className,
}: BinCardProps) {
  const meta = BIN_META[type] ?? BIN_META.other;

  return (
    <li
      className={[
        "relative bg-white rounded-2xl border-l-4 shadow-sm flex flex-col gap-3 p-5",
        meta.accent,
        isNext ? "ring-2 ring-slate-900 shadow-lg" : "",
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      {isNext && (
        <span className="absolute top-4 right-4 rounded-full bg-slate-900 text-white px-2.5 py-0.5 text-xs font-semibold">
          Next collection
        </span>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`h-3 w-3 rounded-full shrink-0 ${meta.dot}`} aria-hidden="true" />
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.chip}`}
        >
          <BinIcon className="h-3 w-3" />
          {meta.label}
        </span>
      </div>

      <h2
        className={`font-semibold text-base leading-tight text-slate-900 ${isNext ? "pr-28" : ""}`}
      >
        {serviceName}
      </h2>

      {nextCollection ? (
        <div>
          <p
            className={`font-bold leading-snug text-slate-900 ${isNext ? "text-2xl" : "text-xl"}`}
          >
            <time dateTime={nextCollection}>{formatDate(nextCollection)}</time>
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-600">
            {days != null ? daysLabel(days) : ""}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No date available</p>
      )}

      {schedule && (
        <p className="text-xs text-slate-400 mt-auto">{schedule}</p>
      )}
    </li>
  );
}
