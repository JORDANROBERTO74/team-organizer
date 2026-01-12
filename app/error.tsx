"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Home page error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="w-full max-w-7xl flex justify-between items-center p-2 sm:p-3 px-2 sm:px-5">
          <div className="h-6 w-32" />
          <div className="h-8 w-20" />
        </div>
      </nav>

      <section className="flex-1 w-full flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Error al cargar la página</CardTitle>
              </div>
              <CardDescription>
                Ha ocurrido un error al intentar cargar la página principal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {error.message || "Ocurrió un error inesperado"}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground font-mono">
                  Error ID: {error.digest}
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Button onClick={reset}>Intentar de nuevo</Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Recargar página
                </Button>
                <Button variant="ghost" onClick={() => router.push("/auth/login")}>
                  Ir al login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
