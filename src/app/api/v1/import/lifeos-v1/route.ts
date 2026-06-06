import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { importLifeOSV1 } from "@/lib/import/v1/importer";
import type { V1Backup } from "@/lib/import/v1/types";

const bodySchema = z.object({
  backup: z.record(z.unknown()),
  dryRun: z.boolean().optional(),
});

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  try {
    const body = bodySchema.parse(await req.json());
    const backup = body.backup as V1Backup;

    if (!backup.version && !backup.goals && !backup.settings) {
      return NextResponse.json(
        { error: "ملف غير معروف — يجب أن يكون من LifeOS_1 exportAllData()" },
        { status: 400 }
      );
    }

    if (body.dryRun) {
      const storeCounts = Object.entries(backup)
        .filter(([k, v]) => Array.isArray(v) && k !== "version")
        .map(([store, arr]) => ({ store, count: (arr as unknown[]).length }));

      return NextResponse.json({
        dryRun: true,
        version: backup.version,
        exportedAt: backup.exported_at,
        storeCounts,
        totalRecords: storeCounts.reduce((s, x) => s + x.count, 0),
      });
    }

    const report = await importLifeOSV1(
      authResult.supabase,
      authResult.userId,
      backup
    );

    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "فشل الاستيراد";
    const isSchema = message.includes("relation") || message.includes("column");
    return NextResponse.json(
      {
        error: message,
        hint: isSchema
          ? "شغّل migrations 005 و 006 على Supabase أولاً"
          : undefined,
      },
      { status: isSchema ? 503 : 500 }
    );
  }
}
