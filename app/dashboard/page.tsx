import type { Metadata } from "next";
import { getSchedulesWithDetails } from "@/lib/services/schedules";
import { getMonthStart, getMonthEnd } from "@/lib/utils/date";
import { CalendarDashboard } from "@/components/calendar/calendar-dashboard";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import type { DailyScheduleWithDetails } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Dashboard - Organizador de Equipos",
  description: "Visualiza tus horarios y equipos en un calendario interactivo",
};

export default async function DashboardPage() {
  // Obtener horarios del mes actual
  const today = new Date();
  const startDate = getMonthStart(today);
  const endDate = getMonthEnd(today);

  let schedules: DailyScheduleWithDetails[] = [];
  try {
    schedules = await getSchedulesWithDetails(startDate, endDate);
  } catch (error) {
    // Log del error para debugging
    console.error("Error al cargar horarios:", error);
    // Mostrar más detalles del error
    if (error instanceof Error) {
      console.error("Mensaje de error:", error.message);
      console.error("Stack:", error.stack);
      // Si es un error de autenticación, dejar que se propague al error boundary
      if (error.message.includes("no autenticado")) {
        throw error;
      }
    } else {
      console.error("Error completo:", JSON.stringify(error, null, 2));
    }
    // Para otros errores, continuar con array vacío para que la UI no falle
    // El error boundary manejará errores críticos
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardBreadcrumb />
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visualiza tus horarios y equipos
        </p>
      </div>
      <CalendarDashboard initialSchedules={schedules} initialDate={today} />
    </div>
  );
}
