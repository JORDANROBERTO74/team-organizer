"use client";

import { useState, useTransition } from "react";
import { deleteSlotAction } from "@/app/dashboard/actions/slot-actions";
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
import { SlotForm } from "./slot-form";
import { Pencil, Trash2, Clock } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";
import type { GroupSlot } from "@/lib/types/database";
import type { LucideIcon } from "lucide-react";

interface SlotsListProps {
  initialSlots: GroupSlot[];
}

export function SlotsList({ initialSlots }: SlotsListProps) {
  // Estado local de slots - se inicializa con initialSlots de SSR
  // Todas las actualizaciones (crear, editar, eliminar) se hacen directamente en este estado
  // sin necesidad de refetch a la API
  const [slots, setSlots] = useState<GroupSlot[]>(initialSlots);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<GroupSlot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<GroupSlot | null>(null);

  const handleDelete = async () => {
    if (!deletingSlot) return;

    const slotIdToDelete = deletingSlot.id;
    const slotLabel = deletingSlot.slot_label;

    // Actualización optimista: eliminar del estado local inmediatamente
    const previousSlots = [...slots];
    setSlots((prev) => prev.filter((s) => s.id !== slotIdToDelete));
    setDeletingSlot(null);

    startTransition(async () => {
      try {
        const result = await deleteSlotAction(slotIdToDelete);
        if (!result.success) {
          // Revertir si falla
          setSlots(previousSlots);
          toast.error("Error al eliminar", {
            description: result.error || "No se pudo eliminar la etiqueta.",
          });
        } else {
          toast.success("Etiqueta eliminada", {
            description: `La etiqueta "${slotLabel}" ha sido eliminada exitosamente.`,
          });
        }
      } catch (err) {
        // Revertir si hay error
        setSlots(previousSlots);
        toast.error("Error al eliminar", {
          description:
            err instanceof Error
              ? err.message
              : "No se pudo eliminar la etiqueta.",
        });
      }
    });
  };

  const handleCreateSuccess = (newSlot: GroupSlot) => {
    // Actualizar estado local directamente sin refetch
    setSlots((prev) => [...prev, newSlot]);
  };

  const handleUpdateSuccess = (updatedSlot: GroupSlot) => {
    // Actualizar estado local directamente sin refetch
    setSlots((prev) =>
      prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s))
    );
  };

  // Función helper para obtener el componente de icono
  const getIconComponent = (
    iconName: string | null | undefined
  ): LucideIcon => {
    if (!iconName) return Clock;
    try {
      const IconComponent = (
        LucideIcons as unknown as Record<string, LucideIcon>
      )[iconName];
      return IconComponent || Clock;
    } catch {
      return Clock;
    }
  };

  if (slots.length === 0) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex gap-2 items-center justify-between">
              <div>
                <CardTitle>No hay etiquetas</CardTitle>
                <CardDescription>
                  Crea tu primera etiqueta para comenzar a organizar los
                  horarios de tus grupos
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Crear Etiqueta
              </Button>
            </div>
          </CardHeader>
        </Card>

        <SlotForm
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
            {slots.length} {slots.length === 1 ? "etiqueta" : "etiquetas"}
          </h2>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Crear Etiqueta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => (
          <Card key={slot.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {(() => {
                    const IconComponent = getIconComponent(slot.icon);
                    return (
                      <IconComponent className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    );
                  })()}
                  <CardTitle className="truncate">{slot.slot_label}</CardTitle>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingSlot(slot)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingSlot(slot)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {(() => {
                  const IconComponent = getIconComponent(slot.icon);
                  return (
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  );
                })()}
                <CardDescription className="text-xs">
                  {slot.icon || "Clock"}
                </CardDescription>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Creado: {new Date(slot.created_at).toLocaleDateString("es-ES")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <SlotForm
        slot={editingSlot}
        open={!!editingSlot}
        onOpenChange={(open) => !open && setEditingSlot(null)}
        onSuccess={handleUpdateSuccess}
      />

      <SlotForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <Dialog
        open={!!deletingSlot}
        onOpenChange={(open) => !open && setDeletingSlot(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar etiqueta?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará la etiqueta{" "}
              <strong>{deletingSlot?.slot_label}</strong> y todos sus datos
              asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingSlot(null)}
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
