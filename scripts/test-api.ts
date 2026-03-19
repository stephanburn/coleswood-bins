async function main() {
  const response = await fetch(
    "https://gis.stalbans.gov.uk/NoticeBoard9/VeoliaProxy.NoticeBoard.asmx/GetServicesByUprnAndNoticeBoard",
    {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ uprn: "100080830667", noticeBoard: "default" }),
    }
  );

  const data = await response.json();

  for (const service of data.d) {
    const header = service.ServiceHeaders?.[0];
    const next = header?.Next
      ? new Date(header.Next).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "N/A";

    console.log(`${service.ServiceName}`);
    console.log(`  Task:     ${header?.TaskType ?? "N/A"}`);
    console.log(`  Next:     ${next}`);
    console.log(`  Schedule: ${header?.ScheduleDescription ?? "N/A"}`);
    console.log();
  }
}

main();
