// Servicios para operaciones CRUD de miembros
import { createClient } from "@/lib/supabase/server";
import type { MemberInsert } from "@/lib/types/database";

// Obtener todos los miembros del usuario
export async function getUserMembers() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", userId)
    .order("first_name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Obtener miembros de un grupo específico
export async function getGroupMembers(groupId: string) {
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
    throw new Error("No tienes acceso a este grupo");
  }

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("group_id", groupId)
    .order("first_name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Crear un nuevo miembro
export async function createMember(memberData: Omit<MemberInsert, "user_id">) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // La validación de que el grupo pertenece al usuario se hace mediante trigger en la BD
  const { data, error } = await supabase
    .from("members")
    .insert({
      ...memberData,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Actualizar un miembro
export async function updateMember(
  memberId: string,
  updates: Partial<Omit<MemberInsert, "user_id">>
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el miembro pertenece al usuario
  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("user_id")
    .eq("id", memberId)
    .single();

  if (memberError) throw memberError;
  if (!member || member.user_id !== userId) {
    throw new Error("Solo el dueño puede actualizar miembros");
  }

  // La validación de que el grupo pertenece al usuario se hace mediante trigger en la BD
  const { data, error } = await supabase
    .from("members")
    .update(updates)
    .eq("id", memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar un miembro
export async function deleteMember(memberId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el miembro pertenece al usuario
  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("user_id")
    .eq("id", memberId)
    .single();

  if (memberError) throw memberError;
  if (!member || member.user_id !== userId) {
    throw new Error("Solo el dueño puede eliminar miembros");
  }

  const { error } = await supabase.from("members").delete().eq("id", memberId);

  if (error) throw error;
}

// Funciones legacy para compatibilidad (serán eliminadas gradualmente)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getTeamMembers(_teamId: string) {
  // Ya no hay teams, retornar miembros del usuario
  return getUserMembers();
}

export async function createTeamMember(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _teamId: string,
  memberData: Omit<MemberInsert, "user_id" | "team_id">
) {
  // Ignorar teamId ya que no existe
  // Eliminar campos que ya no existen: email, phone, role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const { email: _email, phone: _phone, role: _role, ...cleanData } = memberData as any;
  return createMember(cleanData);
}

export async function updateTeamMember(
  memberId: string,
  updates: Partial<Omit<MemberInsert, "user_id" | "team_id">>
) {
  // Eliminar campos que ya no existen: email, phone, role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const { email: _email, phone: _phone, role: _role, ...cleanUpdates } = updates as any;
  return updateMember(memberId, cleanUpdates);
}

export async function deleteTeamMember(memberId: string) {
  return deleteMember(memberId);
}
