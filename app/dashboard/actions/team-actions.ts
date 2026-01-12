"use server";

import { createMember } from "@/lib/services/members";
import { createSector } from "@/lib/services/sectors";
import { createScheduleWithDetails } from "@/lib/services/schedules";
import type { ScheduleGroupSlotInsert } from "@/lib/types/database";
import { revalidatePath } from "next/cache";

// createGroupAction eliminado - usar el de @/app/dashboard/actions/group-actions

export async function createMemberAction(formData: {
  firstName: string;
  lastName: string;
  groupId: string;
}) {
  try {
    const member = await createMember({
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      group_id: formData.groupId || null,
      member_code: null,
      is_active: true,
    });
    revalidatePath("/dashboard");
    return { success: true, data: member };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear miembro",
    };
  }
}

export async function createSectorAction(formData: {
  name: string;
  icon: string;
}) {
  try {
    const sector = await createSector({
      name: formData.name.trim(),
      icon: formData.icon || "Building2",
      description: null,
      color: null,
      priority: "Media", // Prioridad por defecto
    });
    revalidatePath("/dashboard");
    return { success: true, data: sector };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear sector",
    };
  }
}

export async function createScheduleAction(formData: {
  date: string;
  notes: string;
  groupId?: string;
  slotLabel?: string;
  slotIcon?: string;
}) {
  try {
    const schedule = await createScheduleWithDetails(
      {
        schedule_date: formData.date,
        notes: formData.notes.trim() || null,
      },
      formData.groupId && formData.slotLabel
        ? [
            {
              group_id: formData.groupId,
              slot_label: formData.slotLabel,
              icon: formData.slotIcon || "Clock",
            } as ScheduleGroupSlotInsert,
          ]
        : [],
      [] // Asignaciones se pueden agregar después
    );
    revalidatePath("/dashboard");
    return { success: true, data: schedule };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear horario",
    };
  }
}
