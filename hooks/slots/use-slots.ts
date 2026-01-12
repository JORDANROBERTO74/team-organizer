"use client";

import { useState, useEffect, useCallback } from "react";
import { loadUserGroupSlots } from "@/app/dashboard/actions/slot-actions";
import type { GroupSlot } from "@/lib/types/database";

export function useSlots() {
  const [slots, setSlots] = useState<GroupSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loadUserGroupSlots();
      if (result.success) {
        setSlots(result.data);
      } else {
        setError(result.error || "Error al cargar etiquetas");
      }
    } catch (err) {
      console.error("Error al cargar etiquetas:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return { slots, loading, error, refetch: fetchSlots };
}
