import { NextResponse } from "next/server";

/** Legacy import deprecated — use /api/v1/import/lifeos-v1 for relational import. */
export async function POST() {
  return NextResponse.json(
    {
      error: "IMPORT_DEPRECATED",
      message: "استخدم /api/v1/import/lifeos-v1 لاستيراد البيانات إلى الجداول العلائقية",
    },
    { status: 410 }
  );
}
