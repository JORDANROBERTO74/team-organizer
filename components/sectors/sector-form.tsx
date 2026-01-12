"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  createSectorAction,
  updateSectorAction,
} from "@/app/dashboard/actions/sector-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconPicker } from "@/components/ui/icon-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Sector } from "@/lib/types/database";

interface SectorFormProps {
  sector?: Sector | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (sector: Sector) => void;
}

// Icono por defecto para sectores
const DEFAULT_SECTOR_ICON = "Building2";

// Función para generar un color hexadecimal aleatorio
function generateRandomColor(): string {
  // Generar valores RGB aleatorios
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);

  // Convertir a hexadecimal
  const toHex = (value: number) => {
    const hex = value.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function SectorForm({
  sector,
  open,
  onOpenChange,
  onSuccess,
}: SectorFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [icon, setIcon] = useState<string>(sector?.icon || DEFAULT_SECTOR_ICON);
  const [color, setColor] = useState<string>(
    sector?.color || generateRandomColor()
  );
  const [priority, setPriority] = useState<string>(sector?.priority || "");
  const formRef = useRef<HTMLFormElement>(null);

  const isEditing = !!sector;

  // Sincronizar el icono y color cuando se abre el diálogo o cambia el sector
  useEffect(() => {
    if (open) {
      if (isEditing) {
        // Al editar, mantener el icono, color y prioridad existentes
        setIcon(sector?.icon || DEFAULT_SECTOR_ICON);
        setColor(sector?.color || generateRandomColor());
        setPriority(sector?.priority || "");
      } else {
        // Al crear, usar icono por defecto, generar un color aleatorio y resetear prioridad
        setIcon(DEFAULT_SECTOR_ICON);
        setColor(generateRandomColor());
        setPriority("");
      }
      setError(null); // Limpiar errores al abrir el diálogo
    }
  }, [open, sector, isEditing]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const priorityValue = priority || (formData.get("priority") as string);
    const description = formData.get("description") as string | null;

    if (!name || name.trim() === "") {
      setError("El nombre del sector es requerido");
      return;
    }

    if (!priorityValue || priorityValue.trim() === "") {
      setError("La prioridad es requerida");
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const actionFormData = new FormData();
        actionFormData.append("name", name.trim());
        actionFormData.append("priority", priorityValue.trim());
        // Usar el icono seleccionado o el por defecto
        actionFormData.append("icon", icon || DEFAULT_SECTOR_ICON);
        // Usar el color seleccionado o generar uno aleatorio
        actionFormData.append("color", color || generateRandomColor());
        // Agregar descripción si existe
        if (description?.trim()) {
          actionFormData.append("description", description.trim());
        }

        const result = isEditing
          ? await updateSectorAction(sector.id, actionFormData)
          : await createSectorAction(actionFormData);

        if (result.success && result.data) {
          // Mostrar toast de éxito
          if (isEditing) {
            toast.success("Sector actualizado", {
              description: `El sector "${result.data.name}" ha sido actualizado exitosamente.`,
            });
          } else {
            toast.success("Sector creado", {
              description: `El sector "${result.data.name}" ha sido creado exitosamente.`,
            });
          }

          // Resetear el formulario
          try {
            if (formRef.current) {
              formRef.current.reset();
            }
            // Al crear, usar icono por defecto, generar nuevo color aleatorio y resetear prioridad para la próxima vez
            // Al editar, el useEffect actualizará los valores cuando se abra el diálogo de nuevo
            if (!isEditing) {
              setIcon(DEFAULT_SECTOR_ICON);
              setColor(generateRandomColor());
              setPriority("");
            }
          } catch (err) {
            // Ignorar errores al resetear (puede ocurrir si el formulario ya fue desmontado)
            console.debug("No se pudo resetear el formulario:", err);
          }

          // Cerrar el diálogo
          onOpenChange(false);

          // Llamar onSuccess con el sector creado/actualizado
          // Usar setTimeout mínimo para asegurar que el diálogo se procesó primero
          if (onSuccess && result.data) {
            setTimeout(() => {
              onSuccess(result.data!);
            }, 0);
          }
        } else {
          const errorMessage = result.error || "Ocurrió un error";
          setError(errorMessage);
          toast.error("Error", {
            description: errorMessage,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Ocurrió un error";
        setError(errorMessage);
        toast.error("Error", {
          description: errorMessage,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form ref={formRef} onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Sector" : "Crear Nuevo Sector"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica la informaci?n del sector."
                : "Completa los datos para crear un nuevo sector."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={sector?.name || ""}
                placeholder="Ej: UCI, Emergencias, Consultorios"
                required
                maxLength={100}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Máximo 100 caracteres
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Prioridad *</Label>
              <Select
                value={priority}
                onValueChange={setPriority}
                required
                disabled={isPending}
              >
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue placeholder="Selecciona una prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="priority" value={priority} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="icon">Icono</Label>
              <IconPicker
                value={icon}
                onValueChange={setIcon}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Selecciona un icono para identificar este sector
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={isPending}
                  className="h-10 w-20 rounded-md border border-input bg-background cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3B82F6"
                  disabled={isPending}
                  className="flex-1"
                  maxLength={7}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Selecciona un color para identificar este sector
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={sector?.description || ""}
                placeholder="Descripción opcional del sector..."
                rows={3}
                disabled={isPending}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? "Guardando..."
                  : "Creando..."
                : isEditing
                ? "Guardar Cambios"
                : "Crear Sector"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
