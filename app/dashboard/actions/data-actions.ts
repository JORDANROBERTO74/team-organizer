"use server";

import { getUserGroups } from "@/lib/services/groups";
import { getUserMembers } from "@/lib/services/members";
import { getUserSectors } from "@/lib/services/sectors";
import { getUserGroupSlots } from "@/lib/services/slots";

export async function loadUserGroups() {
  try {
    const groups = await getUserGroups();
    return { success: true, data: groups };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cargar grupos",
      data: [],
    };
  }
}

export async function loadUserMembers() {
  try {
    const members = await getUserMembers();
    return { success: true, data: members };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al cargar miembros",
      data: [],
    };
  }
}

export async function loadUserSectors() {
  try {
    const sectors = await getUserSectors();
    return { success: true, data: sectors };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al cargar sectores",
      data: [],
    };
  }
}

export async function loadUserGroupSlots() {
  try {
    const slots = await getUserGroupSlots();
    return { success: true, data: slots };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cargar slots",
      data: [],
    };
  }
}
