"use client";

import { useState, useTransition } from "react";
import { deleteSectorAction } from "@/app/dashboard/actions/sector-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SectorForm } from "./sector-form";
import { Pencil, Trash2, Building2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";
import type { Sector } from "@/lib/types/database";
import type { LucideIcon } from "lucide-react";

interface SectorsListProps {
  initialSectors: Sector[];
}

export function SectorsList({ initialSectors }: SectorsListProps) {
  // Estado local de sectores - se inicializa con initialSectors de SSR
  // Todas las actualizaciones (crear, editar, eliminar) se hacen directamente en este estado
  // sin necesidad de refetch a la API
  const [sectors, setSectors] = useState<Sector[]>(initialSectors);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [deletingSector, setDeletingSector] = useState<Sector | null>(null);

  const handleDelete = async () => {
    if (!deletingSector) return;

    const sectorIdToDelete = deletingSector.id;
    const sectorName = deletingSector.name;

    // Actualización optimista: eliminar del estado local inmediatamente
    const previousSectors = [...sectors];
    setSectors((prev) => prev.filter((s) => s.id !== sectorIdToDelete));
    setDeletingSector(null);

    startTransition(async () => {
      try {
        const result = await deleteSectorAction(sectorIdToDelete);
        if (!result.success) {
          // Revertir si falla
          setSectors(previousSectors);
          toast.error("Error al eliminar", {
            description: result.error || "No se pudo eliminar el sector.",
          });
        } else {
          toast.success("Sector eliminado", {
            description: `El sector "${sectorName}" ha sido eliminado exitosamente.`,
          });
        }
      } catch (err) {
        // Revertir si hay error
        setSectors(previousSectors);
        toast.error("Error al eliminar", {
          description:
            err instanceof Error ? err.message : "No se pudo eliminar el sector.",
        });
      }
    });
  };

  const handleCreateSuccess = (newSector: Sector) => {
    // Actualizar estado local directamente sin refetch
    setSectors((prev) => [...prev, newSector]);
  };

  const handleUpdateSuccess = (updatedSector: Sector) => {
    // Actualizar estado local directamente sin refetch
    setSectors((prev) =>
      prev.map((s) => (s.id === updatedSector.id ? updatedSector : s))
    );
  };

  // Función helper para obtener el componente de icono
  const getIconComponent = (iconName: string | null | undefined): LucideIcon => {
    if (!iconName) return Building2;
    try {
      const IconComponent = (
        LucideIcons as unknown as Record<string, LucideIcon>
      )[iconName];
      return IconComponent || Building2;
    } catch {
      return Building2;
    }
  };

  if (sectors.length === 0) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex gap-2 items-center justify-between">
              <div>
                <CardTitle>No hay sectores</CardTitle>
                <CardDescription>
                  Crea tu primer sector para comenzar a organizar tus áreas de
                  trabajo
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Crear Sector
              </Button>
            </div>
          </CardHeader>
        </Card>

        <SectorForm
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={handleCreateSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">
            {sectors.length}{" "}
            {sectors.length === 1 ? "sector" : "sectores"}
          </h2>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Crear Sector
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector) => (
          <Card
            key={sector.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {(() => {
                    const IconComponent = getIconComponent(sector.icon);
                    return (
                      <IconComponent className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    );
                  })()}
                  <CardTitle className="truncate">{sector.name}</CardTitle>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingSector(sector)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingSector(sector)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {(() => {
                  const IconComponent = getIconComponent(sector.icon);
                  return (
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  );
                })()}
                <CardDescription className="text-xs">
                  {sector.icon || "Building2"}
                </CardDescription>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Creado:{" "}
                {new Date(sector.created_at).toLocaleDateString("es-ES")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <SectorForm
        sector={editingSector}
        open={!!editingSector}
        onOpenChange={(open) => !open && setEditingSector(null)}
        onSuccess={handleUpdateSuccess}
      />

      <SectorForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <Dialog
        open={!!deletingSector}
        onOpenChange={(open) => !open && setDeletingSector(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar sector?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el sector{" "}
              <strong>{deletingSector?.name}</strong> y todos sus datos
              asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingSector(null)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
