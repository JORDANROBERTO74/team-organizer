"use client";

import { useState, useEffect, useTransition } from "react";
import {
  loadUserSectors,
  createSectorAction,
  updateSectorAction,
  deleteSectorAction,
} from "@/app/dashboard/actions/sector-actions";
import type { Sector, SectorInsert } from "@/lib/types/database";

interface UseSectorsOptions {
  initialSectors?: Sector[];
}

export function useSectors(options: UseSectorsOptions = {}) {
  const { initialSectors } = options;
  const [sectors, setSectors] = useState<Sector[]>(initialSectors || []);
  const [isLoading, setIsLoading] = useState(!initialSectors || initialSectors.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasInitialSectors = !!initialSectors && initialSectors.length > 0;

  useEffect(() => {
    // Solo cargar si no hay initialSectors (solo una vez al montar)
    if (!hasInitialSectors) {
      let cancelled = false;
      
      const fetchSectors = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await loadUserSectors();
          if (!cancelled) {
            if (result.success) {
              setSectors(result.data);
            } else {
              setError(result.error || "Error al cargar sectores");
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

      fetchSectors();
      
      return () => {
        cancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío: solo ejecutar una vez al montar

  const createSector = async (
    sectorData: Omit<SectorInsert, "user_id">
  ): Promise<{ success: boolean; error?: string; data?: Sector }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const formData = new FormData();
          formData.append("name", sectorData.name);
          if (sectorData.color) {
            formData.append("color", sectorData.color);
          }

          const result = await createSectorAction(formData);
          if (result.success && result.data) {
            setSectors((prev) => [...prev, result.data!]);
            resolve({ success: true, data: result.data });
          } else {
            setError(result.error || "Error al crear sector");
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

  const updateSector = async (
    sectorId: string,
    updates: Partial<Omit<SectorInsert, "user_id">>
  ): Promise<{ success: boolean; error?: string; data?: Sector }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const formData = new FormData();
          if (updates.name !== undefined) {
            formData.append("name", updates.name);
          }
          if (updates.color !== undefined) {
            formData.append("color", updates.color || "");
          }

          const result = await updateSectorAction(sectorId, formData);
          if (result.success && result.data) {
            setSectors((prev) =>
              prev.map((s) => (s.id === sectorId ? result.data! : s))
            );
            resolve({ success: true, data: result.data });
          } else {
            setError(result.error || "Error al actualizar sector");
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

  const deleteSector = async (
    sectorId: string
  ): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(null);
          const result = await deleteSectorAction(sectorId);
          if (result.success) {
            setSectors((prev) => prev.filter((s) => s.id !== sectorId));
            resolve({ success: true });
          } else {
            setError(result.error || "Error al eliminar sector");
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

  const refreshSectors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadUserSectors();
      if (result.success) {
        setSectors(result.data);
      } else {
        setError(result.error || "Error al cargar sectores");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sectors,
    isLoading,
    error,
    isPending,
    createSector,
    updateSector,
    deleteSector,
    refreshSectors,
  };
}
