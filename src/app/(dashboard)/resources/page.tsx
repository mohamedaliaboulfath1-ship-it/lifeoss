import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ResourcesView = dynamic(
  () => import("@/components/para/resources-view").then((m) => m.ResourcesView),
  { loading: () => <Skeleton className="h-96 rounded-2xl" /> }
);

export default function ResourcesPage() {
  return <ResourcesView />;
}
