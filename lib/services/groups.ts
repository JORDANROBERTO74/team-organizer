// Servicios para operaciones CRUD de grupos
import { createClient } from "@/lib/supabase/server";
import type { GroupInsert, GroupWithMembers } from "@/lib/types/database";

// Obtener todos los grupos del usuario
export async function getUserGroups() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Obtener todos los grupos del usuario con sus miembros
export async function getUserGroupsWithMembers(): Promise<GroupWithMembers[]> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (groupsError) throw groupsError;
  if (!groups || groups.length === 0) {
    return [];
  }

  const groupIds = groups.map((g) => g.id);

  // Obtener todos los miembros de estos grupos
  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("*")
    .in("group_id", groupIds)
    .eq("user_id", userId)
    .order("first_name", { ascending: true });

  if (membersError) throw membersError;

  // Agrupar miembros por group_id
  const membersByGroupId = new Map<string, typeof members>();
  (members || []).forEach((member) => {
    if (member.group_id) {
      const existing = membersByGroupId.get(member.group_id) || [];
      existing.push(member);
      membersByGroupId.set(member.group_id, existing);
    }
  });

  // Combinar grupos con sus miembros
  return groups.map((group) => ({
    ...group,
    members: membersByGroupId.get(group.id) || [],
  }));
}

// Crear un nuevo grupo
export async function createGroup(groupData: Omit<GroupInsert, "user_id">) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  const { data, error } = await supabase
    .from("groups")
    .insert({
      ...groupData,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Actualizar un grupo
export async function updateGroup(
  groupId: string,
  updates: Partial<Omit<GroupInsert, "user_id">>
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el grupo pertenece al usuario
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("user_id")
    .eq("id", groupId)
    .single();

  if (groupError) throw groupError;
  if (!group || group.user_id !== userId) {
    throw new Error("Solo el dueño puede actualizar grupos");
  }

  const { data, error } = await supabase
    .from("groups")
    .update(updates)
    .eq("id", groupId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar un grupo
export async function deleteGroup(groupId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el grupo pertenece al usuario
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("user_id")
    .eq("id", groupId)
    .single();

  if (groupError) throw groupError;
  if (!group || group.user_id !== userId) {
    throw new Error("Solo el dueño puede eliminar grupos");
  }

  // Obtener todos los miembros del grupo antes de eliminarlo
  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (membersError) throw membersError;

  // Eliminar todos los miembros del grupo primero
  if (members && members.length > 0) {
    const memberIds = members.map((m) => m.id);
    const { error: deleteMembersError } = await supabase
      .from("members")
      .delete()
      .in("id", memberIds);

    if (deleteMembersError) throw deleteMembersError;
  }

  // Finalmente, eliminar el grupo
  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) throw error;
}

// Funciones legacy para compatibilidad (serán eliminadas gradualmente)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getTeamGroups(_teamId: string) {
  // Ya no hay teams, retornar grupos del usuario
  return getUserGroups();
}

export async function createTeamGroup(
  teamId: string,
  groupData: Omit<GroupInsert, "user_id">
) {
  // Ignorar teamId ya que no existe
  return createGroup(groupData);
}

export async function updateTeamGroup(
  groupId: string,
  updates: Partial<Omit<GroupInsert, "user_id">>
) {
  return updateGroup(groupId, updates);
}

export async function deleteTeamGroup(groupId: string) {
  return deleteGroup(groupId);
}
