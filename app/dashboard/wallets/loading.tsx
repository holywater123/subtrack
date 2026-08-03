import { Skeleton } from "@/components/dashboard/skeleton";

export default function WalletsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-24 w-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
