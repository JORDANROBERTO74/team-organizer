"use client";

import { useState, useTransition, useRef } from "react";
import {
  createGroupAction,
  updateGroupAction,
} from "@/app/dashboard/actions/group-actions";
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
import { Separator } from "@/components/ui/separator";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { GroupWithMembers } from "@/lib/types/database";
import { useEffect } from "react";

interface GroupFormProps {
  group?: GroupWithMembers | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (group: GroupWithMembers) => void;
}

interface MemberForm {
  id: string;
  first_name: string;
  last_name: string;
  isExisting?: boolean; // Para distinguir miembros existentes de nuevos
}

export function GroupForm({
  group,
  open,
  onOpenChange,
  onSuccess,
}: GroupFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [members, setMembers] = useState<MemberForm[]>([]);

  const isEditing = !!group;

  // Inicializar miembros cuando se abre el diálogo
  useEffect(() => {
    if (!open) {
      // Resetear cuando se cierra el diálogo
      setMembers([]);
      return;
    }

    if (group && isEditing) {
      // Convertir miembros existentes al formato MemberForm
      const existingMembers: MemberForm[] = (group.members || []).map(
        (member) => ({
          id: member.id,
          first_name: member.first_name,
          last_name: member.last_name,
          isExisting: true,
        })
      );
      setMembers(existingMembers);
    } else {
      // Al crear, iniciar con array vacío
      setMembers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Solo dependemos de 'open' para evitar reseteos innecesarios

  // Wrapper para onOpenChange (el reset de miembros lo maneja el useEffect)
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const addMember = () => {
    setMembers([
      ...members,
      {
        id: `temp-${Date.now()}-${Math.random()}`,
        first_name: "",
        last_name: "",
      },
    ]);
  };

  const removeMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const isExistingMember = (id: string): boolean => {
    return members.find((m) => m.id === id)?.isExisting === true;
  };

  const updateMember = (
    id: string,
    field: "first_name" | "last_name",
    value: string
  ) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;

    if (!name || name.trim() === "") {
      setError("El nombre del grupo es requerido");
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const actionFormData = new FormData();
        actionFormData.append("name", name.trim());
        if (description?.trim()) {
          actionFormData.append("description", description.trim());
        }

        // Si se está editando, siempre enviar members_to_keep (incluso si está vacío)
        // para indicar explícitamente qué miembros mantener
        if (isEditing) {
          const existingMemberIds = members
            .filter((m) => m.isExisting && m.id && m.first_name.trim().length > 0 && m.last_name.trim().length > 0)
            .map((m) => m.id!);
          
          // Siempre enviar members_to_keep al editar, incluso si está vacío
          actionFormData.append(
            "members_to_keep",
            JSON.stringify(existingMemberIds)
          );
        }

        // Agregar miembros al FormData si hay miembros válidos
        if (members.length > 0) {
          // Filtrar miembros con datos válidos (nombre y apellido con al menos 1 carácter)
          const validMembers = members.filter(
            (m) =>
              m.first_name.trim().length > 0 && m.last_name.trim().length > 0
          );

          // Si hay miembros pero ninguno es válido, informar al usuario
          if (members.length > 0 && validMembers.length === 0) {
            setError(
              "Todos los miembros deben tener nombre y apellido completos"
            );
            return;
          }

          // Verificar duplicados en el formulario
          const memberNames = new Set<string>();
          for (const member of validMembers) {
            const fullName = `${member.first_name
              .trim()
              .toLowerCase()}-${member.last_name.trim().toLowerCase()}`;
            if (memberNames.has(fullName)) {
              setError(
                `El miembro "${member.first_name} ${member.last_name}" está duplicado`
              );
              return;
            }
            memberNames.add(fullName);
          }

          // Agregar todos los miembros válidos (existentes y nuevos)
          validMembers.forEach((member) => {
            actionFormData.append(
              "members",
              JSON.stringify({
                id: member.isExisting ? member.id : undefined,
                first_name: member.first_name.trim(),
                last_name: member.last_name.trim(),
              })
            );
          });
        }

        const result = isEditing
          ? await updateGroupAction(group.id, actionFormData)
          : await createGroupAction(actionFormData);

        if (result.success && result.data) {
          // Mostrar toast de éxito
          if (isEditing) {
            toast.success("Grupo actualizado", {
              description: `El grupo "${result.data.name}" ha sido actualizado exitosamente.`,
            });
          } else {
            toast.success("Grupo creado", {
              description: `El grupo "${result.data.name}" ha sido creado exitosamente.`,
            });
          }

          // Resetear el formulario de forma segura antes de cerrar el diálogo
          try {
            if (formRef.current) {
              formRef.current.reset();
            }
          } catch (err) {
            // Ignorar errores al resetear (puede ocurrir si el formulario ya fue desmontado)
            console.debug("No se pudo resetear el formulario:", err);
          }

          // Resetear miembros
          setMembers([]);

          // Cerrar el diálogo
          handleOpenChange(false);

          // Llamar onSuccess con el grupo creado/actualizado
          // Usar setTimeout mínimo para asegurar que el diálogo se procesó primero
          if (onSuccess && result.data) {
            setTimeout(() => {
              // Convertir Group a GroupWithMembers si es necesario
              const groupWithMembers: GroupWithMembers =
                "members" in result.data
                  ? (result.data as GroupWithMembers)
                  : { ...result.data, members: [] };
              onSuccess(groupWithMembers);
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
        const errorMessage = err instanceof Error ? err.message : "Ocurrió un error";
        setError(errorMessage);
        toast.error("Error", {
          description: errorMessage,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <form ref={formRef} onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Grupo" : "Crear Nuevo Grupo"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica la información del grupo."
                : "Completa los datos para crear un nuevo grupo. Opcionalmente, puedes agregar miembros desde aquí."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={group?.name || ""}
                placeholder="Ej: Equipo de Desarrollo"
                required
                disabled={isPending}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={group?.description || ""}
                placeholder="Descripción opcional del grupo..."
                rows={3}
                disabled={isPending}
              />
            </div>

            {/* Sección de miembros */}
            <>
              <Separator />
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">
                      Miembros del Grupo
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isEditing
                        ? "Gestiona los miembros de este grupo"
                        : "Agrega miembros que pertenecerán a este grupo"}
                    </p>
                  </div>
                </div>

                {members.length > 0 ? (
                  <div className="grid gap-4 border rounded-lg p-4 bg-muted/30">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end"
                      >
                        <div className="grid gap-1.5">
                          <Label htmlFor={`member-firstname-${member.id}`}>
                            Nombre *
                          </Label>
                          <Input
                            id={`member-firstname-${member.id}`}
                            placeholder="Nombre"
                            value={member.first_name}
                            onChange={(e) =>
                              updateMember(
                                member.id,
                                "first_name",
                                e.target.value
                              )
                            }
                            disabled={isPending}
                            required
                            aria-required="true"
                            maxLength={255}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`member-lastname-${member.id}`}>
                            Apellido *
                          </Label>
                          <Input
                            id={`member-lastname-${member.id}`}
                            placeholder="Apellido"
                            value={member.last_name}
                            onChange={(e) =>
                              updateMember(
                                member.id,
                                "last_name",
                                e.target.value
                              )
                            }
                            disabled={isPending}
                            required
                            aria-required="true"
                            maxLength={255}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMember(member.id)}
                          disabled={isPending}
                          className="h-10 w-10 text-destructive hover:text-destructive"
                          title={
                            isExistingMember(member.id)
                              ? "Eliminar miembro"
                              : "Quitar miembro"
                          }
                          aria-label={
                            isExistingMember(member.id)
                              ? `Eliminar miembro ${member.first_name} ${member.last_name}`
                              : `Quitar miembro ${member.first_name} ${member.last_name}`
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addMember}
                      disabled={isPending}
                      className="flex items-center gap-2 w-full"
                      aria-label="Agregar otro miembro al grupo"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Miembro
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 border rounded-lg p-6 bg-muted/30">
                    <p className="text-sm text-muted-foreground italic text-center">
                      No hay miembros en este grupo. Haz clic en &quot;Agregar
                      Miembro&quot; para comenzar.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMember}
                      disabled={isPending}
                      className="flex items-center gap-2"
                      aria-label="Agregar primer miembro al grupo"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Miembro
                    </Button>
                  </div>
                )}
              </div>
            </>

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
              onClick={() => handleOpenChange(false)}
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
                : "Crear Grupo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
