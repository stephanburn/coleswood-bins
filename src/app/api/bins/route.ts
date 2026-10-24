import { cacheLife } from "next/cache";
import { connection } from "next/server";
import type { BinType } from "@/lib/bins";
import { londonDateParts } from "@/lib/date";

interface VeoliaServiceHeader {
  TaskType: string;
  Last: string;
  Next: string;
  ScheduleDescription: string;
}

interface VeoliaService {
  ServiceName: string;
  ServiceHeaders: VeoliaServiceHeader[];
}

// `day` is unused in the body but forms part of the cache key, so a cached
// response can never be reused across London days.
//
// Errors are logged here rather than by the caller: in production, an error
// thrown out of a "use cache" function reaches the caller redacted to a
// generic "Server Components render" message, losing the real cause.
async function fetchVeoliaServices(
  uprn: string,
  day: string
): Promise<VeoliaService[]> {
  "use cache";
  cacheLife("hours");
  void day;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const upstream = await fetch(
      "https://gis.stalbans.gov.uk/NoticeBoard9/VeoliaProxy.NoticeBoard.asmx/GetServicesByUprnAndNoticeBoard",
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({ uprn, noticeBoard: "default" }),
        signal: controller.signal,
      }
    );

    if (!upstream.ok) {
      throw new Error(`Veolia API returned ${upstream.status}`);
    }

    const data: unknown = await upstream.json();
    if (
      typeof data !== "object" ||
      data === null ||
      !Array.isArray((data as Record<string, unknown>).d)
    ) {
      throw new Error("Unexpected response structure from Veolia API");
    }

    return (data as { d: VeoliaService[] }).d;
  } catch (e) {
    console.error("Failed to fetch Veolia data for UPRN", uprn, e);
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  // Opt out of build-time prerendering. Without this the collection dates are
  // baked into the static payload at build time and served indefinitely.
  await connection();

  const uprn = process.env.NEXT_PUBLIC_UPRN ?? "100080830667";
  if (!/^\d{1,20}$/.test(uprn)) {
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { y, mo, d } = londonDateParts(new Date());
  const day = `${y}-${mo}-${d}`;

  let services: VeoliaService[];
  try {
    services = await fetchVeoliaServices(uprn, day);
  } catch {
    // Already logged with the real cause inside fetchVeoliaServices; the error
    // seen here is redacted, so timeouts can't be told apart from other failures.
    return Response.json({ error: "Failed to fetch from Veolia API" }, { status: 502 });
  }

  const collections = services.map((service) => {
    // Each service has returned exactly one ServiceHeader in practice; [0] assumed.
    const header = service.ServiceHeaders?.[0];
    return {
      type: inferType(service.ServiceName),
      serviceName: service.ServiceName,
      nextCollection: header?.Next ?? null,
      lastCollection: header?.Last ?? null,
      schedule: header?.ScheduleDescription ?? null,
    };
  });

  return Response.json(collections);
}

function inferType(name: string): BinType {
  const lower = name.toLowerCase();
  if (lower.includes("food")) return "food";
  if (lower.includes("garden")) return "garden";
  if (lower.includes("recycl")) return "recycling";
  if (lower.includes("refuse")) return "refuse";
  return "other";
}
