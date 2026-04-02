import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

const USER_ID = 'default-user';

// POST /api/sync — push localStorage state to Supabase (upsert all habits & logs)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const results = { habits: 0, logs: 0, tasks: 0 };

    // Upsert habits
    if (Array.isArray(body.habits) && body.habits.length > 0) {
      const rows = body.habits.map((h: any) => ({
        id: h.id,
        user_id: USER_ID,
        data: { ...h, id: h.id },
      }));

      const { error } = await supabase.from('habits').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
      results.habits = rows.length;
    }

    // Upsert habit logs
    if (Array.isArray(body.habitLogs) && body.habitLogs.length > 0) {
      const rows = body.habitLogs.map((l: any) => ({
        id: l.id,
        user_id: USER_ID,
        habit_id: l.habitId,
        date: l.date,
        data: { ...l, id: l.id },
      }));

      const { error } = await supabase.from('habit_logs').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
      results.logs = rows.length;
    }

    // Upsert tasks
    if (Array.isArray(body.tasks) && body.tasks.length > 0) {
      const rows = body.tasks.map((t: any) => ({
        id: t.id,
        user_id: USER_ID,
        data: { ...t, id: t.id },
      }));

      const { error } = await supabase.from('tasks').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
      results.tasks = rows.length;
    }

    return NextResponse.json({ success: true, synced: results });
  } catch (error) {
    console.error('POST /api/sync error:', error);
    return NextResponse.json({ error: 'Sync failed', details: String(error) }, { status: 500 });
  }
}
