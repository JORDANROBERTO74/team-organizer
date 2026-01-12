import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4">
      <DashboardBreadcrumb />
      <div>
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md mb-2" />
        <div className="h-5 w-64 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="border rounded-lg p-6">
        <div className="space-y-4">
          <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
