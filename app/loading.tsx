import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <Card className="space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-72 w-full" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
        <Card className="space-y-4">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    </div>
  );
}
