// Tipos TypeScript para la base de datos
// Estos tipos coinciden con las tablas de Supabase según supabase-schema.sql

// ======================================================
// TABLAS PRINCIPALES
// ======================================================

export type Group = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type Sector = {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  priority: string | null;
  created_at: string;
};

export type GroupSlot = {
  id: string;
  user_id: string;
  slot_label: string;
  icon: string | null;
  description: string | null;
  priority: string | null;
  created_at: string;
};

export type Member = {
  id: string;
  user_id: string;
  group_id: string | null;
  member_code: string | null;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DailySchedule = {
  id: string;
  user_id: string;
  schedule_date: string; // Formato: YYYY-MM-DD
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduleGroupSlot = {
  id: string;
  schedule_id: string;
  group_id: string;
  slot_label: string;
  icon: string | null;
  created_at: string;
};

// Alias legacy para compatibilidad durante migración
export type DailyGroupRole = ScheduleGroupSlot;

export type DailyMemberAssignment = {
  id: string;
  schedule_id: string;
  member_id: string;
  sector_id: string;
};

// ======================================================
// TIPOS PARA INSERTAR (sin campos generados automáticamente)
// ======================================================

export type GroupInsert = Omit<Group, "id" | "created_at">;
export type SectorInsert = Omit<Sector, "id" | "created_at">;
export type GroupSlotInsert = Omit<GroupSlot, "id" | "created_at">;
export type MemberInsert = Omit<Member, "id" | "created_at" | "updated_at">;
export type DailyScheduleInsert = Omit<
  DailySchedule,
  "id" | "created_at" | "updated_at"
>;
export type ScheduleGroupSlotInsert = Omit<
  ScheduleGroupSlot,
  "id" | "created_at"
>;
export type DailyGroupRoleInsert = ScheduleGroupSlotInsert; // Alias legacy
export type DailyMemberAssignmentInsert = Omit<DailyMemberAssignment, "id">;

// ======================================================
// TIPOS CON RELACIONES (para queries con JOIN)
// ======================================================

export type GroupWithMembers = Group & {
  members: Member[];
};

export type DailyScheduleWithDetails = DailySchedule & {
  group_slots: Array<ScheduleGroupSlot & { group: Group }>;
  // Alias legacy para compatibilidad
  group_roles: Array<ScheduleGroupSlot & { group: Group }>;
  member_assignments: Array<
    DailyMemberAssignment & {
      member: Member;
      sector: Sector;
    }
  >;
};

// ======================================================
// TIPOS LEGACY (para compatibilidad durante migración)
// ======================================================
// Estos tipos se mantienen temporalmente para evitar errores
// durante la migración, pero deben eliminarse gradualmente

// Tipo legacy para compatibilidad - retornará siempre array vacío
export type Team = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
};
export type TeamGroup = Group; // Alias para compatibilidad
export type TeamMember = Member; // Alias para compatibilidad
export type TeamSchedule = DailySchedule; // Alias para compatibilidad
export type ScheduleTeamRole = ScheduleGroupSlot; // Alias para compatibilidad
export type ScheduleMemberAssignment = DailyMemberAssignment; // Alias para compatibilidad

export type ScheduleWithDetails = DailyScheduleWithDetails; // Alias para compatibilidad
