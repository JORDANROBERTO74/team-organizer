"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  createSlotAction,
  updateSlotAction,
} from "@/app/dashboard/actions/slot-actions";
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
import type { GroupSlot } from "@/lib/types/database";

interface SlotFormProps {
  slot?: GroupSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (slot: GroupSlot) => void;
}

// Icono por defecto para etiquetas
const DEFAULT_SLOT_ICON = "Clock";

export function SlotForm({
  slot,
  open,
  onOpenChange,
  onSuccess,
}: SlotFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [icon, setIcon] = useState<string>(slot?.icon || DEFAULT_SLOT_ICON);
  const [priority, setPriority] = useState<string>(slot?.priority || "");
  const formRef = useRef<HTMLFormElement>(null);

  const isEditing = !!slot;

  // Sincronizar el icono cuando se abre el diálogo o cambia la etiqueta
  useEffect(() => {
    if (!open) {
      return;
    }

    if (isEditing && slot) {
      // Al editar, mantener el icono existente
      setIcon(slot.icon || DEFAULT_SLOT_ICON);
      setPriority(slot.priority || "");
    } else {
      // Al crear, usar el icono por defecto
      setIcon(DEFAULT_SLOT_ICON);
      setPriority("");
    }
    setError(null); // Limpiar errores al abrir el diálogo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Solo dependemos de 'open' para evitar reseteos innecesarios

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const slot_label = formData.get("slot_label") as string;
    const priorityValue = priority || (formData.get("priority") as string);
    const description = formData.get("description") as string | null;

    if (!slot_label || slot_label.trim() === "") {
      setError("El nombre de la etiqueta es requerido");
      return;
    }

    const trimmedLabel = slot_label.trim();
    if (trimmedLabel.length > 40) {
      setError("El nombre de la etiqueta no puede tener más de 40 caracteres");
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
        actionFormData.append("slot_label", trimmedLabel);
        actionFormData.append("priority", priorityValue.trim());
        // Usar el icono seleccionado o el por defecto
        actionFormData.append("icon", icon || DEFAULT_SLOT_ICON);
        // Agregar descripción si existe
        if (description?.trim()) {
          actionFormData.append("description", description.trim());
        }

        const result = isEditing
          ? await updateSlotAction(slot.id, actionFormData)
          : await createSlotAction(actionFormData);

        if (result.success && result.data) {
          // Mostrar toast de éxito
          if (isEditing) {
            toast.success("Etiqueta actualizada", {
              description: `La etiqueta "${result.data.slot_label}" ha sido actualizada exitosamente.`,
            });
          } else {
            toast.success("Etiqueta creada", {
              description: `La etiqueta "${result.data.slot_label}" ha sido creada exitosamente.`,
            });
          }

          // Resetear el formulario
          try {
            if (formRef.current) {
              formRef.current.reset();
            }
            // Al crear, usar el icono por defecto para la próxima vez
            // Al editar, el useEffect actualizará el icono cuando se abra el diálogo de nuevo
            if (!isEditing) {
              setIcon(DEFAULT_SLOT_ICON);
            }
          } catch (err) {
            // Ignorar errores al resetear (puede ocurrir si el formulario ya fue desmontado)
            console.debug("No se pudo resetear el formulario:", err);
          }

          // Llamar onSuccess ANTES de cerrar el diálogo para evitar parpadeo
          if (onSuccess && result.data) {
            onSuccess(result.data);
          }

          // Cerrar el diálogo
          onOpenChange(false);
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
              {isEditing ? "Editar Etiqueta" : "Crear Nueva Etiqueta"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica la información de la etiqueta."
                : "Completa los datos para crear una nueva etiqueta."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="slot_label">Nombre de la Etiqueta *</Label>
              <Input
                id="slot_label"
                name="slot_label"
                defaultValue={slot?.slot_label || ""}
                placeholder="Ej: Turno, Apoyo, etc."
                required
                maxLength={40}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Máximo 40 caracteres
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
                Selecciona un icono para identificar esta etiqueta
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={slot?.description || ""}
                placeholder="Descripción opcional de la etiqueta..."
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
                : "Crear Etiqueta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
