import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getUserContext } from "@/lib/year-data";
import { buildDashboardPdf } from "@/lib/export/pdf";
import { buildDashboardExcel } from "@/lib/export/excel";

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  try {
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") ?? "json").toLowerCase();
    const ctx = await getUserContext(authResult.userId);
    const fileBase = `lifeos-${ctx.currentYear}-${new Date().toISOString().slice(0, 10)}`;

    if (format === "pdf") {
      const bytes = buildDashboardPdf(ctx.dashboard);
      const normalized = new Uint8Array(bytes);
      return new NextResponse(normalized.buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileBase}.pdf"`,
        },
      });
    }

    if (format === "xlsx") {
      const bytes = buildDashboardExcel(ctx.yearData, ctx.dashboard);
      const normalized = new Uint8Array(bytes);
      return new NextResponse(normalized.buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${fileBase}.xlsx"`,
        },
      });
    }

    return NextResponse.json(ctx, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileBase}.json"`,
      },
    });
  } catch (e) {
    console.error("GET /api/v1/export", e);
    return NextResponse.json({ error: "فشل التصدير" }, { status: 500 });
  }
}
