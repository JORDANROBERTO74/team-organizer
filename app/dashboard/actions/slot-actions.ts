"use server";

import { revalidatePath } from "next/cache";
import {
  getUserGroupSlots,
  createGroupSlot,
  updateGroupSlot,
  deleteGroupSlot,
} from "@/lib/services/slots";
import type { GroupSlotInsert } from "@/lib/types/database";

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

export async function createSlotAction(formData: FormData) {
  try {
    // Solo obtener los campos que necesitamos, ignorar cualquier otro campo
    const slot_label = formData.get("slot_label") as string;
    const icon = formData.get("icon") as string | null;
    const description = formData.get("description") as string | null;

    if (!slot_label || slot_label.trim() === "") {
      return {
        success: false,
        error: "El nombre de la etiqueta es requerido",
      };
    }

    const trimmedLabel = slot_label.trim();
    if (trimmedLabel.length > 40) {
      return {
        success: false,
        error: "El nombre de la etiqueta no puede tener más de 40 caracteres",
      };
    }

    // Validar que el icono no sea demasiado largo
    const trimmedIcon = icon?.trim() || "Clock";
    if (trimmedIcon.length > 50) {
      return {
        success: false,
        error: "El nombre del icono no puede tener más de 50 caracteres",
      };
    }

    const slotData: Omit<GroupSlotInsert, "user_id"> = {
      slot_label: trimmedLabel,
      icon: trimmedIcon,
      description: description?.trim() || null,
    };

    const slot = await createGroupSlot(slotData);
    revalidatePath("/dashboard/slots");
    return { success: true, data: slot };
  } catch (error) {
    // Mejorar el manejo de errores para identificar el problema específico
    let errorMessage = "Error al crear la etiqueta";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Mensajes de error más amigables para errores comunes
      if (
        error.message.includes("duplicate key value violates unique constraint")
      ) {
        errorMessage =
          "Ya existe una etiqueta con ese nombre. Por favor, usa un nombre diferente.";
      } else if (
        error.message.includes("value too long for type character varying")
      ) {
        errorMessage =
          "El valor proporcionado es demasiado largo. El nombre debe tener máximo 40 caracteres y el icono máximo 50.";
      } else if (error.message.includes("null value in column")) {
        errorMessage = "Faltan datos requeridos para crear la etiqueta.";
      } else if (error.message.includes("Usuario no autenticado")) {
        errorMessage = "Debes iniciar sesión para crear etiquetas.";
      }
    }

    console.error("Error al crear etiqueta:", error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function updateSlotAction(slotId: string, formData: FormData) {
  try {
    const slot_label = formData.get("slot_label") as string;
    const icon = formData.get("icon") as string | null;
    const description = formData.get("description") as string | null;

    // Validar que la etiqueta sea requerida
    if (!slot_label || slot_label.trim() === "") {
      return {
        success: false,
        error: "El nombre de la etiqueta es requerido",
      };
    }

    const trimmedLabel = slot_label.trim();
    if (trimmedLabel.length > 40) {
      return {
        success: false,
        error: "El nombre de la etiqueta no puede tener más de 40 caracteres",
      };
    }

    const updates: Partial<Omit<GroupSlotInsert, "user_id">> = {
      slot_label: trimmedLabel,
    };

    if (icon !== null) {
      updates.icon = icon.trim() || "Clock";
    }

    // Agregar descripción si se proporciona (puede ser null para limpiarla)
    if (description !== null) {
      updates.description = description.trim() || null;
    }

    const slot = await updateGroupSlot(slotId, updates);
    revalidatePath("/dashboard/slots");
    return { success: true, data: slot };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar la etiqueta",
    };
  }
}

export async function deleteSlotAction(slotId: string) {
  try {
    await deleteGroupSlot(slotId);
    revalidatePath("/dashboard/slots");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al eliminar la etiqueta",
    };
  }
}
