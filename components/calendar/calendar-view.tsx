"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScheduleWithDetails, ScheduleGroupSlot, Group } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Clock } from "lucide-react";

export type CalendarViewType = "month" | "week" | "3days";

interface CalendarViewProps {
  currentDate: Date;
  schedules: ScheduleWithDetails[];
  groupIcons: Map<string, string>;
  isLoading?: boolean;
  onDayClick?: (date: Date) => void;
  viewType?: CalendarViewType;
}

// Helper para obtener el componente de icono
const getIconComponent = (iconName: string | null | undefined, defaultIcon: LucideIcon = Clock): LucideIcon => {
  if (!iconName) return defaultIcon;
  try {
    const IconComponent = (
      LucideIcons as unknown as Record<string, LucideIcon>
    )[iconName];
    return IconComponent || defaultIcon;
  } catch {
    return defaultIcon;
  }
};

// Helper para obtener el valor numérico de priority para ordenar
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

// Helper para obtener el slot con mayor prioridad
type SlotWithGroup = ScheduleGroupSlot & { group: Group; priority?: string | null };
const getHighestPrioritySlot = (slots: SlotWithGroup[] | null | undefined): SlotWithGroup | null => {
  if (!slots || slots.length === 0) return null;
  
  // Crear copia del array para no mutar el original
  const sortedSlots = [...slots].sort((a, b) => {
    const priorityA = getPriorityValue(a.priority);
    const priorityB = getPriorityValue(b.priority);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // Si tienen la misma priority, mantener orden por created_at
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  
  return sortedSlots[0];
};

// Helper para formatear fecha como clave
const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper para verificar si una fecha es hoy
const isTodayDate = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Helper para renderizar un día individual
interface DayCellProps {
  date: Date;
  daySchedules: ScheduleWithDetails[];
  groupIcons: Map<string, string>;
  isToday: boolean;
  onDayClick?: (date: Date) => void;
  maxSchedules?: number;
  className?: string;
  showWeekDay?: boolean;
  weekDayLabel?: string;
}

const DayCell = ({
  date,
  daySchedules,
  groupIcons,
  isToday,
  onDayClick,
  maxSchedules = 2,
  className,
  showWeekDay = false,
  weekDayLabel,
}: DayCellProps) => {
  const dayNumber = date.getDate();
  const weekDay = weekDayLabel || date.toLocaleDateString("es-ES", { weekday: "short" });

  return (
    <div
      className={cn(
        "border rounded-md p-2 sm:p-3 flex flex-col",
        isToday && "border-primary border-2 bg-primary/5",
        onDayClick && "cursor-pointer hover:bg-accent/50 transition-colors",
        className
      )}
      onClick={() => onDayClick?.(date)}
    >
      {/* Header del día */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "text-base sm:text-lg font-semibold",
                isToday && "text-primary"
              )}
            >
              {dayNumber}
            </div>
            {showWeekDay && (
              <div
                className={cn(
                  "text-sm font-medium",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}
              >
                {weekDay}
              </div>
            )}
          </div>
          {!showWeekDay && (
            <div className="text-[10px] xs:text-xs text-muted-foreground">
              {weekDay}
            </div>
          )}
        </div>
      </div>

      {/* Horarios del día */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {daySchedules.slice(0, maxSchedules).map((schedule) => {
          const slots = schedule.group_slots || schedule.group_roles || [];
          const firstSlot = getHighestPrioritySlot(slots);
          const firstGroup = firstSlot?.group;
          const groupId = firstGroup?.id;
          const slotIcon = firstSlot?.icon;
          const iconName = slotIcon || (groupId
            ? groupIcons.get(groupId) || "Clock"
            : "Clock");
          const displayName = firstGroup?.name || "Sin grupo";
          const slotLabel = firstSlot?.slot_label;
          
          const assignment = schedule.member_assignments?.[0];
          const sectorIcon = assignment?.sector?.icon;
          const iconToShow = slotIcon || sectorIcon || iconName;
          const IconComponent = getIconComponent(iconToShow, Clock);

          return (
            <Badge
              key={schedule.id}
              variant="secondary"
              className="w-full text-left justify-start text-xs sm:text-sm p-2 cursor-pointer hover:opacity-80 leading-tight gap-2 border-primary"
            >
              <IconComponent className="h-4 w-4 flex-shrink-0 text-primary" />
              <div className="truncate flex-1 min-w-0">
                <div className="font-medium truncate leading-tight">
                  {displayName}
                  {slotLabel && (
                    <span className="ml-1 opacity-75">({slotLabel})</span>
                  )}
                </div>
                {schedule.notes && (
                  <div className="text-[10px] xs:text-xs opacity-75 leading-tight mt-0.5 truncate">
                    {schedule.notes}
                  </div>
                )}
              </div>
            </Badge>
          );
        })}
        {daySchedules.length > maxSchedules && (
          <div className="text-xs text-muted-foreground text-center pt-1">
            +{daySchedules.length - maxSchedules} más
          </div>
        )}
      </div>
    </div>
  );
};

export function CalendarView({
  currentDate,
  schedules,
  groupIcons,
  isLoading = false,
  onDayClick,
  viewType = "month",
}: CalendarViewProps) {
  // Crear mapa de horarios por fecha
  const schedulesByDate = new Map<string, ScheduleWithDetails[]>();
  schedules.forEach((schedule) => {
    const dateKey = schedule.schedule_date;
    if (!schedulesByDate.has(dateKey)) {
      schedulesByDate.set(dateKey, []);
    }
    schedulesByDate.get(dateKey)!.push(schedule);
  });

  // Días de la semana en español
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Renderizar vista de mes
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Función para verificar si es hoy
    const isToday = (day: number | null) => {
      if (day === null) return false;
      const today = new Date();
      return (
        today.getDate() === day &&
        today.getMonth() === month &&
        today.getFullYear() === year
      );
    };

    // Generar filas de días
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    // Días vacíos al inicio
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Días vacíos al final
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return (
      <>
        {/* Header de días de la semana */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-2 mb-2 sm:mb-3 md:mb-4">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-[10px] xs:text-xs sm:text-sm text-muted-foreground py-1 sm:py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendario */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-2 w-full">
          {weeks.flat().map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square border rounded sm:rounded-md md:rounded-lg bg-muted/30 min-h-[40px] sm:min-h-[50px] md:min-h-[60px]"
                />
              );
            }

            const date = new Date(year, month, day);
            const dateKey = formatDateKey(date);
            const daySchedules = schedulesByDate.get(dateKey) || [];
            const today = isToday(day);

            return (
              <div
                key={`day-${day}`}
                className={cn(
                  "aspect-square border rounded sm:rounded-md md:rounded-lg p-0.5 sm:p-1 md:p-2 flex flex-col min-h-[40px] sm:min-h-[50px] md:min-h-[60px]",
                  today && "border-primary border-2 bg-primary/5",
                  onDayClick && "cursor-pointer hover:bg-accent/50 transition-colors"
                )}
                onClick={() => {
                  if (onDayClick) {
                    onDayClick(date);
                  }
                }}
              >
                {/* Número del día */}
                <div
                  className={cn(
                    "text-[10px] xs:text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1 flex-shrink-0",
                    today && "text-primary"
                  )}
                >
                  {day}
                </div>

                {/* Horarios del día */}
                <div className="flex-1 overflow-hidden space-y-0.5 sm:space-y-1 min-h-0">
                  {daySchedules.slice(0, 2).map((schedule) => {
                    const slots = schedule.group_slots || schedule.group_roles || [];
                    const firstSlot = getHighestPrioritySlot(slots);
                    const firstGroup = firstSlot?.group;
                    const groupId = firstGroup?.id;
                    const slotIcon = firstSlot?.icon;
                    const iconName = slotIcon || (groupId
                      ? groupIcons.get(groupId) || "Clock"
                      : "Clock");
                    const displayName = firstGroup?.name || "Sin grupo";
                    const slotLabel = firstSlot?.slot_label;
                    
                    const assignment = schedule.member_assignments?.[0];
                    const sectorIcon = assignment?.sector?.icon;
                    const iconToShow = slotIcon || sectorIcon || iconName;
                    const IconComponent = getIconComponent(iconToShow, Clock);

                    return (
                      <div key={schedule.id} className="block">
                        <Badge
                          variant="secondary"
                          className="w-full text-left justify-start text-[8px] xs:text-[10px] sm:text-xs p-0.5 sm:p-1 cursor-pointer hover:opacity-80 leading-tight gap-1 border-primary"
                        >
                          <IconComponent 
                            className="h-3 w-3 flex-shrink-0 text-primary" 
                          />
                          <div className="truncate flex-1 min-w-0">
                            <div className="font-medium truncate leading-tight">
                              {displayName}
                              {slotLabel && (
                                <span className="ml-1 opacity-75">({slotLabel})</span>
                              )}
                            </div>
                            {schedule.notes && (
                              <div className="text-[7px] xs:text-[8px] sm:text-[10px] opacity-75 leading-tight hidden sm:block truncate">
                                {schedule.notes}
                              </div>
                            )}
                          </div>
                        </Badge>
                      </div>
                    );
                  })}
                  {daySchedules.length > 2 && (
                    <div className="text-[8px] xs:text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                      +{daySchedules.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // Renderizar vista de semana
  const renderWeekView = () => {
    // Calcular inicio de la semana (domingo)
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }

    // Agrupar días en filas de 3
    const dayRows: Date[][] = [];
    for (let i = 0; i < days.length; i += 3) {
      dayRows.push(days.slice(i, i + 3));
    }

    return (
      <>
        {/* Días de la semana - columna en mobile, grid en desktop */}
        <div className="flex flex-col gap-4 w-full">
          {dayRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-col md:grid md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full min-h-[300px]">
              {row.map((date) => {
                const dateKey = formatDateKey(date);
                const daySchedules = schedulesByDate.get(dateKey) || [];
                const isToday = isTodayDate(date);
                const weekDay = weekDays[date.getDay()];
                return (
                  <DayCell
                    key={dateKey}
                    date={date}
                    daySchedules={daySchedules}
                    groupIcons={groupIcons}
                    isToday={isToday}
                    onDayClick={onDayClick}
                    maxSchedules={10}
                    showWeekDay={true}
                    weekDayLabel={weekDay}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </>
    );
  };

  // Renderizar vista de 3 días
  const render3DaysView = () => {
    const days: Date[] = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);
      days.push(date);
    }

    return (
      <>
        {/* 3 días - columna en mobile, grid en desktop */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col md:grid md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full min-h-[500px]">
            {days.map((date) => {
              const dateKey = formatDateKey(date);
              const daySchedules = schedulesByDate.get(dateKey) || [];
              const isToday = isTodayDate(date);
              const weekDay = weekDays[date.getDay()];
              return (
                <DayCell
                  key={dateKey}
                  date={date}
                  daySchedules={daySchedules}
                  groupIcons={groupIcons}
                  isToday={isToday}
                  onDayClick={onDayClick}
                  maxSchedules={15}
                  showWeekDay={true}
                  weekDayLabel={weekDay}
                />
              );
            })}
          </div>
        </div>
      </>
    );
  };

  return (
    <Card className="p-2 sm:p-3 md:p-4 lg:p-6 w-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
      <div className={cn("w-full transition-opacity duration-200", isLoading ? "opacity-50" : "opacity-100")}>
        {viewType === "month" && renderMonthView()}
        {viewType === "week" && renderWeekView()}
        {viewType === "3days" && render3DaysView()}
      </div>
    </Card>
  );
}
