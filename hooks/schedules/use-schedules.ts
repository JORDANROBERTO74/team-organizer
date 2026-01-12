"use client";

import { useState, useEffect, useTransition } from "react";
import {
  loadSchedulesForMonth,
  loadSchedulesForRange,
  createScheduleAction,
  updateScheduleAction,
  deleteScheduleAction,
  addGroupRoleToScheduleAction,
  removeGroupRoleFromScheduleAction,
  addMemberAssignmentToScheduleAction,
  removeMemberAssignmentFromScheduleAction,
} from "@/app/dashboard/actions/schedule-actions";
import type {
  DailyScheduleWithDetails,
  DailyScheduleInsert,
  DailyGroupRoleInsert,
  DailyMemberAssignmentInsert,
} from "@/lib/types/database";

interface UseSchedulesOptions {
  initialSchedules?: DailyScheduleWithDetails[];
  initialYear?: number;
  initialMonth?: number;
}

export function useSchedules(options: UseSchedulesOptions = {}) {
  const { initialSchedules, initialYear, initialMonth } = options;
  const [schedules, setSchedules] = useState<DailyScheduleWithDetails[]>(initialSchedules || []);
  const [isLoading, setIsLoading] = useState(!initialSchedules || initialSchedules.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentYear, setCurrentYear] = useState(initialYear ?? new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialMonth ?? new Date().getMonth());
  const hasInitialSchedules = !!initialSchedules && initialSchedules.length > 0;

  useEffect(() => {
    // Solo cargar si no hay initialSchedules y la fecha cambió
    if (!hasInitialSchedules || 
        (currentYear !== (initialYear ?? new Date().getFullYear())) ||
        (currentMonth !== (initialMonth ?? new Date().getMonth()))) {
      let cancelled = false;
      
      const fetchSchedules = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await loadSchedulesForMonth(currentYear, currentMonth);
          if (!cancelled) {
            if (result.success) {
              setSchedules(result.data);
            } else {
              setError(result.error || "Error al cargar horarios");
            }
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Error desconocido");
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };

      fetchSchedules();
      
      return () => {
        cancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, currentMonth, hasInitialSchedules]);

  const loadForRange = async (startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadSchedulesForRange(startDate, endDate);
      if (result.success) {
        setSchedules(result.data);
      } else {
        setError(result.error || "Error al cargar horarios");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const createSchedule = async (
    scheduleData: Omit<DailyScheduleInsert, "user_id">,
    groupRoles: Array<Omit<DailyGroupRoleInsert, "schedule_id">> = [],
    memberAssignments: Array<Omit<DailyMemberAssignmentInsert, "schedule_id">> = []
  ): Promise<{ success: boolean; error?: string; data?: DailyScheduleWithDetails }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const result = await createScheduleAction(
            scheduleData,
            groupRoles,
            memberAssignments
          );
          if (result.success && result.data) {
            // Recargar los horarios para incluir el nuevo
            const refreshResult = await loadSchedulesForMonth(currentYear, currentMonth);
            if (refreshResult.success) {
              setSchedules(refreshResult.data);
            }
            resolve({ success: true, data: result.data as DailyScheduleWithDetails });
          } else {
            setError(result.error || "Error al crear horario");
            resolve({ success: false, error: result.error });
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  };

  const updateSchedule = async (
    scheduleId: string,
    updates: Partial<Omit<DailyScheduleInsert, "user_id">>
  ): Promise<{ success: boolean; error?: string; data?: DailyScheduleWithDetails }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const result = await updateScheduleAction(scheduleId, updates);
          if (result.success && result.data) {
            // Recargar los horarios para reflejar los cambios
            const refreshResult = await loadSchedulesForMonth(currentYear, currentMonth);
            if (refreshResult.success) {
              setSchedules(refreshResult.data);
            }
            resolve({ success: true, data: result.data as DailyScheduleWithDetails });
          } else {
            setError(result.error || "Error al actualizar horario");
            resolve({ success: false, error: result.error });
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  };

  const deleteSchedule = async (
    scheduleId: string
  ): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const result = await deleteScheduleAction(scheduleId);
          if (result.success) {
            setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
            resolve({ success: true });
          } else {
            setError(result.error || "Error al eliminar horario");
            resolve({ success: false, error: result.error });
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  };

  const addGroupRole = async (
    scheduleId: string,
    roleData: Omit<DailyGroupRoleInsert, "schedule_id">
  ) => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const result = await addGroupRoleToScheduleAction(scheduleId, roleData);
          if (result.success) {
            // Recargar los horarios
            const refreshResult = await loadSchedulesForMonth(currentYear, currentMonth);
            if (refreshResult.success) {
              setSchedules(refreshResult.data);
            }
            resolve({ success: true, data: result.data });
          } else {
            setError(result.error || "Error al agregar rol");
            resolve({ success: false, error: result.error });
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  };

  const removeGroupRole = async (roleId: string) => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const result = await removeGroupRoleFromScheduleAction(roleId);
          if (result.success) {
            // Recargar los horarios
            const refreshResult = await loadSchedulesForMonth(currentYear, currentMonth);
            if (refreshResult.success) {
              setSchedules(refreshResult.data);
            }
            resolve({ success: true });
          } else {
            setError(result.error || "Error al eliminar rol");
            resolve({ success: false, error: result.error });
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  };

  const addMemberAssignment = async (
    scheduleId: string,
    assignmentData: Omit<DailyMemberAssignmentInsert, "schedule_id">
  ) => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const result = await addMemberAssignmentToScheduleAction(
            scheduleId,
            assignmentData
          );
          if (result.success) {
            // Recargar los horarios
            const refreshResult = await loadSchedulesForMonth(currentYear, currentMonth);
            if (refreshResult.success) {
              setSchedules(refreshResult.data);
            }
            resolve({ success: true, data: result.data });
          } else {
            setError(result.error || "Error al agregar asignación");
            resolve({ success: false, error: result.error });
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  };

  const removeMemberAssignment = async (assignmentId: string) => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const result = await removeMemberAssignmentFromScheduleAction(assignmentId);
          if (result.success) {
            // Recargar los horarios
            const refreshResult = await loadSchedulesForMonth(currentYear, currentMonth);
            if (refreshResult.success) {
              setSchedules(refreshResult.data);
            }
            resolve({ success: true });
          } else {
            setError(result.error || "Error al eliminar asignación");
            resolve({ success: false, error: result.error });
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  };

  const refreshSchedules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadSchedulesForMonth(currentYear, currentMonth);
      if (result.success) {
        setSchedules(result.data);
      } else {
        setError(result.error || "Error al cargar horarios");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const changeMonth = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  return {
    schedules,
    isLoading,
    error,
    isPending,
    currentYear,
    currentMonth,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    addGroupRole,
    removeGroupRole,
    addMemberAssignment,
    removeMemberAssignment,
    loadForRange,
    refreshSchedules,
    changeMonth,
  };
}
