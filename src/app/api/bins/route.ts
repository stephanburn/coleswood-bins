import { cacheLife } from "next/cache";
import type { BinType } from "@/lib/bins";

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

async function fetchVeoliaServices(uprn: string): Promise<VeoliaService[]> {
  "use cache";
  cacheLife("hours");

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
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  const uprn = process.env.NEXT_PUBLIC_UPRN ?? "100080830667";
  if (!/^\d{1,20}$/.test(uprn)) {
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let services: VeoliaService[];
  try {
    services = await fetchVeoliaServices(uprn);
  } catch (e) {
    console.error("Failed to fetch Veolia data for UPRN", uprn, e);
    if (e != null && (e as { name?: unknown }).name === "AbortError") {
      return Response.json({ error: "Request timed out" }, { status: 504 });
    }
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
