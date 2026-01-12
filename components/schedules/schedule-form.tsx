"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, X, Clock, Wand2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createScheduleAction,
  updateScheduleCompleteAction,
  getMemberSectorCountsAction,
  getLastGroupSlotDistributionAction,
} from "@/app/dashboard/actions/schedule-actions";
import { loadUserGroupsWithMembers } from "@/app/dashboard/actions/group-actions";
import { loadUserSectors } from "@/app/dashboard/actions/sector-actions";
import { loadUserGroupSlots } from "@/app/dashboard/actions/slot-actions";
import { calculateAssignments } from "@/lib/utils/assignments";
import type {
  ScheduleWithDetails,
  GroupWithMembers,
  Member,
  Sector,
  GroupSlot,
} from "@/lib/types/database";

interface ScheduleFormProps {
  date: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (schedule: ScheduleWithDetails) => void;
  schedule?: ScheduleWithDetails | null; // Para modo edición
}

type GroupConfig = {
  slotId?: string;
  memberAssignments: Record<string, string>; // memberId -> sectorId
  sectorRequirements?: Record<string, number>; // sectorId -> cantidad requerida
  useRequirements?: boolean; // Si se deben usar requerimientos personalizados
};

export function ScheduleForm({
  date,
  open,
  onOpenChange,
  onSuccess,
  schedule: initialSchedule,
}: ScheduleFormProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [slots, setSlots] = useState<GroupSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [groupConfigs, setGroupConfigs] = useState<Record<string, GroupConfig>>(
    {}
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingGroupId, setGeneratingGroupId] = useState<string | null>(
    null
  );

  // Cache para datos históricos (se limpia cuando se cierra el diálogo o se guarda)
  const [historicalDataCache, setHistoricalDataCache] = useState<{
    memberSectorCounts?: Record<string, Record<string, number>>;
    lastDistributions?: Record<string, Record<string, string> | null>; // key: `${groupId}-${slotLabel}`
    cacheKey?: string; // Para invalidar cuando cambian miembros/sectores
  }>({});

  // Helper para actualizar cache de distribución de forma segura
  const updateDistributionCache = (
    key: string,
    value: Record<string, string> | null
  ) => {
    setHistoricalDataCache((prev) => {
      const newDistributions = { ...(prev.lastDistributions || {}) };
      newDistributions[key] = value;
      return {
        ...prev,
        lastDistributions: newDistributions,
      };
    });
  };

  // Función helper para obtener el componente de icono
  const getIconComponent = (
    iconName: string | null | undefined
  ): LucideIcon => {
    if (!iconName) return Clock;
    try {
      const IconComponent = (
        LucideIcons as unknown as Record<string, LucideIcon>
      )[iconName];
      return IconComponent || Clock;
    } catch {
      return Clock;
    }
  };

  // Load data only when dialog is open and data is not already loaded
  useEffect(() => {
    if (!open) return;

    // Solo cargar datos si no están ya cargados
    const needsGroups = groups.length === 0;
    const needsSectors = sectors.length === 0;
    const needsSlots = slots.length === 0;

    if (!needsGroups && !needsSectors && !needsSlots) {
      return; // Datos ya están cargados, no hacer fetch
    }

    const fetchData = async () => {
      // Load groups solo si es necesario
      if (needsGroups) {
        setLoadingGroups(true);
        try {
          const groupsResult = await loadUserGroupsWithMembers();
          if (groupsResult.success) {
            setGroups(groupsResult.data);
          }
        } catch (error) {
          console.error("Error loading groups:", error);
        } finally {
          setLoadingGroups(false);
        }
      }

      // Load sectors solo si es necesario
      if (needsSectors) {
        setLoadingSectors(true);
        try {
          const sectorsResult = await loadUserSectors();
          if (sectorsResult.success) {
            setSectors(sectorsResult.data);
          }
        } catch (error) {
          console.error("Error loading sectors:", error);
        } finally {
          setLoadingSectors(false);
        }
      }

      // Load slots solo si es necesario
      if (needsSlots) {
        setLoadingSlots(true);
        try {
          const slotsResult = await loadUserGroupSlots();
          if (slotsResult.success) {
            setSlots(slotsResult.data);
          }
        } catch (error) {
          console.error("Error loading slots:", error);
        } finally {
          setLoadingSlots(false);
        }
      }
    };

    fetchData();
  }, [open, groups.length, sectors.length, slots.length]);

  // Limpiar cache cuando se cierra el diálogo
  useEffect(() => {
    if (!open) {
      setHistoricalDataCache({});
    }
  }, [open]);

  // Reset form when dialog opens or pre-load if editing
  useEffect(() => {
    if (!open) return;

    // Wait for groups and slots to be loaded before pre-loading schedule data
    if (initialSchedule && groups.length > 0 && slots.length > 0) {
      // Modo edición: pre-cargar datos del schedule existente
      const groupIds =
        initialSchedule.group_slots
          ?.map((slot) => slot.group?.id)
          .filter((id): id is string => !!id) || [];

      setSelectedGroupIds(groupIds);

      // Pre-cargar configuraciones de grupos
      const configs: Record<string, GroupConfig> = {};

      // Pre-cargar slots por grupo
      for (const slot of initialSchedule.group_slots || []) {
        const groupId = slot.group?.id;
        if (!groupId) continue;

        // Buscar el slot_id correspondiente en la lista de slots
        const matchingSlot = slots.find(
          (s) => s.slot_label === slot.slot_label && s.icon === slot.icon
        );

        if (matchingSlot) {
          configs[groupId] = {
            slotId: matchingSlot.id,
            memberAssignments: {},
          };
        } else {
          configs[groupId] = {
            memberAssignments: {},
          };
        }
      }

      // Pre-cargar asignaciones de miembros por grupo
      for (const assignment of initialSchedule.member_assignments || []) {
        const memberId = assignment.member?.id;
        const sectorId = assignment.sector?.id;
        if (!memberId || !sectorId) continue;

        // Encontrar a qué grupo pertenece este miembro
        const group = groups.find((g) =>
          g.members.some((m) => m.id === memberId)
        );
        if (group && configs[group.id]) {
          configs[group.id].memberAssignments[memberId] = sectorId;
        }
      }

      // Inicializar requerimientos con 0 para grupos en modo edición
      if (sectors.length > 0) {
        Object.keys(configs).forEach((groupId) => {
          if (!configs[groupId].sectorRequirements) {
            const initialRequirements: Record<string, number> = {};
            sectors.forEach((sector) => {
              initialRequirements[sector.id] = 0;
            });
            configs[groupId].sectorRequirements = initialRequirements;
          }
        });
      }

      setGroupConfigs(configs);
      setNotes(initialSchedule.notes || "");
    } else if (!initialSchedule && groups.length > 0) {
      setSelectedGroupIds([]);

      // Inicializar configuraciones vacías (solo se crearán cuando se seleccione un grupo)
      setGroupConfigs({});
      setNotes("");
    }
  }, [open, initialSchedule, groups, slots, sectors]);

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const isSelected = prev.includes(groupId);
      if (isSelected) {
        // Remove config if deselected
        setGroupConfigs((prevConfigs) => {
          const newConfigs = { ...prevConfigs };
          delete newConfigs[groupId];
          return newConfigs;
        });
        return prev.filter((id) => id !== groupId);
      } else {
        // Init config if selected
        const newConfig: GroupConfig = {
          memberAssignments: {},
          sectorRequirements: {},
        };

        // Inicializar requerimientos con 0 para todos los sectores
        if (sectors.length > 0) {
          const initialRequirements: Record<string, number> = {};
          sectors.forEach((sector) => {
            initialRequirements[sector.id] = 0;
          });
          newConfig.sectorRequirements = initialRequirements;
        }

        setGroupConfigs((prevConfigs) => ({
          ...prevConfigs,
          [groupId]: newConfig,
        }));
        return [...prev, groupId];
      }
    });
  };

  const handleSlotChange = (groupId: string, slotId: string) => {
    // Validar que el slotId existe
    const slotExists = slots.some((s) => s.id === slotId);
    if (!slotExists) {
      toast.error("La etiqueta seleccionada no es válida");
      return;
    }

    setGroupConfigs((prev) => ({
      ...prev,
      [groupId]: {
        ...(prev[groupId] || { memberAssignments: {} }),
        slotId,
      },
    }));
  };

  const handleMemberAssignment = (
    groupId: string,
    memberId: string,
    sectorId: string
  ) => {
    setGroupConfigs((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        memberAssignments: {
          ...prev[groupId]?.memberAssignments,
          [memberId]: sectorId,
        },
      },
    }));
  };

  const removeMemberAssignment = (groupId: string, memberId: string) => {
    setGroupConfigs((prev) => {
      const newAssignments = { ...prev[groupId]?.memberAssignments };
      delete newAssignments[memberId];
      return {
        ...prev,
        [groupId]: {
          ...prev[groupId],
          memberAssignments: newAssignments,
        },
      };
    });
  };

  // Helper para verificar si hay al menos un sector con miembros requeridos
  const hasAtLeastOneSectorWithMembers = (groupId: string): boolean => {
    const config = groupConfigs[groupId] || { memberAssignments: {} };
    const requirements = config.sectorRequirements || {};
    return Object.values(requirements).some((count) => (count || 0) > 0);
  };

  const handleToggleRequirements = (groupId: string, enabled: boolean) => {
    setGroupConfigs((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        useRequirements: enabled,
      },
    }));
  };

  const handleGenerateAssignments = async (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group || !group.members || group.members.length === 0) {
      toast.error("El grupo no tiene miembros para asignar");
      return;
    }

    if (sectors.length === 0) {
      toast.error("No hay sectores disponibles");
      return;
    }

    const config = groupConfigs[groupId] || { memberAssignments: {} };
    const useRequirements = config.useRequirements ?? false;
    const requirements = useRequirements
      ? config.sectorRequirements || {}
      : undefined;

    // Solo validar requerimientos si están habilitados
    if (useRequirements) {
      // Validar que al menos un sector tenga miembros
      if (!hasAtLeastOneSectorWithMembers(groupId)) {
        toast.error("Al menos un sector debe tener miembros asignados");
        return;
      }

      // Validar que la suma de requerimientos no exceda el número de miembros
      const totalRequired = Object.values(requirements || {}).reduce(
        (sum, count) => sum + (count || 0),
        0
      );

      if (totalRequired > group.members.length) {
        toast.error(
          `La suma de requerimientos (${totalRequired}) excede el número de miembros (${group.members.length})`
        );
        return;
      }
    }

    // Validar que haya una etiqueta seleccionada
    if (!config.slotId) {
      toast.error(
        "Selecciona una etiqueta para el grupo antes de generar asignaciones"
      );
      return;
    }

    const selectedSlot = slots.find((s) => s.id === config.slotId);
    if (!selectedSlot) {
      toast.error("La etiqueta seleccionada no es válida");
      return;
    }

    setGeneratingGroupId(groupId);
    try {
      const memberIds = group.members.map((m) => m.id);
      const sectorIds = sectors.map((s) => s.id);

      // Generar clave de cache para memberSectorCounts (global para todos los miembros)
      const countsCacheKey = `${memberIds.sort().join(",")}-${sectorIds
        .sort()
        .join(",")}`;

      // Generar clave de cache para lastDistribution (específico por grupo y etiqueta)
      const distributionCacheKey = `${groupId}-${selectedSlot.slot_label}`;

      // Verificar cache para memberSectorCounts
      let cachedCounts = historicalDataCache.memberSectorCounts;
      let needsCountsFetch = false;

      if (!cachedCounts || historicalDataCache.cacheKey !== countsCacheKey) {
        needsCountsFetch = true;
      }

      // Verificar cache para lastDistribution
      let cachedLastDistribution =
        historicalDataCache.lastDistributions?.[distributionCacheKey];
      let needsDistributionFetch = false;

      if (cachedLastDistribution === undefined) {
        needsDistributionFetch = true;
      }

      // Obtener datos históricos si no están en cache
      if (needsCountsFetch) {
        const countsResult = await getMemberSectorCountsAction(
          memberIds,
          sectorIds
        );
        if (countsResult.success && countsResult.data) {
          cachedCounts = countsResult.data;
          setHistoricalDataCache((prev) => ({
            ...prev,
            memberSectorCounts: countsResult.data,
            cacheKey: countsCacheKey,
          }));
        }
      }

      if (needsDistributionFetch) {
        const distributionResult = await getLastGroupSlotDistributionAction(
          groupId,
          selectedSlot.slot_label
        );
        if (distributionResult.success) {
          cachedLastDistribution = distributionResult.data ?? null;
          updateDistributionCache(distributionCacheKey, cachedLastDistribution);
        }
      }

      // Validar que tenemos los datos necesarios
      if (!cachedCounts) {
        toast.error("Error: no se pudieron obtener los datos históricos");
        return;
      }

      // Ejecutar el algoritmo LOCALMENTE en el cliente (sin petición al servidor)
      const assignments = calculateAssignments(
        memberIds,
        sectorIds,
        cachedCounts,
        cachedLastDistribution ?? null,
        requirements
      );

      // Actualizar el estado directamente
      setGroupConfigs((prev) => ({
        ...prev,
        [groupId]: {
          ...(prev[groupId] || { memberAssignments: {} }),
          memberAssignments: assignments,
          // Preservar slotId y otros campos
          slotId: config.slotId,
          sectorRequirements: config.sectorRequirements,
          useRequirements: config.useRequirements,
        },
      }));
      toast.success("Asignaciones generadas correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error inesperado al generar asignaciones");
    } finally {
      setGeneratingGroupId(null);
    }
  };

  const handleSectorRequirementChange = (
    groupId: string,
    sectorId: string,
    value: string
  ) => {
    // Si está vacío, establecer a 0
    if (value === "") {
      setGroupConfigs((prev) => {
        const currentConfig = prev[groupId] || {
          memberAssignments: {},
          sectorRequirements: {},
        };
        const currentRequirements = currentConfig.sectorRequirements || {};

        const newRequirements = {
          ...currentRequirements,
          [sectorId]: 0,
        };

        return {
          ...prev,
          [groupId]: {
            ...currentConfig,
            sectorRequirements: newRequirements,
          },
        };
      });
      return;
    }

    // Validar y convertir a número
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
      return; // Ignorar valores inválidos
    }

    // Validar que no exceda el máximo de miembros del grupo
    const group = groups.find((g) => g.id === groupId);
    if (group && numValue > group.members.length) {
      toast.error(
        `El valor no puede exceder el número de miembros (${group.members.length})`
      );
      return;
    }

    setGroupConfigs((prev) => {
      const currentConfig = prev[groupId] || {
        memberAssignments: {},
        sectorRequirements: {},
      };
      const currentRequirements = currentConfig.sectorRequirements || {};

      const newRequirements = {
        ...currentRequirements,
        [sectorId]: numValue,
      };

      return {
        ...prev,
        [groupId]: {
          ...currentConfig,
          sectorRequirements: newRequirements,
        },
      };
    });
  };

  const handleSubmit = async () => {
    if (!date) return;
    if (selectedGroupIds.length === 0) {
      toast.error("Selecciona al menos un grupo");
      return;
    }

    // Validar que cada grupo tenga slot seleccionado
    for (const groupId of selectedGroupIds) {
      const group = groups.find((g) => g.id === groupId);
      if (!group) continue;

      if (!groupConfigs[groupId]?.slotId) {
        toast.error(`Selecciona una etiqueta para el grupo ${group.name}`);
        return;
      }

      // Validar que todos los miembros tengan un sector asignado
      const config = groupConfigs[groupId];
      if (group.members && group.members.length > 0) {
        for (const member of group.members) {
          const assignedSectorId = config.memberAssignments[member.id];
          if (!assignedSectorId || assignedSectorId === "none") {
            toast.error(
              `Asigna un sector al miembro ${member.first_name} ${member.last_name} del grupo ${group.name}`
            );
            return;
          }
          // Validar que el sectorId existe en la lista de sectores
          const sectorExists = sectors.some((s) => s.id === assignedSectorId);
          if (!sectorExists) {
            toast.error(
              `El sector asignado al miembro ${member.first_name} ${member.last_name} ya no existe. Por favor, reasigna.`
            );
            return;
          }
        }
      }
    }

    setIsSubmitting(true);

    try {
      // Preparar datos
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const scheduleDate = `${year}-${month}-${day}`;

      const groupRoles = selectedGroupIds.map((groupId) => {
        const config = groupConfigs[groupId];
        const slot = slots.find((s) => s.id === config.slotId);
        return {
          group_id: groupId,
          slot_label: slot?.slot_label || "",
          icon: slot?.icon || null,
        };
      });

      const memberAssignments = [];
      for (const groupId of selectedGroupIds) {
        const config = groupConfigs[groupId];
        for (const [memberId, sectorId] of Object.entries(
          config.memberAssignments
        )) {
          if (sectorId && sectorId !== "none") {
            memberAssignments.push({
              member_id: memberId,
              sector_id: sectorId,
            });
          }
        }
      }

      if (initialSchedule) {
        // Modo edición: actualizar schedule existente
        const result = await updateScheduleCompleteAction(
          initialSchedule.id,
          { schedule_date: scheduleDate, notes: notes.trim() || null },
          groupRoles,
          memberAssignments
        );

        if (result.success && result.data) {
          // Limpiar cache porque los datos históricos han cambiado
          setHistoricalDataCache({});
          toast.success("Turno actualizado exitosamente");
          if (onSuccess) {
            // Necesitamos obtener el schedule completo con detalles
            // Por ahora, pasamos los datos básicos
            onSuccess(result.data as ScheduleWithDetails);
          }
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al actualizar turno");
        }
      } else {
        // Modo creación: crear nuevo schedule
        const result = await createScheduleAction(
          { schedule_date: scheduleDate, notes: notes.trim() || null },
          groupRoles,
          memberAssignments
        );

        if (result.success && result.data) {
          // Limpiar cache porque los datos históricos han cambiado
          setHistoricalDataCache({});
          toast.success("Turnos creados exitosamente");
          if (onSuccess) onSuccess(result.data as ScheduleWithDetails);
          onOpenChange(false);
        } else {
          toast.error(result.error || "Error al crear turnos");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Error inesperado al crear turnos");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loadingGroups || loadingSectors || loadingSlots;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {initialSchedule ? "Editar Turno" : "Programar Turnos"}
          </DialogTitle>
          <DialogDescription>
            {initialSchedule
              ? "Modifica los grupos y asignaciones para este día."
              : `Configura los grupos, etiquetas y asignaciones para el ${date?.toLocaleDateString()}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-4">
            {/* Selección de Grupos */}
            <div className="flex flex-col gap-3">
              <Label>Grupos Disponibles</Label>
              <div className="flex flex-wrap gap-2">
                {groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 w-full py-4 border border-dashed rounded-md bg-muted/30">
                    <p className="text-sm text-muted-foreground text-center">
                      No tienes grupos creados.
                    </p>
                    <Button
                      variant="default"
                      onClick={() => {
                        onOpenChange(false);
                        router.push("/dashboard/groups");
                      }}
                    >
                      Crear Grupo
                    </Button>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div
                      key={group.id}
                      className={`
                            border rounded-md px-3 py-2 cursor-pointer transition-colors flex items-center gap-2 select-none
                            ${
                              selectedGroupIds.includes(group.id)
                                ? "bg-primary/10 border-primary text-primary"
                                : "hover:bg-accent border-input"
                            }
                          `}
                      onClick={() => handleGroupToggle(group.id)}
                    >
                      <Checkbox
                        checked={selectedGroupIds.includes(group.id)}
                        onCheckedChange={() => handleGroupToggle(group.id)}
                        className="pointer-events-none" // Handle click on container
                      />
                      <span className="font-medium text-sm">{group.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Configuración de Grupos Seleccionados */}
            {selectedGroupIds.length > 0 && (
              <div className="flex flex-col gap-4">
                <Label>Configuración de Grupos</Label>
                {selectedGroupIds.map((groupId) => {
                  const group = groups.find((g) => g.id === groupId);
                  if (!group) return null;
                  const config = groupConfigs[groupId] || {
                    memberAssignments: {},
                  };

                  return (
                    <Card key={groupId}>
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="text-base flex items-center justify-between">
                          {group.name}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleGroupToggle(groupId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </CardTitle>
                        {group.description && (
                          <CardDescription className="text-xs mt-1">
                            {group.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4">
                        {/* Selector de Etiqueta */}
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs">
                            Etiqueta del Grupo{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          {slots.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-3 border border-dashed rounded-md bg-muted/30">
                              <p className="text-xs text-muted-foreground text-center">
                                No tienes etiquetas creadas.
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  onOpenChange(false);
                                  router.push("/dashboard/slots");
                                }}
                              >
                                Crear Etiqueta
                              </Button>
                            </div>
                          ) : (
                            <Select
                              value={config.slotId}
                              onValueChange={(val) =>
                                handleSlotChange(groupId, val)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona una etiqueta" />
                              </SelectTrigger>
                              <SelectContent>
                                {slots.map((slot) => {
                                  const IconComponent = getIconComponent(
                                    slot.icon
                                  );
                                  return (
                                    <SelectItem key={slot.id} value={slot.id}>
                                      <div className="flex items-center gap-2">
                                        <IconComponent className="h-4 w-4" />
                                        <span>{slot.slot_label}</span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        {/* Toggle y Configuración de Requerimientos por Sector */}
                        {sectors.length > 0 &&
                          group.members &&
                          group.members.length > 0 && (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={config.useRequirements ?? false}
                                    onCheckedChange={(checked) =>
                                      handleToggleRequirements(groupId, checked)
                                    }
                                    disabled={!config.slotId}
                                  />
                                  <Label className="text-xs font-medium cursor-pointer">
                                    Requerimientos Personalizados
                                  </Label>
                                </div>
                              </div>
                              {config.useRequirements && (
                                <div className="flex flex-col gap-2 p-3 border rounded-md bg-muted/30">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-medium">
                                      Requerimientos por Sector
                                    </Label>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {sectors.map((sector) => {
                                      const SectorIconComponent =
                                        getIconComponent(sector.icon);
                                      const requirement =
                                        config.sectorRequirements?.[
                                          sector.id
                                        ] ?? 0;
                                      return (
                                        <div
                                          key={sector.id}
                                          className="flex items-center gap-2"
                                        >
                                          <SectorIconComponent className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                          <Label className="flex-1 text-xs w-20 truncate">
                                            {sector.name}:
                                          </Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            max={group.members.length}
                                            value={requirement}
                                            onChange={(e) =>
                                              handleSectorRequirementChange(
                                                groupId,
                                                sector.id,
                                                e.target.value
                                              )
                                            }
                                            onFocus={(e) => {
                                              // Seleccionar todo el texto cuando el valor es 0 para facilitar la edición
                                              if (e.target.value === "0") {
                                                e.target.select();
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              // Si el valor es 0 y el usuario presiona un número, reemplazar el 0
                                              if (
                                                (e.target as HTMLInputElement)
                                                  .value === "0" &&
                                                /^[0-9]$/.test(e.key)
                                              ) {
                                                e.preventDefault();
                                                handleSectorRequirementChange(
                                                  groupId,
                                                  sector.id,
                                                  e.key
                                                );
                                              }
                                            }}
                                            disabled={!config.slotId}
                                            className="h-7 text-xs w-16"
                                            placeholder="0"
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <span className="text-destructive">*</span>{" "}
                                    Al menos un sector debe tener miembros
                                    asignados
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                        {/* Asignación de Miembros */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">
                              Asignar Sectores{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              onClick={() => handleGenerateAssignments(groupId)}
                              disabled={
                                generatingGroupId === groupId ||
                                sectors.length === 0 ||
                                !group.members ||
                                group.members.length === 0 ||
                                !config.slotId ||
                                (config.useRequirements &&
                                  !hasAtLeastOneSectorWithMembers(groupId))
                              }
                            >
                              {generatingGroupId === groupId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Wand2 className="h-3.5 w-3.5" />
                              )}
                              Generar
                            </Button>
                          </div>
                          {group.members && group.members.length > 0 ? (
                            sectors.length === 0 ? (
                              <div className="flex flex-col items-center justify-center gap-2 py-3 border border-dashed rounded-md bg-muted/30">
                                <p className="text-xs text-muted-foreground text-center">
                                  No tienes sectores creados para asignar.
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    onOpenChange(false);
                                    router.push("/dashboard/sectors");
                                  }}
                                >
                                  Crear Sector
                                </Button>
                              </div>
                            ) : (
                              <div className="grid gap-2">
                                {group.members.map((member: Member) => (
                                  <div
                                    key={member.id}
                                    className="grid grid-cols-[1fr,1.5fr] items-center gap-2 text-sm"
                                  >
                                    <span className="truncate">
                                      {member.first_name} {member.last_name}
                                    </span>
                                    <Select
                                      value={
                                        config.memberAssignments[member.id] ||
                                        "none"
                                      }
                                      onValueChange={(val) => {
                                        if (val === "none")
                                          removeMemberAssignment(
                                            groupId,
                                            member.id
                                          );
                                        else
                                          handleMemberAssignment(
                                            groupId,
                                            member.id,
                                            val
                                          );
                                      }}
                                      disabled={!config.slotId}
                                    >
                                      <SelectTrigger className="h-8 w-full">
                                        <SelectValue placeholder="Selecciona un sector (requerido)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          Sin asignar
                                        </SelectItem>
                                        {sectors.map((sector) => {
                                          const SectorIconComponent =
                                            getIconComponent(sector.icon);
                                          return (
                                            <SelectItem
                                              key={sector.id}
                                              value={sector.id}
                                            >
                                              <div className="flex items-center gap-2">
                                                <SectorIconComponent className="h-4 w-4" />
                                                <span>{sector.name}</span>
                                              </div>
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ))}
                              </div>
                            )
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Este grupo no tiene miembros.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notas Generales</Label>
              <Textarea
                id="notes"
                placeholder="Notas opcionales para este día..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || isLoading || selectedGroupIds.length === 0
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : initialSchedule ? (
              "Actualizar Turno"
            ) : (
              "Guardar Turnos"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
