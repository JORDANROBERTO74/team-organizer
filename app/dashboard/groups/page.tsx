import type { Metadata } from "next";
import { getUserGroupsWithMembers } from "@/lib/services/groups";
import { GroupsList } from "@/components/groups/groups-list";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import type { GroupWithMembers } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Grupos - Organizador de Equipos",
  description: "Gestiona tus grupos de trabajo y organiza tus equipos",
};

export default async function GroupsPage() {
  // Obtener grupos del usuario con sus miembros
  let groups: GroupWithMembers[] = [];
  try {
    groups = await getUserGroupsWithMembers();
  } catch (error) {
    // Log del error para debugging
    console.error("Error al cargar grupos:", error);
    // Si es un error de autenticación, dejar que se propague al error boundary
    if (error instanceof Error && error.message.includes("no autenticado")) {
      throw error;
    }
    // Para otros errores, continuar con array vacío para que la UI no falle
    // El error boundary manejará errores críticos
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardBreadcrumb />
      <div>
        <h1 className="text-2xl font-bold">Grupos</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tus grupos de trabajo
        </p>
      </div>
      <GroupsList initialGroups={groups} />
    </div>
  );
}
