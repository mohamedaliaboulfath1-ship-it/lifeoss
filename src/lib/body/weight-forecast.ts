/** Weight journey math — remaining kg, weeks at user's weekly rate */

export function resolveCurrentWeight(input: {
  latestLog?: number | null;
  profileCurrent?: number | null;
}): number | null {
  if (input.latestLog != null && input.latestLog > 0) return input.latestLog;
  if (input.profileCurrent != null && input.profileCurrent > 0) return input.profileCurrent;
  return null;
}

export function calcWeeklyGainFromLogs(weights: number[]): number | null {
  if (weights.length < 2) return null;
  const last = weights[weights.length - 1];
  const prev = weights[weights.length - 2];
  return Math.round((last - prev) * 10) / 10;
}

export function calcAverageWeeklyGain(weights: number[], points = 4): number | null {
  if (weights.length < 2) return null;
  const slice = weights.slice(-Math.min(points, weights.length));
  if (slice.length < 2) return null;
  const total = slice[slice.length - 1] - slice[0];
  const weeks = slice.length - 1;
  return Math.round((total / weeks) * 10) / 10;
}

export function weightForecast(input: {
  current: number;
  target: number;
  start?: number;
  weeklyRate: number;
}) {
  const remaining = Math.round((input.target - input.current) * 10) / 10;
  const rate = input.weeklyRate > 0 ? input.weeklyRate : 0.35;
  const weeks =
    input.current < input.target && rate > 0
      ? Math.ceil(remaining / rate)
      : null;

  let forecastDate: string | null = null;
  if (weeks != null) {
    const d = new Date();
    d.setDate(d.getDate() + weeks * 7);
    forecastDate = d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
  }

  const start = input.start ?? input.current;
  const progressPct =
    input.target !== start
      ? Math.max(0, Math.min(100, Math.round(((input.current - start) / (input.target - start)) * 100)))
      : input.current >= input.target ? 100 : 0;

  return {
    remaining,
    weeks,
    forecastDate,
    weeklyRateUsed: rate,
    progressPct,
    onTrack: input.current < input.target,
  };
}
