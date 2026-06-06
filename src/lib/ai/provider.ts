import type { YearPayload } from "@/types/lifeos";
import type { DashboardSnapshot } from "@/types/lifeos-pro";
import { buildAiInsights, type AiInsight } from "@/lib/ai/engine";

export type AiProviderId = "mock" | "openai" | "anthropic";

export interface AiProviderConfig {
  provider: AiProviderId;
  model?: string;
  enabled: boolean;
  status: "READY_FOR_ACTIVATION" | "ACTIVE" | "DISABLED";
}

export interface AiProvider {
  id: AiProviderId;
  generateInsights(
    yearData: YearPayload,
    dashboard?: DashboardSnapshot | null
  ): Promise<AiInsight[]>;
  generateBrief(yearData: YearPayload): Promise<string>;
}

class MockAiProvider implements AiProvider {
  id: AiProviderId = "mock";

  async generateInsights(
    yearData: YearPayload,
    dashboard?: DashboardSnapshot | null
  ): Promise<AiInsight[]> {
    return buildAiInsights(yearData, dashboard);
  }

  async generateBrief(yearData: YearPayload): Promise<string> {
    const goals = yearData.goals?.length ?? 0;
    const habits = yearData.habits?.length ?? 0;
    return `ملخص اليوم: ${goals} أهداف نشطة، ${habits} عادات. ركّز على P1 ثم عادة واحدة. [Mock Provider — READY_FOR_ACTIVATION]`;
  }
}

class OpenAiProvider implements AiProvider {
  id: AiProviderId = "openai";

  async generateInsights(): Promise<AiInsight[]> {
    return [
      {
        id: "openai-activation",
        type: "opportunity",
        title: "OpenAI — READY_FOR_ACTIVATION",
        message: "أضف OPENAI_API_KEY في Vercel لتفعيل الرؤى الذكية.",
        action: "الإعدادات",
        href: "/ai",
      },
    ];
  }

  async generateBrief(): Promise<string> {
    return "OpenAI provider — READY_FOR_ACTIVATION. Add OPENAI_API_KEY to enable.";
  }
}

class AnthropicProvider implements AiProvider {
  id: AiProviderId = "anthropic";

  async generateInsights(): Promise<AiInsight[]> {
    return [
      {
        id: "anthropic-activation",
        type: "opportunity",
        title: "Anthropic — READY_FOR_ACTIVATION",
        message: "أضف ANTHROPIC_API_KEY في Vercel لتفعيل المدرب الذكي.",
        href: "/ai",
      },
    ];
  }

  async generateBrief(): Promise<string> {
    return "Anthropic provider — READY_FOR_ACTIVATION.";
  }
}

const providers: Record<AiProviderId, AiProvider> = {
  mock: new MockAiProvider(),
  openai: new OpenAiProvider(),
  anthropic: new AnthropicProvider(),
};

export function resolveAiProvider(config?: Partial<AiProviderConfig>): AiProvider {
  if (!config?.enabled) return providers.mock;
  const id = config.provider ?? "mock";
  if (id === "openai" && !process.env.OPENAI_API_KEY) return providers.openai;
  if (id === "anthropic" && !process.env.ANTHROPIC_API_KEY) return providers.anthropic;
  return providers[id] ?? providers.mock;
}

export function getProviderStatus(id: AiProviderId): AiProviderConfig["status"] {
  if (id === "mock") return "ACTIVE";
  if (id === "openai" && process.env.OPENAI_API_KEY) return "ACTIVE";
  if (id === "anthropic" && process.env.ANTHROPIC_API_KEY) return "ACTIVE";
  return "READY_FOR_ACTIVATION";
}

export async function loadAiConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (t: string) => any },
  userId: string
): Promise<AiProviderConfig> {
  const { data } = await supabase
    .from("ai_provider_config")
    .select("provider, model, enabled")
    .eq("user_id", userId)
    .maybeSingle();

  const provider = (data?.provider as AiProviderId) ?? "mock";
  return {
    provider,
    model: data?.model,
    enabled: data?.enabled ?? false,
    status: getProviderStatus(provider),
  };
}
