"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { CalendarView, type CalendarViewType } from "./calendar-view";
import {
  loadSchedulesForMonth,
  deleteScheduleAction,
} from "@/app/dashboard/actions/schedule-actions";
import type {
  ScheduleWithDetails,
  ScheduleGroupSlot,
  Group,
} from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Pencil,
  Trash2,
  Share2,
  Copy,
  Clock,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScheduleForm } from "@/components/schedules/schedule-form";

interface CalendarDashboardProps {
  initialSchedules: ScheduleWithDetails[];
  initialDate: Date;
}

export function CalendarDashboard({
  initialSchedules,
  initialDate,
}: CalendarDashboardProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [schedules, setSchedules] =
    useState<ScheduleWithDetails[]>(initialSchedules);
  const [isLoading, setIsLoading] = useState(false);
  const [viewType, setViewType] = useState<CalendarViewType>("month");

  // Estado para el formulario y resumen
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] =
    useState<ScheduleWithDetails | null>(null);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<ScheduleWithDetails | null>(null);
  const [deletingSchedule, setDeletingSchedule] =
    useState<ScheduleWithDetails | null>(null);
  const [isPending, startTransition] = useTransition();

  // Cache para almacenar meses visitados y evitar recargas
  const monthsCache = useRef<Map<string, ScheduleWithDetails[]>>(new Map());

  // Inicializar caché con datos iniciales
  useEffect(() => {
    const key = `${initialDate.getFullYear()}-${initialDate.getMonth()}`;
    if (!monthsCache.current.has(key)) {
      monthsCache.current.set(key, initialSchedules);
    }
  }, []); // Se ejecuta solo al montar

  // Cargar horarios cuando cambia el mes
  const fetchSchedules = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const cacheKey = `${year}-${month}`;

    // Verificar si ya tenemos los datos en caché
    if (monthsCache.current.has(cacheKey)) {
      setSchedules(monthsCache.current.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    try {
      const result = await loadSchedulesForMonth(year, month);
      if (result.success) {
        setSchedules(result.data);
        monthsCache.current.set(cacheKey, result.data); // Guardar en caché
      } else {
        console.error("Error al cargar horarios:", result.error);
      }
    } catch (error) {
      console.error("Error al cargar horarios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Solo hacer fetch si la fecha cambió respecto a la inicial
    const initialYear = initialDate.getFullYear();
    const initialMonth = initialDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    if (currentYear !== initialYear || currentMonth !== initialMonth) {
      fetchSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  // Funciones de navegación
  const goToPrevious = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (viewType === "month") {
        newDate.setMonth(prev.getMonth() - 1);
      } else if (viewType === "week") {
        newDate.setDate(prev.getDate() - 7);
      } else {
        // 3days
        newDate.setDate(prev.getDate() - 3);
      }
      return newDate;
    });
  };

  const goToNext = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (viewType === "month") {
        newDate.setMonth(prev.getMonth() + 1);
      } else if (viewType === "week") {
        newDate.setDate(prev.getDate() + 7);
      } else {
        // 3days
        newDate.setDate(prev.getDate() + 3);
      }
      return newDate;
    });
  };

  // Obtener nombre del mes en español
  const getMonthName = (date: Date): string => {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return months[date.getMonth()];
  };

  // Obtener título según el tipo de vista
  const getViewTitle = (): string => {
    if (viewType === "month") {
      return `${getMonthName(currentDate)} ${currentDate.getFullYear()}`;
    } else if (viewType === "week") {
      // Calcular inicio y fin de la semana (domingo a sábado)
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day; // Restar días hasta domingo
      startOfWeek.setDate(diff);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startMonth = getMonthName(startOfWeek);
      const endMonth = getMonthName(endOfWeek);
      const startDay = startOfWeek.getDate();
      const endDay = endOfWeek.getDate();
      const year = startOfWeek.getFullYear();

      if (startMonth === endMonth) {
        return `${startDay}-${endDay} ${startMonth} ${year}`;
      } else {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
      }
    } else {
      // 3 días
      const day1 = new Date(currentDate);
      const day2 = new Date(currentDate);
      day2.setDate(day2.getDate() + 1);
      const day3 = new Date(currentDate);
      day3.setDate(day3.getDate() + 2);

      const month1 = getMonthName(day1);
      const month3 = getMonthName(day3);
      const day1Num = day1.getDate();
      const day3Num = day3.getDate();
      const year = day1.getFullYear();

      if (month1 === month3) {
        return `${day1Num}-${day3Num} ${month1} ${year}`;
      } else {
        return `${day1Num} ${month1} - ${day3Num} ${month3} ${year}`;
      }
    }
  };

  // Verificar si la fecha actual es el mes actual
  const isCurrentMonth = () => {
    const today = new Date();
    return (
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Crear mapa de iconos de grupos
  const groupIcons = new Map<string, string>();

  schedules.forEach((schedule) => {
    const processSlot = (slot: ScheduleGroupSlot & { group: Group }) => {
      if (slot.group) {
        const groupId = slot.group.id;

        // Lógica de iconos
        if (slot.icon && !groupIcons.has(groupId)) {
          groupIcons.set(groupId, slot.icon);
        } else if (!groupIcons.has(groupId)) {
          const assignment = schedule.member_assignments?.find((a) => a.sector);
          if (assignment?.sector) {
            groupIcons.set(groupId, assignment.sector.icon || "Clock");
          } else {
            groupIcons.set(groupId, "Clock");
          }
        }
      }
    };

    schedule.group_slots?.forEach(processSlot);
    schedule.group_roles?.forEach(processSlot);
  });

  // Manejar click en día
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);

    // Obtener schedules para este día
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;
    const daySchedules = schedules.filter((s) => s.schedule_date === dateKey);

    // Si hay un turno, mostrar resumen primero
    if (daySchedules.length > 0) {
      setSelectedSchedule(daySchedules[0]); // Solo hay un turno por día
      setIsSummaryDialogOpen(true);
    } else {
      // Si no hay turno, abrir el formulario de creación
      setEditingSchedule(null);
      setIsScheduleFormOpen(true);
    }
  };

  const handleEditFromSummary = () => {
    if (selectedSchedule) {
      setEditingSchedule(selectedSchedule);
      setIsSummaryDialogOpen(false);
      setIsScheduleFormOpen(true);
    }
  };

  // Generar texto del resumen del turno
  const generateScheduleSummaryText = (
    schedule: ScheduleWithDetails
  ): string => {
    if (!selectedDate || !schedule) return "";

    const dateStr = selectedDate.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let text = `*Turno Programado*\n ${dateStr}\n\n`;

    if (schedule.group_slots && schedule.group_slots.length > 0) {
      schedule.group_slots.forEach((groupSlot) => {
        const group = groupSlot.group;
        if (!group) return;

        text += `*${group.name}*`;
        if (groupSlot.slot_label) {
          text += ` - ${groupSlot.slot_label}`;
        }
        text += `\n`;

        // Agregar miembros asignados de este grupo
        const groupMembers =
          schedule.member_assignments?.filter(
            (assignment) => assignment.member.group_id === group.id
          ) || [];

        if (groupMembers.length > 0) {
          groupMembers.forEach((assignment) => {
            const memberName = `${assignment.member.first_name} ${assignment.member.last_name}`;
            const sectorName = assignment.sector?.name || "Sin sector";
            text += `  • ${memberName} - ${sectorName}\n`;
          });
        }
        text += `\n`;
      });
    }

    if (schedule.notes) {
      text += `📝 *Notas:* ${schedule.notes}\n`;
    }

    return text;
  };

  // Compartir por WhatsApp
  const handleShareWhatsApp = () => {
    if (!selectedSchedule) return;

    const text = generateScheduleSummaryText(selectedSchedule);
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  };

  // Copiar al portapapeles
  const handleCopyToClipboard = async () => {
    if (!selectedSchedule) return;

    const text = generateScheduleSummaryText(selectedSchedule);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Resumen copiado al portapapeles");
    } catch (error) {
      console.error("Error al copiar:", error);
      toast.error("Error al copiar al portapapeles");
    }
  };

  const handleScheduleSuccess = () => {
    // Invalidar caché del mes actual y recargar
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const cacheKey = `${year}-${month}`;
    monthsCache.current.delete(cacheKey);
    fetchSchedules();
  };

  const handleDeleteSchedule = async () => {
    if (!deletingSchedule) return;

    const scheduleIdToDelete = deletingSchedule.id;
    const scheduleDate = deletingSchedule.schedule_date;

    // Actualización optimista: eliminar del estado local inmediatamente
    const previousSchedules = [...schedules];
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleIdToDelete));
    setDeletingSchedule(null);

    // Actualizar también en el caché
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const cacheKey = `${year}-${month}`;
    if (monthsCache.current.has(cacheKey)) {
      const cachedSchedules = monthsCache.current.get(cacheKey)!;
      monthsCache.current.set(
        cacheKey,
        cachedSchedules.filter((s) => s.id !== scheduleIdToDelete)
      );
    }

    startTransition(async () => {
      try {
        const result = await deleteScheduleAction(scheduleIdToDelete);
        if (!result.success) {
          // Revertir si falla
          setSchedules(previousSchedules);
          if (monthsCache.current.has(cacheKey)) {
            monthsCache.current.set(cacheKey, previousSchedules);
          }
          toast.error("Error al eliminar", {
            description: result.error || "No se pudo eliminar el turno.",
          });
        } else {
          toast.success("Turno eliminado", {
            description: `El turno del ${new Date(
              scheduleDate
            ).toLocaleDateString("es-ES")} ha sido eliminado exitosamente.`,
          });
        }
      } catch (err) {
        // Revertir si hay error
        setSchedules(previousSchedules);
        if (monthsCache.current.has(cacheKey)) {
          monthsCache.current.set(cacheKey, previousSchedules);
        }
        toast.error("Error al eliminar", {
          description:
            err instanceof Error
              ? err.message
              : "No se pudo eliminar el turno.",
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header del Calendario */}
      <div className="flex flex-col gap-3">
        {/* Controles de navegación y título */}
        <div className="flex items-center justify-between md:justify-start md:gap-12 py-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            disabled={isLoading}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl sm:text-2xl font-bold capitalize flex items-center gap-2">
              {getViewTitle()}
            </h2>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            disabled={isLoading}
            aria-label="Siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Controles de vista */}
        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex items-center justify-center rounded-lg border border-input bg-background p-1">
            <Button
              variant={viewType === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("month")}
              className="h-8 px-3"
            >
              Mes
            </Button>
            <Button
              variant={viewType === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("week")}
              className="h-8 px-3"
            >
              Semana
            </Button>
            <Button
              variant={viewType === "3days" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("3days")}
              className="h-8 px-3"
            >
              3 días
            </Button>
          </div>
        </div>
      </div>

      <CalendarView
        currentDate={currentDate}
        schedules={schedules}
        groupIcons={groupIcons}
        isLoading={isLoading}
        onDayClick={handleDayClick}
        viewType={viewType}
      />

      {/* Dialog de resumen del turno */}
      <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <DialogContent className="sm:max-w-lg flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl capitalize flex flex-col sm:block">
              <span>
                {selectedDate &&
                  selectedDate.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
              </span>
              <span className="hidden sm:inline"> de </span>
              <span className="text-muted-foreground sm:text-foreground font-normal sm:font-semibold text-lg sm:text-xl">
                {selectedDate?.getFullYear()}
              </span>
            </DialogTitle>
            <DialogDescription>Resumen del turno programado</DialogDescription>
          </DialogHeader>

          {selectedSchedule && (
            <div className="flex flex-col gap-4">
              {/* Botones de acción */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShareWhatsApp}
                    title="Compartir"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyToClipboard}
                    title="Copiar"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    onClick={handleEditFromSummary}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setDeletingSchedule(selectedSchedule)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Grupos y sus slots */}
              {selectedSchedule.group_slots &&
                selectedSchedule.group_slots.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {selectedSchedule.group_slots.map((groupSlot) => {
                      const group = groupSlot.group;
                      const groupId = group?.id;

                      // Obtener miembros de este grupo que tienen asignaciones
                      const groupMembersRaw =
                        selectedSchedule.member_assignments?.filter(
                          (assignment) => assignment.member.group_id === groupId
                        ) || [];

                      // Función helper para obtener el valor numérico de priority para ordenar
                      const getPriorityValue = (priority: string | null | undefined): number => {
                        if (!priority) return 999; // Sin priority va al final
                        switch (priority) {
                          case "Alta":
                            return 1;
                          case "Media":
                            return 2;
                          case "Baja":
                            return 3;
                          default:
                            return 999;
                        }
                      };

                      // Ordenar miembros por prioridad del sector primero, luego por nombre del sector
                      const groupMembers = [...groupMembersRaw].sort((a, b) => {
                        const sectorA = a.sector;
                        const sectorB = b.sector;
                        
                        // Si ambos tienen sector, ordenar por prioridad primero
                        if (sectorA && sectorB) {
                          const priorityA = getPriorityValue(sectorA.priority);
                          const priorityB = getPriorityValue(sectorB.priority);
                          
                          // Si tienen diferente prioridad, ordenar por prioridad
                          if (priorityA !== priorityB) {
                            return priorityA - priorityB;
                          }
                          
                          // Si tienen la misma prioridad, ordenar por nombre del sector
                          return sectorA.name.localeCompare(sectorB.name);
                        }
                        
                        // Si solo uno tiene sector, el que tiene sector va primero
                        if (sectorA && !sectorB) return -1;
                        if (!sectorA && sectorB) return 1;
                        
                        // Si ninguno tiene sector, mantener orden original
                        return 0;
                      });

                      return (
                        <Card
                          key={groupSlot.id}
                          className="overflow-hidden border shadow-sm"
                        >
                          <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Badge
                                  variant="default"
                                  className="text-sm font-medium px-2 py-0.5"
                                >
                                  {group?.name || "Sin grupo"}
                                </Badge>
                                {groupSlot.slot_label && (() => {
                                  const slotIconName = groupSlot.icon;
                                  
                                  // Obtener el componente de icono del slot
                                  const getSlotIconComponent = (): LucideIcon => {
                                    if (!slotIconName) return Clock;
                                    try {
                                      const IconComponent = (
                                        LucideIcons as unknown as Record<
                                          string,
                                          LucideIcon
                                        >
                                      )[slotIconName];
                                      return IconComponent || Clock;
                                    } catch {
                                      return Clock;
                                    }
                                  };

                                  const SlotIconComponent = getSlotIconComponent();

                                  return (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs font-normal flex items-center gap-1.5"
                                    >
                                      <SlotIconComponent className="h-3 w-3" />
                                      {groupSlot.slot_label}
                                    </Badge>
                                  );
                                })()}
                              </div>
                            </div>

                            {group?.description && (
                              <p className="text-sm text-muted-foreground">
                                {group.description}
                              </p>
                            )}

                            {/* Miembros asignados de este grupo */}
                            {groupMembers.length > 0 && (
                              <div className="flex flex-col gap-2 bg-muted/30 rounded-md p-3">
                                <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Miembros Asignados
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  {groupMembers.map((assignment) => {
                                    const sector = assignment.sector;
                                    const sectorColor = sector?.color;
                                    const sectorIconName = sector?.icon;

                                    // Obtener el componente de icono del sector
                                    const getSectorIconComponent =
                                      (): LucideIcon => {
                                        if (!sectorIconName) return Building2;
                                        try {
                                          const IconComponent = (
                                            LucideIcons as unknown as Record<
                                              string,
                                              LucideIcon
                                            >
                                          )[sectorIconName];
                                          return IconComponent || Building2;
                                        } catch {
                                          return Building2;
                                        }
                                      };

                                    const SectorIconComponent =
                                      getSectorIconComponent();

                                    return (
                                      <div
                                        key={assignment.id}
                                        className="flex items-center justify-between text-sm"
                                      >
                                        <span className="font-medium">
                                          {assignment.member.first_name}{" "}
                                          {assignment.member.last_name}
                                        </span>
                                        {sector && (
                                          <div
                                            className="flex items-center gap-1.5 text-xs bg-background px-2 py-0.5 rounded-full border"
                                            style={
                                              sectorColor
                                                ? {
                                                    borderColor: sectorColor,
                                                    color: sectorColor,
                                                    backgroundColor: `${sectorColor}15`,
                                                  }
                                                : {
                                                    color:
                                                      "var(--muted-foreground)",
                                                    borderColor:
                                                      "var(--border)",
                                                  }
                                            }
                                          >
                                            <SectorIconComponent className="h-3 w-3" />
                                            {sector.name}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

              {/* Notas */}
              {selectedSchedule.notes && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md italic">
                  &quot;{selectedSchedule.notes}&quot;
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ScheduleForm
        date={selectedDate}
        open={isScheduleFormOpen}
        onOpenChange={(open) => {
          setIsScheduleFormOpen(open);
          if (!open) setEditingSchedule(null);
        }}
        onSuccess={handleScheduleSuccess}
        schedule={editingSchedule}
      />

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={!!deletingSchedule}
        onOpenChange={(open) => !open && setDeletingSchedule(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar turno?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el turno del{" "}
              <strong>
                {deletingSchedule &&
                  new Date(deletingSchedule.schedule_date).toLocaleDateString(
                    "es-ES",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
              </strong>{" "}
              y todos sus datos asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingSchedule(null)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSchedule}
              disabled={isPending}
            >
              {isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
