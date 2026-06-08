import { resolveDomainId, SYSTEM_DOMAINS } from "@/lib/domains";

export function entityDomainId(entity: {
  domain_id?: string | null;
  domainId?: string | null;
  area?: string | null;
  category?: string | null;
  cat?: string | null;
}): string {
  return (
    entity.domain_id ??
    entity.domainId ??
    resolveDomainId(entity.area ?? entity.category ?? entity.cat)
  );
}

export function domainIdFromSlug(slug: string, areas: { id: string; slug: string }[]): string | null {
  const found = areas.find((a) => a.slug === slug);
  if (found) return found.id;
  const sys = SYSTEM_DOMAINS.find((d) => d.slug === slug);
  return sys?.id ?? null;
}

export function matchesDomain(
  entity: Parameters<typeof entityDomainId>[0],
  domainId: string
): boolean {
  return entityDomainId(entity) === domainId;
}
