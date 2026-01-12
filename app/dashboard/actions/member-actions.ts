"use server";

import { revalidatePath } from "next/cache";
import {
  getUserMembers,
  createMember,
  updateMember,
  deleteMember,
} from "@/lib/services/members";
import type { MemberInsert } from "@/lib/types/database";

export async function loadUserMembers() {
  try {
    const members = await getUserMembers();
    return { success: true, data: members };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cargar miembros",
      data: [],
    };
  }
}

export async function createMemberAction(formData: FormData) {
  try {
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const group_id = formData.get("group_id") as string | null;
    const is_active = formData.get("is_active") === "true";

    if (!first_name || first_name.trim() === "") {
      return {
        success: false,
        error: "El nombre es requerido",
      };
    }

    if (!last_name || last_name.trim() === "") {
      return {
        success: false,
        error: "El apellido es requerido",
      };
    }

    const memberData: Omit<MemberInsert, "user_id"> = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      group_id: group_id?.trim() || null,
      member_code: null,
      is_active,
    };

    const member = await createMember(memberData);
    revalidatePath("/dashboard/members");
    return { success: true, data: member };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al crear el miembro",
    };
  }
}

export async function updateMemberAction(
  memberId: string,
  formData: FormData
) {
  try {
    const first_name = formData.get("first_name") as string | null;
    const last_name = formData.get("last_name") as string | null;
    const group_id = formData.get("group_id") as string | null;
    const is_active = formData.get("is_active") === "true" || undefined;

    const updates: Partial<Omit<MemberInsert, "user_id">> = {};

    if (first_name !== null) {
      updates.first_name = first_name.trim();
    }
    if (last_name !== null) {
      updates.last_name = last_name.trim();
    }
    if (group_id !== null) {
      updates.group_id = group_id.trim() || null;
    }
    if (is_active !== undefined) {
      updates.is_active = is_active;
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error: "No hay cambios para actualizar",
      };
    }

    const member = await updateMember(memberId, updates);
    revalidatePath("/dashboard/members");
    return { success: true, data: member };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar el miembro",
    };
  }
}

export async function deleteMemberAction(memberId: string) {
  try {
    await deleteMember(memberId);
    revalidatePath("/dashboard/members");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al eliminar el miembro",
    };
  }
}
