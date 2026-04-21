import { NextResponse } from "next/server";
import { fetchAllGearExportRows } from "~/server/gear/service";

type ExportFormat = "csv" | "json";
const TEMP_EXPORT_PASSWORD = "change-me";

function parseFormat(value: string | null): ExportFormat | null {
  if (!value) return "csv";
  const normalized = value.toLowerCase();
  if (normalized === "csv" || normalized === "json") return normalized;
  return null;
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");
  if (password !== TEMP_EXPORT_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = parseFormat(searchParams.get("format"));
  if (!format) {
    return NextResponse.json(
      { error: "format must be csv or json" },
      { status: 400 },
    );
  }

  const items = await fetchAllGearExportRows();
  if (format === "json") {
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const header = "name,brand,mounts";
  const lines = items.map((item) =>
    [
      escapeCsvCell(item.name),
      escapeCsvCell(item.brand ?? ""),
      escapeCsvCell(item.mounts.join("; ")),
    ].join(","),
  );
  const csv = `${header}\n${lines.join("\n")}`;
  const datePart = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gear-export-${datePart}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
