import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6 md:gap-6" aria-label="Loading admin dashboard">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-56" /></div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="space-y-3 p-5"><Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-20" /><Skeleton className="h-4 w-36" /></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="space-y-4 p-5 lg:col-span-2"><Skeleton className="h-5 w-52" /><Skeleton className="h-[280px] w-full" /></Card>
        <Card className="space-y-4 p-5"><Skeleton className="h-5 w-36" /><Skeleton className="h-[280px] w-full" /></Card>
      </div>
      <Card className="space-y-3 p-5"><Skeleton className="h-5 w-36" />{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}</Card>
    </div>
  );
}
