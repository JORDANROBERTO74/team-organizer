"use server";

import { revalidatePath } from "next/cache";
import {
  getSchedulesWithDetails,
  createScheduleWithDetails,
  updateDailySchedule,
  updateScheduleWithDetails,
  deleteDailySchedule,
  addScheduleGroupRole,
  removeScheduleGroupRole,
  addScheduleMemberAssignment,
  removeScheduleMemberAssignment,
  getMemberSectorCounts,
  getLastGroupSlotDistribution,
} from "@/lib/services/schedules";

// Obtener solo los conteos históricos (para cache)
export async function getMemberSectorCountsAction(
  memberIds: string[],
  sectorIds: string[]
) {
  try {
    if (memberIds.length === 0) {
      return { success: true, data: {} };
    }
    const counts = await getMemberSectorCounts(memberIds, sectorIds);
    return { success: true, data: counts };
  } catch (error) {
    console.error("Error getting member sector counts:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al obtener conteos históricos",
    };
  }
}

// Obtener solo la última distribución (para cache)
export async function getLastGroupSlotDistributionAction(
  groupId: string,
  slotLabel: string
) {
  try {
    const distribution = await getLastGroupSlotDistribution(groupId, slotLabel);
    return { success: true, data: distribution };
  } catch (error) {
    console.error("Error getting last distribution:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al obtener última distribución",
    };
  }
}
import type {
  DailyScheduleInsert,
  DailyGroupRoleInsert,
  DailyMemberAssignmentInsert,
} from "@/lib/types/database";
import { getMonthStart, getMonthEnd } from "@/lib/utils/date";

export async function loadSchedulesForMonth(year: number, month: number) {
  const date = new Date(year, month, 1);
  const startDate = getMonthStart(date);
  const endDate = getMonthEnd(date);

  try {
    const schedules = await getSchedulesWithDetails(startDate, endDate);
    return { success: true, data: schedules };
  } catch (error) {
    console.error("Error al cargar horarios:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
      data: [],
    };
  }
}

export async function loadSchedulesForRange(startDate: string, endDate: string) {
  try {
    const schedules = await getSchedulesWithDetails(startDate, endDate);
    return { success: true, data: schedules };
  } catch (error) {
    console.error("Error al cargar horarios:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
      data: [],
    };
  }
}

export async function createScheduleAction(
  scheduleData: Omit<DailyScheduleInsert, "user_id">,
  groupRoles: Array<Omit<DailyGroupRoleInsert, "schedule_id">> = [],
  memberAssignments: Array<Omit<DailyMemberAssignmentInsert, "schedule_id">> = []
) {
  try {
    const schedule = await createScheduleWithDetails(
      scheduleData,
      groupRoles,
      memberAssignments
    );
    revalidatePath("/dashboard");
    return { success: true, data: schedule };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al crear el horario",
    };
  }
}

export async function updateScheduleAction(
  scheduleId: string,
  updates: Partial<Omit<DailyScheduleInsert, "user_id">>
) {
  try {
    const schedule = await updateDailySchedule(scheduleId, updates);
    revalidatePath("/dashboard");
    return { success: true, data: schedule };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar el horario",
    };
  }
}

export async function updateScheduleCompleteAction(
  scheduleId: string,
  scheduleData: Partial<Omit<DailyScheduleInsert, "user_id">>,
  groupRoles: Array<Omit<DailyGroupRoleInsert, "schedule_id">> = [],
  memberAssignments: Array<Omit<DailyMemberAssignmentInsert, "schedule_id">> = []
) {
  try {
    const schedule = await updateScheduleWithDetails(
      scheduleId,
      scheduleData,
      groupRoles,
      memberAssignments
    );
    revalidatePath("/dashboard");
    return { success: true, data: schedule };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar el horario",
    };
  }
}

export async function deleteScheduleAction(scheduleId: string) {
  try {
    await deleteDailySchedule(scheduleId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al eliminar el horario",
    };
  }
}

export async function addGroupRoleToScheduleAction(
  scheduleId: string,
  roleData: Omit<DailyGroupRoleInsert, "schedule_id">
) {
  try {
    const role = await addScheduleGroupRole(scheduleId, roleData);
    revalidatePath("/dashboard");
    return { success: true, data: role };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al agregar rol de grupo",
    };
  }
}

export async function removeGroupRoleFromScheduleAction(roleId: string) {
  try {
    await removeScheduleGroupRole(roleId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al eliminar rol de grupo",
    };
  }
}

export async function addMemberAssignmentToScheduleAction(
  scheduleId: string,
  assignmentData: Omit<DailyMemberAssignmentInsert, "schedule_id">
) {
  try {
    const assignment = await addScheduleMemberAssignment(
      scheduleId,
      assignmentData
    );
    revalidatePath("/dashboard");
    return { success: true, data: assignment };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al agregar asignación de miembro",
    };
  }
}

export async function removeMemberAssignmentFromScheduleAction(
  assignmentId: string
) {
  try {
    await removeScheduleMemberAssignment(assignmentId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al eliminar asignación de miembro",
    };
  }
}

