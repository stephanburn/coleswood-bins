import { type NextRequest } from "next/server";

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

export async function GET(request: NextRequest) {
  const uprn = request.nextUrl.searchParams.get("uprn");
  if (!uprn) {
    return Response.json({ error: "uprn query parameter is required" }, { status: 400 });
  }

  const upstream = await fetch(
    "https://gis.stalbans.gov.uk/NoticeBoard9/VeoliaProxy.NoticeBoard.asmx/GetServicesByUprnAndNoticeBoard",
    {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ uprn, noticeBoard: "default" }),
    }
  );

  if (!upstream.ok) {
    return Response.json({ error: "Failed to fetch from Veolia API" }, { status: 502 });
  }

  const data = await upstream.json();
  const services: VeoliaService[] = data.d ?? [];

  const collections = services.map((service) => {
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

function inferType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("food")) return "food";
  if (lower.includes("garden")) return "garden";
  if (lower.includes("recycl")) return "recycling";
  if (lower.includes("refuse")) return "refuse";
  return "other";
}
