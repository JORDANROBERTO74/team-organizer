import type { Metadata } from "next";
import { getUserGroupSlots } from "@/lib/services/slots";
import { SlotsList } from "@/components/slots/slots-list";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import type { GroupSlot } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Etiquetas - Organizador de Equipos",
  description: "Gestiona las etiquetas de grupos para organizar tu calendario",
};

export default async function SlotsPage() {
  // Obtener etiquetas del usuario
  let slots: GroupSlot[] = [];
  try {
    slots = await getUserGroupSlots();
  } catch (error) {
    // Log del error para debugging
    console.error("Error al cargar etiquetas:", error);

    // Si es un error de autenticación, dejar que se propague al error boundary
    if (error instanceof Error && error.message.includes("no autenticado")) {
      throw error;
    }

    // Si es un error de tabla no encontrada (PGRST205), mostrar mensaje más descriptivo
    if (
      error instanceof Error &&
      (error.message.includes("PGRST205") ||
        error.message.includes("Could not find the table"))
    ) {
      console.error(
        "ERROR PGRST205: La tabla 'group_slots' no existe o no está en el schema cache de PostgREST.\n" +
          "SOLUCIÓN:\n" +
          "1. Verifica que la tabla existe ejecutando: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_slots';\n" +
          "2. Si no existe, ejecuta el script 'create-group-slots-table.sql' que creamos.\n" +
          "3. Si existe, ejecuta: NOTIFY pgrst, 'reload schema'; para recargar el schema cache.\n" +
          "4. También puedes intentar reiniciar el servicio de PostgREST en Supabase."
      );
      throw new Error(
        "La tabla 'group_slots' no existe o PostgREST no la puede encontrar. " +
          "Por favor, ejecuta el script SQL 'create-group-slots-table.sql' y luego recarga el schema cache: NOTIFY pgrst, 'reload schema';"
      );
    }

    // Para otros errores, continuar con array vacío para que la UI no falle
    // El error boundary manejará errores críticos
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardBreadcrumb />
      <div>
        <h1 className="text-2xl font-bold">Etiquetas</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona las etiquetas para organizar a tus grupos
        </p>
      </div>
      <SlotsList initialSlots={slots} />
    </div>
  );
}
