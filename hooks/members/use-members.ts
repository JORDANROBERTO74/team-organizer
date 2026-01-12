"use client";

import { useState, useEffect, useTransition } from "react";
import {
  loadUserMembers,
  createMemberAction,
  updateMemberAction,
  deleteMemberAction,
} from "@/app/dashboard/actions/member-actions";
import type { Member, MemberInsert } from "@/lib/types/database";

interface UseMembersOptions {
  initialMembers?: Member[];
}

export function useMembers(options: UseMembersOptions = {}) {
  const { initialMembers } = options;
  const [members, setMembers] = useState<Member[]>(initialMembers || []);
  const [isLoading, setIsLoading] = useState(!initialMembers || initialMembers.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasInitialMembers = !!initialMembers && initialMembers.length > 0;

  useEffect(() => {
    // Solo cargar si no hay initialMembers (solo una vez al montar)
    if (!hasInitialMembers) {
      let cancelled = false;
      
      const fetchMembers = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await loadUserMembers();
          if (!cancelled) {
            if (result.success) {
              setMembers(result.data);
            } else {
              setError(result.error || "Error al cargar miembros");
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

      fetchMembers();
      
      return () => {
        cancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío: solo ejecutar una vez al montar

  const createMember = async (
    memberData: Omit<MemberInsert, "user_id">
  ): Promise<{ success: boolean; error?: string; data?: Member }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const formData = new FormData();
          formData.append("first_name", memberData.first_name);
          formData.append("last_name", memberData.last_name);
          if (memberData.group_id) {
            formData.append("group_id", memberData.group_id);
          }
          formData.append("is_active", String(memberData.is_active ?? true));

          const result = await createMemberAction(formData);
          if (result.success && result.data) {
            setMembers((prev) => [...prev, result.data!]);
            resolve({ success: true, data: result.data });
          } else {
            setError(result.error || "Error al crear miembro");
            resolve({ success: false, error: result.error });
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  };

  const updateMember = async (
    memberId: string,
    updates: Partial<Omit<MemberInsert, "user_id">>
  ): Promise<{ success: boolean; error?: string; data?: Member }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const formData = new FormData();
          if (updates.first_name !== undefined) {
            formData.append("first_name", updates.first_name);
          }
          if (updates.last_name !== undefined) {
            formData.append("last_name", updates.last_name);
          }
          if (updates.group_id !== undefined) {
            formData.append("group_id", updates.group_id || "");
          }
          if (updates.is_active !== undefined) {
            formData.append("is_active", String(updates.is_active));
          }

          const result = await updateMemberAction(memberId, formData);
          if (result.success && result.data) {
            setMembers((prev) =>
              prev.map((m) => (m.id === memberId ? result.data! : m))
            );
            resolve({ success: true, data: result.data });
          } else {
            setError(result.error || "Error al actualizar miembro");
            resolve({ success: false, error: result.error });
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  };

  const deleteMember = async (
    memberId: string
  ): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const result = await deleteMemberAction(memberId);
          if (result.success) {
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
            resolve({ success: true });
          } else {
            setError(result.error || "Error al eliminar miembro");
            resolve({ success: false, error: result.error });
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Error desconocido";
          setError(errorMessage);
          resolve({ success: false, error: errorMessage });
        }
      });
    });
  };

  const refreshMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadUserMembers();
      if (result.success) {
        setMembers(result.data);
      } else {
        setError(result.error || "Error al cargar miembros");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    members,
    isLoading,
    error,
    isPending,
    createMember,
    updateMember,
    deleteMember,
    refreshMembers,
  };
}
