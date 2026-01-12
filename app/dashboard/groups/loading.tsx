export default function GroupsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="hidden md:flex items-center gap-2">
        <div className="h-7 w-7 bg-muted animate-pulse rounded-md" />
        <div className="h-5 w-64 bg-muted animate-pulse rounded-md" />
      </div>
      <div>
        <div className="h-8 w-32 bg-muted animate-pulse rounded-md mb-2" />
        <div className="h-5 w-48 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-muted animate-pulse rounded-md" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
                <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
              </div>
            </div>
            <div className="h-4 w-48 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
