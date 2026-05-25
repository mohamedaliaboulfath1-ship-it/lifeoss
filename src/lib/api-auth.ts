import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { NextResponse } from "next/server";

export async function requireSession() {
  if (!isSupabaseConfigured()) {
    return {
      error: NextResponse.json(
        {
          error:
            "Supabase غير مُعدّ — أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في .env.local",
        },
        { status: 503 }
      ),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: NextResponse.json({ error: "غير مصرح" }, { status: 401 }) };
  }

  return { user, userId: user.id, supabase };
}
