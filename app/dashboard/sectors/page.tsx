import type { Metadata } from "next";
import { getUserSectors } from "@/lib/services/sectors";
import { SectorsList } from "@/components/sectors/sectors-list";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import type { Sector } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Sectores - Organizador de Equipos",
  description: "Gestiona tus sectores de trabajo y organiza tu calendario",
};

export default async function SectorsPage() {
  // Obtener sectores del usuario
  let sectors: Sector[] = [];
  try {
    sectors = await getUserSectors();
  } catch (error) {
    // Log del error para debugging
    console.error("Error al cargar sectores:", error);
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
        <h1 className="text-2xl font-bold">Sectores</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tus sectores de trabajo
        </p>
      </div>
      <SectorsList initialSectors={sectors} />
    </div>
  );
}
