export default function HomeLoading() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation skeleton */}
      <nav className="w-full flex justify-center border-b border-b-foreground/10 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="w-full max-w-7xl flex justify-between items-center p-2 sm:p-3 px-2 sm:px-5">
          <div className="h-6 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
        </div>
      </nav>

      {/* Hero section skeleton */}
      <section className="flex-1 w-full flex flex-col gap-12 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-5xl space-y-8">
          <div className="space-y-4 text-center">
            <div className="h-12 w-full max-w-2xl mx-auto bg-muted animate-pulse rounded-md" />
            <div className="h-6 w-full max-w-xl mx-auto bg-muted animate-pulse rounded-md" />
          </div>
          
          {/* Features skeleton */}
          <div className="grid gap-6 md:grid-cols-3 mt-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border rounded-lg p-6 space-y-4"
              >
                <div className="h-12 w-12 bg-muted animate-pulse rounded-md" />
                <div className="h-6 w-3/4 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-5/6 bg-muted animate-pulse rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
