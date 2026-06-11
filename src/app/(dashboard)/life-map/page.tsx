import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const LifeMapView = dynamic(
  () => import("@/components/life-map/life-map-view").then((m) => m.LifeMapView),
  { loading: () => <Skeleton className="h-96 rounded-2xl" /> }
);

export default function LifeMapPage() {
  return <LifeMapView />;
}
