export async function financePost(entity: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/finance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entity, payload }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "failed");
  return res.json();
}

export async function financeDelete(entity: string, id: string) {
  const res = await fetch(`/api/finance?entity=${entity}&id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("failed");
}

export async function loadFinanceAll() {
  const [finRes, wealthRes] = await Promise.all([
    fetch("/api/finance?type=all"),
    fetch("/api/finance/wealth"),
  ]);
  const fin = await finRes.json().catch(() => ({}));
  const wealth = await wealthRes.json().catch(() => ({}));
  return { fin, wealth: wealth.snapshot, migrationRequired: fin.migrationRequired };
}