export async function generateAssignmentsAction(
  memberIds: string[],
  sectorIds: string[],
  sectorRequirements?: Record<string, number>,
  groupId?: string,
  slotLabel?: string,
  cachedCounts?: Record<string, Record<string, number>>,
  cachedLastDistribution?: Record<string, string> | null
) {
  try {
    if (memberIds.length === 0) {
      return { success: true, data: {} as Record<string, string> };
    }
    if (sectorIds.length === 0) {
      return { success: false, error: "No hay sectores disponibles" };
    }

    // Usar datos cacheados si están disponibles, sino hacer petición
    const counts =
      cachedCounts || (await getMemberSectorCounts(memberIds, sectorIds));

    // Obtener la última distribución si hay groupId y slotLabel
    // Usar cache si está disponible
    let lastDistribution: Record<string, string> | null = null;
    if (groupId && slotLabel) {
      if (cachedLastDistribution !== undefined) {
        lastDistribution = cachedLastDistribution;
      } else {
        lastDistribution = await getLastGroupSlotDistribution(
          groupId,
          slotLabel
        );
      }
    }

    const assignments: Record<string, string> = {};
    const sectorUsageInCurrentDraft: Record<string, number> = {};
    
    // Inicializar contadores del borrador actual
    sectorIds.forEach((s) => (sectorUsageInCurrentDraft[s] = 0));

    // Lista de miembros pendientes de asignar
    const unassignedMembers = [...memberIds];

    // FASE 1: Asignar miembros a sectores con requerimientos específicos
    // Considerando el historial de rotación para mantener equidad
    if (sectorRequirements && Object.keys(sectorRequirements).length > 0) {
      // Ordenar sectores por requerimiento (mayor a menor) para priorizar
      const sectorsWithRequirements = Object.entries(sectorRequirements)
        .filter(([_, count]) => count && count > 0)
        .sort(([_, a], [__, b]) => (b || 0) - (a || 0));

      for (const [sectorId, requiredCount] of sectorsWithRequirements) {
        if (!sectorIds.includes(sectorId)) continue; // Saltar si el sector no está disponible
        
        const targetCount = requiredCount || 0;
        let assignedToThisSector = 0;

        // Mientras no se haya cumplido el requerimiento y haya miembros disponibles
        while (assignedToThisSector < targetCount && unassignedMembers.length > 0) {
          if (sectorUsageInCurrentDraft[sectorId] >= targetCount) {
            break; // Ya se cumplió el requerimiento
          }

          // Encontrar el miembro con menor historial en este sector
          let bestMemberIndex = -1;
          let minHistoryForSector = Infinity;

          for (let i = 0; i < unassignedMembers.length; i++) {
            const memberId = unassignedMembers[i];
            const memberCounts = counts[memberId] || {};
            const historyCount = memberCounts[sectorId] || 0;
            
            if (historyCount < minHistoryForSector) {
              minHistoryForSector = historyCount;
              bestMemberIndex = i;
            }
          }

          // Si encontramos un miembro, asignarlo
          if (bestMemberIndex >= 0) {
            const memberId = unassignedMembers[bestMemberIndex];
            assignments[memberId] = sectorId;
            sectorUsageInCurrentDraft[sectorId] =
              (sectorUsageInCurrentDraft[sectorId] || 0) + 1;
            assignedToThisSector++;
            unassignedMembers.splice(bestMemberIndex, 1); // Remover de la lista
          } else {
            break; // No hay más miembros disponibles
          }
        }
      }
    }

    // FASE 2: Distribuir miembros restantes de manera equitativa
    // (respetando límites máximos si hay requerimientos y evitando repetir última distribución)
    for (const memberId of unassignedMembers) {
      const memberCounts = counts[memberId] || {};

      // Encontrar sectores candidatos (que no hayan alcanzado su límite)
      const availableSectors = sectorIds.filter((sectorId) => {
        // Si hay un requerimiento definido, verificar que no se haya excedido
        if (sectorRequirements?.[sectorId] !== undefined) {
          const maxCount = sectorRequirements[sectorId] || 0;
          return (sectorUsageInCurrentDraft[sectorId] || 0) < maxCount;
        }
        // Si no hay requerimiento, el sector está disponible
        return true;
      });

      // Si no hay sectores disponibles (todos alcanzaron su límite), usar todos
      const candidatesSectors = availableSectors.length > 0 
        ? availableSectors 
        : sectorIds;

      // Encontrar el sector con menor historial entre los candidatos
      let minHistoryCount = Infinity;
      let candidates: string[] = [];

      for (const sectorId of candidatesSectors) {
        const count = memberCounts[sectorId] || 0;
        if (count < minHistoryCount) {
          minHistoryCount = count;
          candidates = [sectorId];
        } else if (count === minHistoryCount) {
          candidates.push(sectorId);
        }
      }

      // Si hay una última distribución, evitar asignar al mismo sector que tuvo antes
      // (solo si hay múltiples candidatos con el mismo historial)
      if (lastDistribution && candidates.length > 1) {
        const lastSectorForMember = lastDistribution[memberId];
        if (lastSectorForMember) {
          // Remover el sector de la última vez de los candidatos si hay alternativas
          const filteredCandidates = candidates.filter(
            (s) => s !== lastSectorForMember
          );
          if (filteredCandidates.length > 0) {
            candidates = filteredCandidates;
          }
        }
      }

      // Desempate: elegir el sector con menos asignaciones en el borrador actual
      if (candidates.length > 1) {
        candidates.sort((a, b) => {
          const usageA = sectorUsageInCurrentDraft[a] || 0;
          const usageB = sectorUsageInCurrentDraft[b] || 0;
          return usageA - usageB;
        });
      }

      // Si no hay candidatos, saltar (no debería pasar)
      if (candidates.length === 0) continue;

      const bestSectorId = candidates[0];
      assignments[memberId] = bestSectorId;
      sectorUsageInCurrentDraft[bestSectorId] =
        (sectorUsageInCurrentDraft[bestSectorId] || 0) + 1;
    }

    return { success: true, data: assignments };
  } catch (error) {
    console.error("Error generating assignments:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al generar asignaciones",
    };
  }
}
