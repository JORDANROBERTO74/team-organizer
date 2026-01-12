// Servicios para operaciones CRUD de horarios diarios con roles y asignaciones
import { createClient } from "@/lib/supabase/server";
import type {
  DailyScheduleInsert,
  ScheduleGroupSlot,
  ScheduleGroupSlotInsert,
  DailyMemberAssignment,
  DailyMemberAssignmentInsert,
  DailyScheduleWithDetails,
  Group,
  Member,
  Sector,
  GroupSlot,
} from "@/lib/types/database";
import { getUserGroupSlots } from "./slots";

// Obtener horarios con detalles completos en un rango de fechas
export async function getSchedulesWithDetails(
  startDate: string,
  endDate: string
): Promise<DailyScheduleWithDetails[]> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Obtener horarios del usuario
  const { data: schedules, error: schedulesError } = await supabase
    .from("daily_schedules")
    .select("*")
    .eq("user_id", userId)
    .gte("schedule_date", startDate)
    .lte("schedule_date", endDate)
    .order("schedule_date", { ascending: true });

  if (schedulesError) {
    console.error(
      "Error al obtener daily_schedules - Detalles completos:",
      JSON.stringify(schedulesError, null, 2)
    );
    console.error("Propiedades del error:", Object.keys(schedulesError));
    console.error("UserID intentado:", userId);

    throw new Error(
      `Error al obtener horarios: ${
        schedulesError.message || JSON.stringify(schedulesError)
      } (${schedulesError.code || "NO_CODE"})`
    );
  }

  if (!schedules || schedules.length === 0) {
    return [];
  }

  const scheduleIds = schedules.map((s) => s.id);

  // Obtener slots de grupos con información del grupo
  let groupSlots: Array<ScheduleGroupSlot & { group: Group }> = [];
  if (scheduleIds.length > 0) {
    const { data, error: groupSlotsError } = await supabase
      .from("schedule_group_slots")
      .select(
        `
        *,
        group:groups(*)
      `
      )
      .in("schedule_id", scheduleIds)
      .order("created_at", { ascending: true });

    if (groupSlotsError) {
      console.error("Error al obtener slots de grupos:", {
        error: groupSlotsError,
        code: groupSlotsError.code,
        message: groupSlotsError.message,
        details: groupSlotsError.details,
        hint: groupSlotsError.hint,
      });
      throw new Error(
        `Error al obtener slots de grupos: ${groupSlotsError.message} (${groupSlotsError.code})`
      );
    }
    groupSlots = data || [];
  }

  // Obtener asignaciones de miembros con información del miembro y sector
  let memberAssignments: Array<
    DailyMemberAssignment & { member: Member; sector: Sector }
  > = [];
  if (scheduleIds.length > 0) {
    const { data, error: memberAssignmentsError } = await supabase
      .from("daily_member_assignments")
      .select(
        `
        *,
        member:members(*),
        sector:sectors(*)
      `
      )
      .in("schedule_id", scheduleIds);

    if (memberAssignmentsError) {
      console.error("Error al obtener asignaciones de miembros:", {
        error: memberAssignmentsError,
        code: memberAssignmentsError.code,
        message: memberAssignmentsError.message,
        details: memberAssignmentsError.details,
        hint: memberAssignmentsError.hint,
      });
      throw new Error(
        `Error al obtener asignaciones: ${memberAssignmentsError.message} (${memberAssignmentsError.code})`
      );
    }
    memberAssignments = data || [];
  }

  // Obtener todos los group_slots del usuario para obtener las priorities
  let userGroupSlotsMap: Map<string, string | null> = new Map();
  try {
    const userSlots = await getUserGroupSlots();
    userGroupSlotsMap = new Map(
      userSlots.map((slot: GroupSlot) => [slot.slot_label, slot.priority || null])
    );
  } catch (error) {
    console.error("Error al obtener group_slots para priority:", error);
    // Continuar sin priority si hay error
  }

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

  // Construir el resultado con relaciones
  return schedules.map((schedule) => {
    const slots = groupSlots
      .filter((s) => s.schedule_id === schedule.id)
      .map((s) => {
        const group = s.group;
        const slotLabel = s.slot_label;
        const priority = userGroupSlotsMap.get(slotLabel) || null;
        return {
          ...s,
          group:
            group && typeof group === "object" && !Array.isArray(group)
              ? group
              : null,
          priority, // Agregar priority al objeto
        } as ScheduleGroupSlot & { group: unknown; priority?: string | null };
      })
      // Ordenar por priority: Alta (1) > Media (2) > Baja (3) > Sin priority (999)
      .sort((a, b) => {
        const priorityA = getPriorityValue(a.priority);
        const priorityB = getPriorityValue(b.priority);
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        // Si tienen la misma priority, mantener orden por created_at
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

    const assignments = memberAssignments
      .filter((a) => a.schedule_id === schedule.id)
      .map((a) => {
        const member = a.member;
        const sector = a.sector;
        return {
          ...a,
          member:
            member && typeof member === "object" && !Array.isArray(member)
              ? member
              : null,
          sector:
            sector && typeof sector === "object" && !Array.isArray(sector)
              ? sector
              : null,
        } as DailyMemberAssignment & {
          member: unknown;
          sector: unknown;
        };
      });

    return {
      ...schedule,
      group_slots: slots,
      group_roles: slots, // Alias legacy para compatibilidad
      member_assignments: assignments,
    } as DailyScheduleWithDetails;
  });
}

// Crear un horario diario con slots y asignaciones
export async function createScheduleWithDetails(
  scheduleData: Omit<DailyScheduleInsert, "user_id">,
  groupSlots: Array<Omit<ScheduleGroupSlotInsert, "schedule_id">>,
  memberAssignments: Array<Omit<DailyMemberAssignmentInsert, "schedule_id">>
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Crear el horario
  const { data: schedule, error: scheduleError } = await supabase
    .from("daily_schedules")
    .insert({
      ...scheduleData,
      user_id: userId,
    })
    .select()
    .single();

  if (scheduleError) throw scheduleError;

  // Crear slots de grupos si existen
  if (groupSlots.length > 0) {
    const slotsToInsert = groupSlots.map((slot) => ({
      ...slot,
      schedule_id: schedule.id,
    }));

    const { error: slotsError } = await supabase
      .from("schedule_group_slots")
      .insert(slotsToInsert);

    if (slotsError) throw slotsError;
  }

  // Crear asignaciones de miembros si existen
  if (memberAssignments.length > 0) {
    const assignmentsToInsert = memberAssignments.map((assignment) => ({
      ...assignment,
      schedule_id: schedule.id,
    }));

    const { error: assignmentsError } = await supabase
      .from("daily_member_assignments")
      .insert(assignmentsToInsert);

    if (assignmentsError) throw assignmentsError;
  }

  return schedule;
}

// Agregar un slot de grupo a un horario
export async function addScheduleGroupRole(
  scheduleId: string,
  slotData: Omit<ScheduleGroupSlotInsert, "schedule_id">
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el horario pertenece al usuario
  const { data: schedule, error: scheduleError } = await supabase
    .from("daily_schedules")
    .select("user_id")
    .eq("id", scheduleId)
    .single();

  if (scheduleError) throw scheduleError;
  if (!schedule || schedule.user_id !== userId) {
    throw new Error("Solo el dueño puede agregar slots");
  }

  const { data, error } = await supabase
    .from("schedule_group_slots")
    .insert({
      ...slotData,
      schedule_id: scheduleId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Agregar una asignación de miembro a un horario
export async function addScheduleMemberAssignment(
  scheduleId: string,
  assignmentData: Omit<DailyMemberAssignmentInsert, "schedule_id">
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el horario pertenece al usuario
  const { data: schedule, error: scheduleError } = await supabase
    .from("daily_schedules")
    .select("user_id")
    .eq("id", scheduleId)
    .single();

  if (scheduleError) throw scheduleError;
  if (!schedule || schedule.user_id !== userId) {
    throw new Error("Solo el dueño puede agregar asignaciones");
  }

  const { data, error } = await supabase
    .from("daily_member_assignments")
    .insert({
      ...assignmentData,
      schedule_id: scheduleId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar un slot de grupo de un horario
export async function removeScheduleGroupRole(slotId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Obtener el slot y verificar permisos
  const { data: slot, error: slotError } = await supabase
    .from("schedule_group_slots")
    .select("schedule_id")
    .eq("id", slotId)
    .single();

  if (slotError) throw slotError;

  // Verificar que el horario pertenece al usuario
  const { data: schedule, error: scheduleError } = await supabase
    .from("daily_schedules")
    .select("user_id")
    .eq("id", slot.schedule_id)
    .single();

  if (scheduleError) throw scheduleError;
  if (!schedule || schedule.user_id !== userId) {
    throw new Error("Solo el dueño puede eliminar slots");
  }

  const { error } = await supabase
    .from("schedule_group_slots")
    .delete()
    .eq("id", slotId);

  if (error) throw error;
}

// Eliminar una asignación de miembro de un horario
export async function removeScheduleMemberAssignment(assignmentId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Obtener la asignación y verificar permisos
  const { data: assignment, error: assignmentError } = await supabase
    .from("daily_member_assignments")
    .select("schedule_id")
    .eq("id", assignmentId)
    .single();

  if (assignmentError) throw assignmentError;

  // Verificar que el horario pertenece al usuario
  const { data: schedule, error: scheduleError } = await supabase
    .from("daily_schedules")
    .select("user_id")
    .eq("id", assignment.schedule_id)
    .single();

  if (scheduleError) throw scheduleError;
  if (!schedule || schedule.user_id !== userId) {
    throw new Error("Solo el dueño puede eliminar asignaciones");
  }

  const { error } = await supabase
    .from("daily_member_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) throw error;
}

// Actualizar un horario diario
export async function updateDailySchedule(
  scheduleId: string,
  updates: Partial<Omit<DailyScheduleInsert, "user_id">>
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el horario pertenece al usuario
  const { data: schedule, error: scheduleError } = await supabase
    .from("daily_schedules")
    .select("user_id")
    .eq("id", scheduleId)
    .single();

  if (scheduleError) throw scheduleError;
  if (!schedule || schedule.user_id !== userId) {
    throw new Error("Solo el dueño puede actualizar horarios");
  }

  const { data, error } = await supabase
    .from("daily_schedules")
    .update(updates)
    .eq("id", scheduleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar un horario diario
export async function deleteDailySchedule(scheduleId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el horario pertenece al usuario
  const { data: schedule, error: scheduleError } = await supabase
    .from("daily_schedules")
    .select("user_id")
    .eq("id", scheduleId)
    .single();

  if (scheduleError) throw scheduleError;
  if (!schedule || schedule.user_id !== userId) {
    throw new Error("Solo el dueño puede eliminar horarios");
  }

  const { error } = await supabase
    .from("daily_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) throw error;
}

// Actualizar completamente un horario diario con slots y asignaciones
export async function updateScheduleWithDetails(
  scheduleId: string,
  scheduleData: Partial<Omit<DailyScheduleInsert, "user_id">>,
  groupSlots: Array<Omit<ScheduleGroupSlotInsert, "schedule_id">>,
  memberAssignments: Array<Omit<DailyMemberAssignmentInsert, "schedule_id">>
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el horario pertenece al usuario
  const { data: schedule, error: scheduleError } = await supabase
    .from("daily_schedules")
    .select("user_id")
    .eq("id", scheduleId)
    .single();

  if (scheduleError) throw scheduleError;
  if (!schedule || schedule.user_id !== userId) {
    throw new Error("Solo el dueño puede actualizar horarios");
  }

  // Actualizar campos básicos del horario
  if (Object.keys(scheduleData).length > 0) {
    const { error: updateError } = await supabase
      .from("daily_schedules")
      .update(scheduleData)
      .eq("id", scheduleId);

    if (updateError) throw updateError;
  }

  // Eliminar todos los slots de grupos existentes
  const { error: deleteSlotsError } = await supabase
    .from("schedule_group_slots")
    .delete()
    .eq("schedule_id", scheduleId);

  if (deleteSlotsError) throw deleteSlotsError;

  // Crear nuevos slots de grupos si existen
  if (groupSlots.length > 0) {
    const slotsToInsert = groupSlots.map((slot) => ({
      ...slot,
      schedule_id: scheduleId,
    }));

    const { error: slotsError } = await supabase
      .from("schedule_group_slots")
      .insert(slotsToInsert);

    if (slotsError) throw slotsError;
  }

  // Eliminar todas las asignaciones de miembros existentes
  const { error: deleteAssignmentsError } = await supabase
    .from("daily_member_assignments")
    .delete()
    .eq("schedule_id", scheduleId);

  if (deleteAssignmentsError) throw deleteAssignmentsError;

  // Crear nuevas asignaciones de miembros si existen
  if (memberAssignments.length > 0) {
    const assignmentsToInsert = memberAssignments.map((assignment) => ({
      ...assignment,
      schedule_id: scheduleId,
    }));

    const { error: assignmentsError } = await supabase
      .from("daily_member_assignments")
      .insert(assignmentsToInsert);

    if (assignmentsError) throw assignmentsError;
  }

  // Obtener el schedule actualizado con detalles
  const { data: updatedSchedule, error: fetchError } = await supabase
    .from("daily_schedules")
    .select("*")
    .eq("id", scheduleId)
    .single();

  if (fetchError) throw fetchError;
  return updatedSchedule;
}

// Obtener conteo de asignaciones por sector para una lista de miembros
export async function getMemberSectorCounts(
  memberIds: string[],
  sectorIds?: string[]
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  // Si no hay miembros, retornar vacío inmediatamente
  if (memberIds.length === 0) {
    return {};
  }

  // Procesar conteos
  const counts: Record<string, Record<string, number>> = {};
  // Inicializar estructura para todos los miembros solicitados
  memberIds.forEach((id) => {
    counts[id] = {};
  });

  // Obtener todas las asignaciones históricas SOLO del usuario actual:
  // hacemos un JOIN (inner) contra daily_schedules y filtramos por user_id.
  let query = supabase
    .from("daily_member_assignments")
    .select(
      `
      member_id,
      sector_id,
      daily_schedules!inner(user_id)
    `
    )
    .in("member_id", memberIds)
    .eq("daily_schedules.user_id", user.sub);

  if (sectorIds && sectorIds.length > 0) {
    query = query.in("sector_id", sectorIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Llenar con datos
  type AssignmentRow = { member_id: string; sector_id: string };
  data?.forEach((row: AssignmentRow) => {
    const memberId = row.member_id;
    const sectorId = row.sector_id;
    if (counts[memberId]) {
      counts[memberId][sectorId] = (counts[memberId][sectorId] || 0) + 1;
    }
  });

  return counts;
}

// Obtener la última distribución de sectores para un grupo con una etiqueta específica
export async function getLastGroupSlotDistribution(
  groupId: string,
  slotLabel: string
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Obtener el schedule más reciente donde este grupo tuvo esta etiqueta
  // Primero obtener los schedule_ids que cumplen con los criterios
  const { data: groupSlots, error: groupSlotsError } = await supabase
    .from("schedule_group_slots")
    .select("schedule_id")
    .eq("group_id", groupId)
    .eq("slot_label", slotLabel);

  if (groupSlotsError || !groupSlots || groupSlots.length === 0) {
    return null;
  }

  const scheduleIds = groupSlots.map((s) => s.schedule_id);

  // Obtener el schedule más reciente del usuario
  const { data: recentSchedule, error: scheduleError } = await supabase
    .from("daily_schedules")
    .select("id, schedule_date")
    .eq("user_id", userId)
    .in("id", scheduleIds)
    .order("schedule_date", { ascending: false })
    .limit(1)
    .single();

  if (scheduleError || !recentSchedule) {
    return null;
  }

  const scheduleId = recentSchedule.id;

  // Obtener las asignaciones de miembros de ese schedule que pertenecen al grupo
  const { data: assignments, error: assignmentsError } = await supabase
    .from("daily_member_assignments")
    .select(
      `
      member_id,
      sector_id,
      member:members(group_id)
    `
    )
    .eq("schedule_id", scheduleId);

  if (assignmentsError || !assignments) {
    return null;
  }

  // Filtrar solo las asignaciones de miembros que pertenecen al grupo
  type AssignmentRow = {
    member_id: string;
    sector_id: string;
    member: { group_id: string | null } | { group_id: string | null }[] | null;
  };
  const groupAssignments = assignments.filter((assignment) => {
    const member = Array.isArray(assignment.member)
      ? assignment.member[0]
      : assignment.member;
    return member?.group_id === groupId;
  });

  if (groupAssignments.length === 0) {
    return null;
  }

  // Construir el mapa de asignaciones: member_id -> sector_id
  const distribution: Record<string, string> = {};
  groupAssignments.forEach((assignment) => {
    if (assignment.member_id && assignment.sector_id) {
      distribution[assignment.member_id] = assignment.sector_id;
    }
  });

  return distribution;
}
