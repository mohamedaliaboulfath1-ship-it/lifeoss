/**
 * Dev-only query counter for performance benchmarks.
 * Wraps Supabase client `.from()` calls when PERF_COUNT=1.
 */

let queryCount = 0;

export function resetQueryCount() {
  queryCount = 0;
}

export function getQueryCount() {
  return queryCount;
}

export function incrementQueryCount() {
  queryCount += 1;
}

export function isQueryCountingEnabled() {
  return process.env.PERF_COUNT === "1";
}
