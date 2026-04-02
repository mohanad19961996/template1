import { NextResponse } from 'next/server';

// POST /api/setup-db — returns SQL to create all tables
// Copy output and run in Supabase Dashboard > SQL Editor
// Delete this file after setup
export async function POST() {
  const sql = `
-- ============================================
-- HABITS APP — SUPABASE TABLE SETUP
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. HABITS — stores full habit objects as JSONB
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default-user',
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);

-- 2. HABIT LOGS — daily completion logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default-user',
  habit_id TEXT NOT NULL,
  date TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logs_habit_user_date ON habit_logs(habit_id, user_id, date);
CREATE INDEX IF NOT EXISTS idx_logs_user_date ON habit_logs(user_id, date);

-- 3. HABIT HISTORY — edit history
CREATE TABLE IF NOT EXISTS habit_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default-user',
  habit_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_history_habit ON habit_history(habit_id, user_id);

-- 4. ACTIVE TIMER — one row per user
CREATE TABLE IF NOT EXISTS active_timer (
  user_id TEXT PRIMARY KEY DEFAULT 'default-user',
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TIMER SESSIONS — historical
CREATE TABLE IF NOT EXISTS timer_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default-user',
  habit_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_timer_habit ON timer_sessions(habit_id, user_id);

-- 6. TASKS — stores full task objects as JSONB
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default-user',
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);

-- 7. APP STATE — one row per user (settings, preferences)
CREATE TABLE IF NOT EXISTS app_state (
  user_id TEXT PRIMARY KEY DEFAULT 'default-user',
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ROW LEVEL SECURITY — allow all (single user, no auth)
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_timer ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- habits
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'allow_all_habits') THEN
    CREATE POLICY allow_all_habits ON habits FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- habit_logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'habit_logs' AND policyname = 'allow_all_logs') THEN
    CREATE POLICY allow_all_logs ON habit_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- habit_history
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'habit_history' AND policyname = 'allow_all_history') THEN
    CREATE POLICY allow_all_history ON habit_history FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- active_timer
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'active_timer' AND policyname = 'allow_all_timer') THEN
    CREATE POLICY allow_all_timer ON active_timer FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- timer_sessions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'timer_sessions' AND policyname = 'allow_all_sessions') THEN
    CREATE POLICY allow_all_sessions ON timer_sessions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- app_state
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'allow_all_tasks') THEN
    CREATE POLICY allow_all_tasks ON tasks FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_state' AND policyname = 'allow_all_state') THEN
    CREATE POLICY allow_all_state ON app_state FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

  return NextResponse.json({ message: 'Copy the SQL below and run it in Supabase Dashboard > SQL Editor', sql });
}
