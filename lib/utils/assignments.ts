
// Algoritmo puro para generar asignaciones de sectores
// Puede ejecutarse tanto en servidor como en cliente

export function calculateAssignments(
  memberIds: string[],
  sectorIds: string[],
  counts: Record<string, Record<string, number>>,
  lastDistribution: Record<string, string> | null,
  sectorRequirements?: Record<string, number>
): Record<string, string> {
  const assignments: Record<string, string> = {};
  const sectorUsageInCurrentDraft: Record<string, number> = {};

  // Inicializar contadores del borrador actual
  sectorIds.forEach((s) => (sectorUsageInCurrentDraft[s] = 0));

  // Lista de miembros pendientes de asignar
  // Importante: Crear copia para no mutar el original si se pasa por referencia
  const unassignedMembers = [...memberIds];

  // FASE 1: Asignar miembros a sectores con requerimientos específicos
  // Considerando el historial de rotación para mantener equidad
  if (sectorRequirements && Object.keys(sectorRequirements).length > 0) {
    // Ordenar sectores por requerimiento (mayor a menor) para priorizar
    const sectorsWithRequirements = Object.entries(sectorRequirements)
      .filter(([_, count]) => count && count > 0)
      .sort(([_, a], [__, b]) => (b || 0) - (a || 0));

    for (const [sectorId, requiredCount] of sectorsWithRequirements) {
      if (!sectorIds.includes(sectorId)) continue; // Saltar si el sector no está disponible

      const targetCount = requiredCount || 0;
      let assignedToThisSector = 0;

      // Mientras no se haya cumplido el requerimiento y haya miembros disponibles
      while (
        assignedToThisSector < targetCount &&
        unassignedMembers.length > 0
      ) {
        if (sectorUsageInCurrentDraft[sectorId] >= targetCount) {
          break; // Ya se cumplió el requerimiento
        }

        // Encontrar el miembro con menor historial en este sector
        let bestMemberIndex = -1;
        let minHistoryForSector = Infinity;

        for (let i = 0; i < unassignedMembers.length; i++) {
          const memberId = unassignedMembers[i];
          const memberCounts = counts[memberId] || {};
          const historyCount = memberCounts[sectorId] || 0;

          if (historyCount < minHistoryForSector) {
            minHistoryForSector = historyCount;
            bestMemberIndex = i;
          }
        }

        // Si encontramos un miembro, asignarlo
        if (bestMemberIndex >= 0) {
          const memberId = unassignedMembers[bestMemberIndex];
          assignments[memberId] = sectorId;
          sectorUsageInCurrentDraft[sectorId] =
            (sectorUsageInCurrentDraft[sectorId] || 0) + 1;
          assignedToThisSector++;
          unassignedMembers.splice(bestMemberIndex, 1); // Remover de la lista
        } else {
          break; // No hay más miembros disponibles
        }
      }
    }
  }

  // FASE 2: Distribuir miembros restantes de manera equitativa
  // (respetando límites máximos si hay requerimientos y evitando repetir última distribución)
  for (const memberId of unassignedMembers) {
    const memberCounts = counts[memberId] || {};

    // Encontrar sectores candidatos (que no hayan alcanzado su límite)
    const availableSectors = sectorIds.filter((sectorId) => {
      // Si hay un requerimiento definido, verificar que no se haya excedido
      if (sectorRequirements?.[sectorId] !== undefined) {
        const maxCount = sectorRequirements[sectorId] || 0;
        return (sectorUsageInCurrentDraft[sectorId] || 0) < maxCount;
      }
      // Si no hay requerimiento, el sector está disponible
      return true;
    });

    // Si no hay sectores disponibles (todos alcanzaron su límite), usar todos
    const candidatesSectors =
      availableSectors.length > 0 ? availableSectors : sectorIds;

    // Encontrar el sector con menor historial entre los candidatos
    let minHistoryCount = Infinity;
    let candidates: string[] = [];

    for (const sectorId of candidatesSectors) {
      const count = memberCounts[sectorId] || 0;
      if (count < minHistoryCount) {
        minHistoryCount = count;
        candidates = [sectorId];
      } else if (count === minHistoryCount) {
        candidates.push(sectorId);
      }
    }

    // Si hay una última distribución, evitar asignar al mismo sector que tuvo antes
    // (solo si hay múltiples candidatos con el mismo historial)
    if (lastDistribution && candidates.length > 1) {
      const lastSectorForMember = lastDistribution[memberId];
      if (lastSectorForMember) {
        // Remover el sector de la última vez de los candidatos si hay alternativas
        const filteredCandidates = candidates.filter(
          (s) => s !== lastSectorForMember
        );
        if (filteredCandidates.length > 0) {
          candidates = filteredCandidates;
        }
      }
    }

    // Desempate: elegir el sector con menos asignaciones en el borrador actual
    if (candidates.length > 1) {
      candidates.sort((a, b) => {
        const usageA = sectorUsageInCurrentDraft[a] || 0;
        const usageB = sectorUsageInCurrentDraft[b] || 0;
        return usageA - usageB;
      });
    }

    // Si no hay candidatos, saltar (no debería pasar)
    if (candidates.length === 0) continue;

    const bestSectorId = candidates[0];
    assignments[memberId] = bestSectorId;
    sectorUsageInCurrentDraft[bestSectorId] =
      (sectorUsageInCurrentDraft[bestSectorId] || 0) + 1;
  }

  return assignments;
}
