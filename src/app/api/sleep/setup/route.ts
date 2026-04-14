import { NextResponse } from 'next/server';

// POST /api/sleep/setup — returns SQL for sleep tables
export async function POST() {
  const sql = `
-- SLEEP SYSTEM TABLES

-- 1. SLEEP CONFIG — one row per user (schedule + edit restriction)
CREATE TABLE IF NOT EXISTS sleep_config (
  user_id TEXT PRIMARY KEY DEFAULT 'default-user',
  bedtime TEXT NOT NULL DEFAULT '23:00',
  wake_time TEXT NOT NULL DEFAULT '07:00',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_schedule_edit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SLEEP LOGS — one entry per night
CREATE TABLE IF NOT EXISTS sleep_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default-user',
  date TEXT NOT NULL,
  scheduled_bedtime TEXT NOT NULL,
  scheduled_wake_time TEXT NOT NULL,
  sleep_button_at TIMESTAMPTZ,
  wake_button_at TIMESTAMPTZ,
  sleep_duration_minutes INTEGER,
  bedtime_deviation_minutes INTEGER,
  wake_deviation_minutes INTEGER,
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  mood_on_wake INTEGER CHECK (mood_on_wake BETWEEN 1 AND 5),
  notes TEXT DEFAULT '',
  dream_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sleep_logs_unique ON sleep_logs(user_id, date);

-- Add pause tracking columns
ALTER TABLE sleep_logs ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE sleep_logs ADD COLUMN IF NOT EXISTS total_paused_seconds INTEGER DEFAULT 0;
ALTER TABLE sleep_logs ADD COLUMN IF NOT EXISTS pause_count INTEGER DEFAULT 0;

ALTER TABLE sleep_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_sleep_config') THEN
    CREATE POLICY allow_all_sleep_config ON sleep_config FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_sleep_logs') THEN
    CREATE POLICY allow_all_sleep_logs ON sleep_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

  return NextResponse.json({ message: 'Run in Supabase SQL Editor', sql });
}
