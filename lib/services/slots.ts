// Servicios para operaciones CRUD de slots de grupos
import { createClient } from "@/lib/supabase/server";
import type { GroupSlotInsert } from "@/lib/types/database";

// Obtener todos los slots del usuario
export async function getUserGroupSlots() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  const { data, error } = await supabase
    .from("group_slots")
    .select("*")
    .eq("user_id", userId)
    .order("slot_label", { ascending: true });

  if (error) {
    console.error(
      "Error al obtener group_slots - Detalles completos:",
      JSON.stringify(error, null, 2)
    );
    console.error("Propiedades del error:", Object.keys(error));
    console.error("UserID intentado:", userId);

    throw new Error(
      `Error al obtener slots: ${
        error.message || JSON.stringify(error)
      } (${error.code || "NO_CODE"})`
    );
  }
  return data || [];
}

// Crear un nuevo slot
export async function createGroupSlot(slotData: Omit<GroupSlotInsert, "user_id">) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  const { data, error } = await supabase
    .from("group_slots")
    .insert({
      ...slotData,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Actualizar un slot
export async function updateGroupSlot(
  slotId: string,
  updates: Partial<Omit<GroupSlotInsert, "user_id">>
) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el slot pertenece al usuario
  const { data: slot, error: slotError } = await supabase
    .from("group_slots")
    .select("user_id")
    .eq("id", slotId)
    .single();

  if (slotError) throw slotError;
  if (!slot || slot.user_id !== userId) {
    throw new Error("Solo el dueño puede actualizar slots");
  }

  const { data, error } = await supabase
    .from("group_slots")
    .update(updates)
    .eq("id", slotId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar un slot
export async function deleteGroupSlot(slotId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.sub;

  // Verificar que el slot pertenece al usuario
  const { data: slot, error: slotError } = await supabase
    .from("group_slots")
    .select("user_id")
    .eq("id", slotId)
    .single();

  if (slotError) throw slotError;
  if (!slot || slot.user_id !== userId) {
    throw new Error("Solo el dueño puede eliminar slots");
  }

  const { error } = await supabase.from("group_slots").delete().eq("id", slotId);

  if (error) throw error;
}
