-- ======================================================
-- 0. LIMPIEZA TOTAL
-- ======================================================
DROP VIEW IF EXISTS v_user_calendar;

DROP TABLE IF EXISTS daily_member_assignments CASCADE;
DROP TABLE IF EXISTS schedule_group_slots CASCADE;
DROP TABLE IF EXISTS daily_schedules CASCADE;
DROP TABLE IF EXISTS group_slots CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS sectors CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================================================
-- 1. CATÁLOGOS
-- ======================================================

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE TABLE group_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_label VARCHAR(40) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slot_label)
);

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  member_code TEXT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, member_code)
);

-- ======================================================
-- 2. CALENDARIO Y SLOTS
-- ======================================================

CREATE TABLE daily_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, schedule_date)
);

CREATE TABLE schedule_group_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES daily_schedules(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  slot_label VARCHAR(40) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, group_id, slot_label)
);

CREATE TABLE daily_member_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES daily_schedules(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  UNIQUE(schedule_id, member_id)
);

-- ======================================================
-- 3. RLS
-- ======================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_group_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_member_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner only" ON groups FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Owner only" ON sectors FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Owner only" ON group_slots FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Owner only" ON members FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Owner only" ON daily_schedules FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Owner slot only" ON schedule_group_slots FOR ALL
USING (EXISTS (
  SELECT 1 FROM daily_schedules ds
  WHERE ds.id = schedule_id AND ds.user_id = auth.uid()
));

CREATE POLICY "Owner assignment only" ON daily_member_assignments FOR ALL
USING (EXISTS (
  SELECT 1 FROM daily_schedules ds
  WHERE ds.id = schedule_id AND ds.user_id = auth.uid()
));

-- ======================================================
-- 4. FUNCIONES Y TRIGGERS
-- ======================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_member_group_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.group_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = NEW.group_id AND g.user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'El grupo no pertenece al mismo usuario del miembro';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_slot_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM groups g
    JOIN daily_schedules ds ON ds.id = NEW.schedule_id
    WHERE g.id = NEW.group_id AND g.user_id = ds.user_id
  ) THEN
    RAISE EXCEPTION 'El grupo no pertenece al dueño del calendario';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_assignment_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM members m
    JOIN daily_schedules ds ON ds.id = NEW.schedule_id
    WHERE m.id = NEW.member_id AND m.user_id = ds.user_id
  ) THEN
    RAISE EXCEPTION 'El miembro no pertenece al dueño del calendario';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM sectors s
    JOIN daily_schedules ds ON ds.id = NEW.schedule_id
    WHERE s.id = NEW.sector_id AND s.user_id = ds.user_id
  ) THEN
    RAISE EXCEPTION 'El sector no pertenece al dueño del calendario';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_members_upd BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_validate_member_group BEFORE INSERT OR UPDATE ON members FOR EACH ROW EXECUTE FUNCTION validate_member_group_owner();
CREATE TRIGGER tr_schedules_upd BEFORE UPDATE ON daily_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_validate_slot BEFORE INSERT OR UPDATE ON schedule_group_slots FOR EACH ROW EXECUTE FUNCTION validate_slot_ownership();
CREATE TRIGGER tr_validate_assignment BEFORE INSERT OR UPDATE ON daily_member_assignments FOR EACH ROW EXECUTE FUNCTION validate_assignment_ownership();

-- ======================================================
-- 5. VISTA
-- ======================================================

CREATE OR REPLACE VIEW v_user_calendar
WITH (security_invoker = true) AS
SELECT
  ds.schedule_date,
  g.name AS group_name,
  sgs.slot_label,
  sgs.color AS slot_color,
  m.first_name || ' ' || m.last_name AS member_name,
  sec.name AS sector_name,
  sec.color AS sector_color
FROM daily_schedules ds
JOIN schedule_group_slots sgs ON ds.id = sgs.schedule_id
JOIN groups g ON sgs.group_id = g.id
JOIN members m ON g.id = m.group_id
LEFT JOIN daily_member_assignments dma ON (ds.id = dma.schedule_id AND m.id = dma.member_id)
LEFT JOIN sectors sec ON dma.sector_id = sec.id;
