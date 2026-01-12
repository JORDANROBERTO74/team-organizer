"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";

export default function SlotsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Slots error:", error);
  }, [error]);

  return (
    <div className="flex flex-col gap-4">
      <DashboardBreadcrumb />
      <div>
        <h1 className="text-2xl font-bold">Slots de Grupos</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los slots para organizar los horarios de tus grupos
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Error al cargar slots</CardTitle>
          </div>
          <CardDescription>
            Ha ocurrido un error al intentar cargar los slots.
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
          <div className="flex gap-2">
            <Button onClick={reset}>Intentar de nuevo</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Recargar página
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
