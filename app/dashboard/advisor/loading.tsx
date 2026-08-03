import { Skeleton } from "@/components/dashboard/skeleton";

export default function AdvisorLoading() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 w-2/3" />
      <Skeleton className="ml-auto h-12 w-1/2" />
      <Skeleton className="h-16 w-3/4" />
    </div>
  );
}
