"use client";

import dynamic from "next/dynamic";
import { useInViewEnter } from "@/hooks/use-in-view-enter";
import type { ParaFlowEdge, ParaFlowNode } from "@/lib/areas/para-graph";

const AreaParaFlow = dynamic(
  () => import("@/components/areas/area-para-flow").then((m) => m.AreaParaFlow),
  { ssr: false, loading: () => <div className="h-[380px] skeleton-shimmer rounded-xl" /> }
);

interface Props {
  nodes: ParaFlowNode[];
  edges: ParaFlowEdge[];
  height?: number;
}

export function AreasParaSection({ nodes, edges, height = 420 }: Props) {
  const { ref, isInView } = useInViewEnter(0.05);

  return (
    <div ref={ref}>
      {isInView ? (
        <AreaParaFlow nodes={nodes} edges={edges} height={height} />
      ) : (
        <div className="h-[380px] skeleton-shimmer rounded-xl" />
      )}
    </div>
  );
}
