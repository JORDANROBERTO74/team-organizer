"use client";

import { useState, useTransition } from "react";
import { deleteGroupAction } from "@/app/dashboard/actions/group-actions";
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
import { Badge } from "@/components/ui/badge";
import { GroupForm } from "./group-form";
import { Pencil, Trash2, Users, User } from "lucide-react";
import { toast } from "sonner";
import type { GroupWithMembers, Group } from "@/lib/types/database";

interface GroupsListProps {
  initialGroups: GroupWithMembers[];
}

export function GroupsList({ initialGroups }: GroupsListProps) {
  // Estado local de grupos - se inicializa con initialGroups de SSR
  // Todas las actualizaciones (crear, editar, eliminar) se hacen directamente en este estado
  // sin necesidad de refetch a la API
  const [groups, setGroups] = useState<GroupWithMembers[]>(initialGroups);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupWithMembers | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<GroupWithMembers | null>(null);

  const handleDelete = async () => {
    if (!deletingGroup) return;

    const groupIdToDelete = deletingGroup.id;
    const groupName = deletingGroup.name;

    // Actualización optimista: eliminar del estado local inmediatamente
    const previousGroups = [...groups];
    setGroups((prev) => prev.filter((g) => g.id !== groupIdToDelete));
    setDeletingGroup(null);

    startTransition(async () => {
      try {
        const result = await deleteGroupAction(groupIdToDelete);
        if (!result.success) {
          // Revertir si falla
          setGroups(previousGroups);
          toast.error("Error al eliminar", {
            description: result.error || "No se pudo eliminar el grupo.",
          });
        } else {
          toast.success("Grupo eliminado", {
            description: `El grupo "${groupName}" ha sido eliminado exitosamente.`,
          });
        }
      } catch (err) {
        // Revertir si hay error
        setGroups(previousGroups);
        toast.error("Error al eliminar", {
          description:
            err instanceof Error ? err.message : "No se pudo eliminar el grupo.",
        });
      }
    });
  };

  const handleCreateSuccess = (newGroup: GroupWithMembers) => {
    // Actualizar estado local directamente sin refetch
    // El grupo ya viene con miembros desde createGroupAction
    setGroups((prev) => [...prev, newGroup]);
  };

  const handleUpdateSuccess = (updatedGroup: GroupWithMembers) => {
    // Actualizar estado local directamente sin refetch
    setGroups((prev) =>
      prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
    );
  };

  if (groups.length === 0) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex gap-2 items-center justify-between">
              <div>
                <CardTitle>No hay grupos</CardTitle>
                <CardDescription>
                  Crea tu primer grupo para comenzar a organizar tus equipos
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Crear Grupo
              </Button>
            </div>
          </CardHeader>
        </Card>

        <GroupForm
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
            {groups.length}{" "}
            {groups.length === 1 ? "grupo" : "grupos"}
          </h2>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Crear Grupo</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Users className="h-5 w-5 text-primary flex-shrink-0" />
                  <CardTitle className="truncate">{group.name}</CardTitle>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingGroup(group)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingGroup(group)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {group.description ? (
                <CardDescription className="line-clamp-2">
                  {group.description}
                </CardDescription>
              ) : (
                <CardDescription className="text-muted-foreground italic">
                  Sin descripción
                </CardDescription>
              )}
              
              {/* Mostrar miembros del grupo */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {group.members?.length || 0}{" "}
                    {group.members?.length === 1 ? "miembro" : "miembros"}
                  </span>
                </div>
                {group.members && group.members.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {group.members.slice(0, 5).map((member) => (
                      <Badge
                        key={member.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {member.first_name} {member.last_name}
                      </Badge>
                    ))}
                    {group.members.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{group.members.length - 5} más
                      </Badge>
                    )}
                  </div>
                )}
                {(!group.members || group.members.length === 0) && (
                  <p className="text-xs text-muted-foreground italic">
                    Sin miembros aún
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                Creado: {new Date(group.created_at).toLocaleDateString("es-ES")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <GroupForm
        group={editingGroup}
        open={!!editingGroup}
        onOpenChange={(open) => !open && setEditingGroup(null)}
        onSuccess={handleUpdateSuccess}
      />

      <GroupForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <Dialog
        open={!!deletingGroup}
        onOpenChange={(open) => !open && setDeletingGroup(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar grupo?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el grupo{" "}
              <strong>{deletingGroup?.name}</strong>
              {deletingGroup?.members && deletingGroup.members.length > 0 && (
                <>
                  {" "}
                  junto con sus <strong>{deletingGroup.members.length}</strong>{" "}
                  {deletingGroup.members.length === 1
                    ? "miembro"
                    : "miembros"}
                </>
              )}
              {" "}y todos sus datos asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingGroup(null)}
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
