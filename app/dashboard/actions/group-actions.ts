"use server";

import { revalidatePath } from "next/cache";
import {
  getUserGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getUserGroupsWithMembers,
} from "@/lib/services/groups";
import { createMember, updateMember, deleteMember, getGroupMembers } from "@/lib/services/members";
import type { GroupInsert, GroupWithMembers } from "@/lib/types/database";

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

export async function loadUserGroupsWithMembers() {
  try {
    const groups = await getUserGroupsWithMembers();
    return { success: true, data: groups };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cargar grupos",
      data: [],
    };
  }
}

export async function createGroupAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;

    if (!name || name.trim() === "") {
      return {
        success: false,
        error: "El nombre del grupo es requerido",
      };
    }

    const groupData: Omit<GroupInsert, "user_id"> = {
      name: name.trim(),
      description: description?.trim() || null,
    };

    const group = await createGroup(groupData);
    
    // Crear miembros si se proporcionaron
    const membersData = formData.getAll("members");
    if (membersData && membersData.length > 0) {
      const membersToCreate: Array<{ first_name: string; last_name: string }> = [];
      
      // Procesar cada miembro del formulario
      for (const memberData of membersData) {
        if (typeof memberData === "string") {
          try {
            const member = JSON.parse(memberData);
            if (member.first_name?.trim() && member.last_name?.trim()) {
              membersToCreate.push({
                first_name: member.first_name.trim(),
                last_name: member.last_name.trim(),
              });
            }
          } catch {
            // Ignorar miembros con formato inválido
          }
        }
      }

      // Crear todos los miembros asociados al grupo
      const createdMembers = await Promise.all(
        membersToCreate.map((member) =>
          createMember({
            first_name: member.first_name,
            last_name: member.last_name,
            group_id: group.id,
            member_code: null,
            is_active: true,
          }).catch((err) => {
            console.error("Error al crear miembro:", err);
            // Continuar creando otros miembros aunque uno falle
            return null;
          })
        )
      );

      // Filtrar miembros creados exitosamente (eliminar nulls)
      const successfulMembers = createdMembers.filter(
        (m): m is NonNullable<typeof m> => m !== null
      );

      revalidatePath("/dashboard/members");
      
      // Construir GroupWithMembers con los miembros creados
      const groupWithMembers: GroupWithMembers = {
        ...group,
        members: successfulMembers,
      };

      revalidatePath("/dashboard/groups");
      return { success: true, data: groupWithMembers };
    }

    // Si no se crearon miembros, retornar grupo con array vacío de miembros
    const groupWithMembers: GroupWithMembers = {
      ...group,
      members: [],
    };

    revalidatePath("/dashboard/groups");
    return { success: true, data: groupWithMembers };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear el grupo",
    };
  }
}

export async function updateGroupAction(groupId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;

    if (!name || name.trim() === "") {
      return {
        success: false,
        error: "El nombre del grupo es requerido",
      };
    }

    const updates: Partial<Omit<GroupInsert, "user_id">> = {
      name: name.trim(),
      description: description?.trim() || null,
    };

    const group = await updateGroup(groupId, updates);

    // Manejar miembros si se proporcionaron
    const membersData = formData.getAll("members");
    const membersToKeep = formData.get("members_to_keep") as string | null;
    
    // Si se proporciona members_to_keep, procesar miembros (incluso si membersData está vacío)
    // Esto permite eliminar todos los miembros si es necesario
    if (membersToKeep !== null) {
      // Obtener miembros existentes del grupo
      const existingMembers = await getGroupMembers(groupId);
      const existingMemberIds = new Set(existingMembers.map((m) => m.id));
      
      // Procesar miembros para actualizar/crear
      const memberIdsToKeep = new Set<string>();
      try {
        const keepIds = JSON.parse(membersToKeep) as string[];
        keepIds.forEach((id) => memberIdsToKeep.add(id));
      } catch {
        // Ignorar si el formato es inválido
      }

      const membersToProcess: Array<{
        id?: string;
        first_name: string;
        last_name: string;
        isExisting: boolean;
      }> = [];

      // Procesar cada miembro del formulario (si hay)
      if (membersData && membersData.length > 0) {
        for (const memberData of membersData) {
          if (typeof memberData === "string") {
            try {
              const member = JSON.parse(memberData);
              if (member.first_name?.trim() && member.last_name?.trim()) {
                membersToProcess.push({
                  id: member.id,
                  first_name: member.first_name.trim(),
                  last_name: member.last_name.trim(),
                  isExisting: member.id && existingMemberIds.has(member.id),
                });
                if (member.id) {
                  memberIdsToKeep.add(member.id);
                }
              }
            } catch {
              // Ignorar miembros con formato inválido
            }
          }
        }
      }

      // Eliminar miembros que ya no están en la lista
      const membersToDelete = existingMembers.filter(
        (m) => !memberIdsToKeep.has(m.id)
      );

      // Crear/actualizar miembros
      const memberPromises: Promise<unknown>[] = [];

      for (const member of membersToProcess) {
        if (member.isExisting && member.id) {
          // Actualizar miembro existente si cambió
          const existing = existingMembers.find((m) => m.id === member.id);
          if (
            existing &&
            (existing.first_name !== member.first_name ||
              existing.last_name !== member.last_name)
          ) {
            memberPromises.push(
              updateMember(member.id, {
                first_name: member.first_name,
                last_name: member.last_name,
              }).catch((err) => {
                console.error("Error al actualizar miembro:", err);
                return null;
              })
            );
          }
        } else {
          // Crear nuevo miembro
          memberPromises.push(
            createMember({
              first_name: member.first_name,
              last_name: member.last_name,
              group_id: groupId,
              member_code: null,
              is_active: true,
            }).catch((err) => {
              console.error("Error al crear miembro:", err);
              return null;
            })
          );
        }
      }

      // Eliminar miembros removidos
      for (const memberToDelete of membersToDelete) {
        memberPromises.push(
          deleteMember(memberToDelete.id).catch((err) => {
            console.error("Error al eliminar miembro:", err);
            return null;
          })
        );
      }

      await Promise.all(memberPromises);
      revalidatePath("/dashboard/members");
    } else if (membersData && membersData.length > 0) {
      // Si no hay members_to_keep pero hay membersData, solo crear nuevos miembros
      // (esto solo debería pasar al crear un nuevo grupo)
      const memberPromises: Promise<unknown>[] = [];
      
      for (const memberData of membersData) {
        if (typeof memberData === "string") {
          try {
            const member = JSON.parse(memberData);
            if (member.first_name?.trim() && member.last_name?.trim()) {
              memberPromises.push(
                createMember({
                  first_name: member.first_name.trim(),
                  last_name: member.last_name.trim(),
                  group_id: groupId,
                  member_code: null,
                  is_active: true,
                }).catch((err) => {
                  console.error("Error al crear miembro:", err);
                  return null;
                })
              );
            }
          } catch {
            // Ignorar miembros con formato inválido
          }
        }
      }
      
      await Promise.all(memberPromises);
      revalidatePath("/dashboard/members");
    }

    // Obtener el grupo actualizado con miembros para retornarlo
    const allGroups = await getUserGroupsWithMembers();
    const updatedGroupWithMembers = allGroups.find((g) => g.id === groupId);

    revalidatePath("/dashboard/groups");
    return {
      success: true,
      data: updatedGroupWithMembers || group,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al actualizar el grupo",
    };
  }
}

export async function deleteGroupAction(groupId: string) {
  try {
    await deleteGroup(groupId);
    // Revalidar tanto grupos como miembros ya que se eliminan miembros también
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/members");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al eliminar el grupo",
    };
  }
}
