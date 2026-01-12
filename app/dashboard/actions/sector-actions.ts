"use server";

import { revalidatePath } from "next/cache";
import {
  getUserSectors,
  createSector,
  updateSector,
  deleteSector,
} from "@/lib/services/sectors";
import type { SectorInsert } from "@/lib/types/database";

export async function loadUserSectors() {
  try {
    const sectors = await getUserSectors();
    return { success: true, data: sectors };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cargar sectores",
      data: [],
    };
  }
}

export async function createSectorAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const priority = formData.get("priority") as string;
    const icon = formData.get("icon") as string | null;
    const color = formData.get("color") as string | null;
    const description = formData.get("description") as string | null;

    if (!name || name.trim() === "") {
      return {
        success: false,
        error: "El nombre del sector es requerido",
      };
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return {
        success: false,
        error: "El nombre del sector no puede tener más de 100 caracteres",
      };
    }

    if (!priority || priority.trim() === "") {
      return {
        success: false,
        error: "La prioridad es requerida",
      };
    }

    const trimmedPriority = priority.trim();
    if (!["Alta", "Media", "Baja"].includes(trimmedPriority)) {
      return {
        success: false,
        error: "La prioridad debe ser Alta, Media o Baja",
      };
    }

    // Validar que el icono no sea demasiado largo
    const trimmedIcon = icon?.trim() || "Building2";
    if (trimmedIcon.length > 50) {
      return {
        success: false,
        error: "El nombre del icono no puede tener más de 50 caracteres",
      };
    }

    // Validar formato de color (debe ser hexadecimal)
    // Si no se proporciona color, generar uno aleatorio
    let trimmedColor = color?.trim();
    if (!trimmedColor) {
      // Generar color aleatorio
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      const toHex = (value: number) => {
        const hex = value.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      };
      trimmedColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(trimmedColor)) {
      return {
        success: false,
        error: "El color debe ser un código hexadecimal válido (ej: #3B82F6)",
      };
    }

    const sectorData: Omit<SectorInsert, "user_id"> = {
      name: trimmedName,
      priority: trimmedPriority,
      icon: trimmedIcon,
      color: trimmedColor,
      description: description?.trim() || null,
    };

    const sector = await createSector(sectorData);
    revalidatePath("/dashboard/sectors");
    return { success: true, data: sector };
  } catch (error) {
    // Mejorar el manejo de errores para identificar el problema específico
    let errorMessage = "Error al crear el sector";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Mensajes de error más amigables para errores comunes
      if (error.message.includes("duplicate key value violates unique constraint")) {
        errorMessage = "Ya existe un sector con ese nombre. Por favor, usa un nombre diferente.";
      } else if (error.message.includes("value too long for type character varying")) {
        errorMessage = "El valor proporcionado es demasiado largo. El nombre debe tener máximo 100 caracteres y el icono máximo 50.";
      } else if (error.message.includes("null value in column")) {
        errorMessage = "Faltan datos requeridos para crear el sector.";
      } else if (error.message.includes("Usuario no autenticado")) {
        errorMessage = "Debes iniciar sesión para crear sectores.";
      }
    }
    
    console.error("Error al crear sector:", error);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function updateSectorAction(
  sectorId: string,
  formData: FormData
) {
  try {
    const name = formData.get("name") as string;
    const priority = formData.get("priority") as string;
    const icon = formData.get("icon") as string | null;
    const color = formData.get("color") as string | null;
    const description = formData.get("description") as string | null;

    // Validar que el nombre sea requerido (consistente con updateGroupAction)
    if (!name || name.trim() === "") {
      return {
        success: false,
        error: "El nombre del sector es requerido",
      };
    }

    if (!priority || priority.trim() === "") {
      return {
        success: false,
        error: "La prioridad es requerida",
      };
    }

    const trimmedPriority = priority.trim();
    if (!["Alta", "Media", "Baja"].includes(trimmedPriority)) {
      return {
        success: false,
        error: "La prioridad debe ser Alta, Media o Baja",
      };
    }

    const updates: Partial<Omit<SectorInsert, "user_id">> = {
      name: name.trim(),
      priority: trimmedPriority,
    };

    if (icon !== null) {
      updates.icon = icon.trim() || "Building2";
    }

    if (color !== null) {
      let trimmedColor = color.trim();
      // Si está vacío, generar un color aleatorio
      if (!trimmedColor) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        const toHex = (value: number) => {
          const hex = value.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        };
        trimmedColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }
      // Validar formato de color
      if (!/^#[0-9A-Fa-f]{6}$/.test(trimmedColor)) {
        return {
          success: false,
          error: "El color debe ser un código hexadecimal válido (ej: #3B82F6)",
        };
      }
      updates.color = trimmedColor;
    }

    // Agregar descripción si se proporciona (puede ser null para limpiarla)
    if (description !== null) {
      updates.description = description.trim() || null;
    }

    const sector = await updateSector(sectorId, updates);
    revalidatePath("/dashboard/sectors");
    return { success: true, data: sector };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar el sector",
    };
  }
}

export async function deleteSectorAction(sectorId: string) {
  try {
    await deleteSector(sectorId);
    revalidatePath("/dashboard/sectors");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al eliminar el sector",
    };
  }
}
