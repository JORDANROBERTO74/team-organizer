"use client";

import { useState, useEffect, useTransition } from "react";
import {
  loadUserGroups,
  updateGroupAction,
  deleteGroupAction,
} from "@/app/dashboard/actions/group-actions";
import type { Group, GroupInsert } from "@/lib/types/database";

interface UseGroupsOptions {
  initialGroups?: Group[];
}

export function useGroups(options: UseGroupsOptions = {}) {
  const [groups, setGroups] = useState<Group[]>(options.initialGroups || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasInitialGroups = !!options.initialGroups && options.initialGroups.length > 0;

  useEffect(() => {
    // Solo cargar si no hay initialGroups (solo una vez al montar)
    if (!hasInitialGroups) {
      let cancelled = false;
      
      const fetchGroups = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await loadUserGroups();
          if (!cancelled) {
            if (result.success) {
              setGroups(result.data);
            } else {
              setError(result.error || "Error al cargar grupos");
            }
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Error desconocido");
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };

      fetchGroups();
      
      return () => {
        cancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío: solo ejecutar una vez al montar

  // createGroup eliminado - usar directamente createGroupAction desde GroupForm

  const updateGroup = async (
    groupId: string,
    updates: Partial<Omit<GroupInsert, "user_id">>
  ): Promise<{ success: boolean; error?: string; data?: Group }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        // Actualización optimista
        const previousGroups = [...groups];
        const optimisticGroup = groups.find(g => g.id === groupId);
        
        if (optimisticGroup) {
          setGroups((prev) =>
            prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
          );
        }

        try {
          setError(null);
          const formData = new FormData();
          if (updates.name) formData.append("name", updates.name);
          if (updates.description !== undefined) {
            formData.append("description", updates.description || "");
          }

          const result = await updateGroupAction(groupId, formData);
          if (result.success && result.data) {
            // Actualizar con datos reales del servidor
            setGroups((prev) =>
              prev.map((g) => (g.id === groupId ? result.data! : g))
            );
            resolve({ success: true, data: result.data });
          } else {
            // Revertir en caso de error
            setGroups(previousGroups);
            setError(result.error || "Error al actualizar grupo");
            resolve({ success: false, error: result.error });
          }
        } catch (err) {
          // Revertir en caso de error
          setGroups(previousGroups);
          const errorMessage =
            err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  };

  const deleteGroup = async (
    groupId: string
  ): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        // Actualización optimista
        const previousGroups = [...groups];
        setGroups((prev) => prev.filter((g) => g.id !== groupId));

        try {
          setError(null);
          const result = await deleteGroupAction(groupId);
          if (result.success) {
            // Ya eliminado optimistamente
            resolve({ success: true });
          } else {
            // Revertir en caso de error
            setGroups(previousGroups);
            setError(result.error || "Error al eliminar grupo");
            resolve({ success: false, error: result.error });
          }
        } catch (err) {
          // Revertir en caso de error
          setGroups(previousGroups);
          const errorMessage =
            err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  };

  const refreshGroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadUserGroups();
      if (result.success) {
        setGroups(result.data);
        return { success: true, data: result.data };
      } else {
        setError(result.error || "Error al cargar grupos");
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    groups,
    isLoading,
    error,
    isPending,
    updateGroup,
    deleteGroup,
    refreshGroups,
  };
}
