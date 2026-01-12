// Servicios para operaciones CRUD de sectores
import { createClient } from "@/lib/supabase/server";
import type { SectorInsert } from "@/lib/types/database";

// Obtener todos los sectores del usuario
export async function getUserSectors() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  const { data, error } = await supabase
    .from("sectors")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Crear un nuevo sector
export async function createSector(sectorData: Omit<SectorInsert, "user_id">) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  const { data, error } = await supabase
    .from("sectors")
    .insert({
      ...sectorData,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Actualizar un sector
export async function updateSector(
  sectorId: string,
  updates: Partial<Omit<SectorInsert, "user_id">>
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el sector pertenece al usuario
  const { data: sector, error: sectorError } = await supabase
    .from("sectors")
    .select("user_id")
    .eq("id", sectorId)
    .single();

  if (sectorError) throw sectorError;
  if (!sector || sector.user_id !== userId) {
    throw new Error("Solo el dueño puede actualizar sectores");
  }

  const { data, error } = await supabase
    .from("sectors")
    .update(updates)
    .eq("id", sectorId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar un sector
export async function deleteSector(sectorId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el sector pertenece al usuario
  const { data: sector, error: sectorError } = await supabase
    .from("sectors")
    .select("user_id")
    .eq("id", sectorId)
    .single();

  if (sectorError) throw sectorError;
  if (!sector || sector.user_id !== userId) {
    throw new Error("Solo el dueño puede eliminar sectores");
  }

  const { error } = await supabase.from("sectors").delete().eq("id", sectorId);

  if (error) throw error;
}

// Funciones legacy para compatibilidad (serán eliminadas gradualmente)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getTeamSectors(_teamId: string) {
  // Ya no hay teams, retornar sectores del usuario
  return getUserSectors();
}

export async function createTeamSector(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _teamId: string,
  sectorData: Omit<SectorInsert, "user_id" | "team_id">
) {
  // Ignorar teamId ya que no existe
  // Eliminar campos que ya no existen: description, is_active
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const { description: _description, is_active: _isActive, ...cleanData } = sectorData as any;
  return createSector(cleanData);
}

export async function updateTeamSector(
  sectorId: string,
  updates: Partial<Omit<SectorInsert, "user_id" | "team_id">>
) {
  // Eliminar campos que ya no existen: description, is_active
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const { description: _description, is_active: _isActive, ...cleanUpdates } = updates as any;
  return updateSector(sectorId, cleanUpdates);
}

export async function deleteTeamSector(sectorId: string) {
  return deleteSector(sectorId);
}
