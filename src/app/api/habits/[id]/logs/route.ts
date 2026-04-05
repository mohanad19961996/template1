import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserId, errorResponse, successResponse, isValidDateKey } from '@/lib/api-helpers';

// GET /api/habits/:id/logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const userId = getUserId();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date');

    let query = supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', userId);

    if (date) {
      query = query.eq('date', date);
    } else {
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;

    const mapped = (data || []).map(row => ({ ...row.data, id: row.id }));
    return successResponse(mapped);
  } catch (error) {
    console.error('GET /api/habits/[id]/logs error:', error);
    return errorResponse('Failed to fetch logs', 500);
  }
}

// POST /api/habits/:id/logs
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const userId = getUserId();
    const body = await request.json();

    const date = body.date;
    if (!date || !isValidDateKey(date)) {
      return errorResponse('date is required and must be in YYYY-MM-DD format');
    }

    // Verify habit exists
    const { data: habit } = await supabase
      .from('habits')
      .select('id')
      .eq('id', habitId)
      .eq('user_id', userId)
      .single();

    if (!habit) return errorResponse('Habit not found', 404);

    const now = new Date().toISOString();
    const logId = body.id || generateId();

    // Spread all fields from body to capture checklistState, source, value, etc.
    const { upsert: _upsert, ...rest } = body;
    const log = {
      ...rest,
      id: logId,
      habitId,
      date,
      time: body.time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      note: body.note || '',
      reminderUsed: body.reminderUsed ?? false,
      perceivedDifficulty: body.perceivedDifficulty || 'medium',
      completed: body.completed ?? false,
      status: body.status || (body.completed ? 'completed' : 'pending'),
      source: body.source || 'manual',
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    if (body.upsert) {
      // Find existing simple (non-timer/non-duration) log for this habit+date and update, or insert.
      // Only matches logs without duration to avoid overwriting timer session logs.
      const { data: existing } = await supabase
        .from('habit_logs')
        .select('id, data')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .eq('date', date)
        .limit(10);

      // Find a simple log (no duration) to upsert against
      const simpleLog = (existing || []).find(row => !row.data?.duration);

      if (simpleLog) {
        await supabase.from('habit_logs').update({ data: log }).eq('id', simpleLog.id);
      } else {
        await supabase.from('habit_logs').insert({
          id: logId,
          user_id: userId,
          habit_id: habitId,
          date,
          data: log,
        });
      }
    } else {
      const { error } = await supabase.from('habit_logs').upsert({
        id: logId,
        user_id: userId,
        habit_id: habitId,
        date,
        data: log,
      }, { onConflict: 'id' });
      if (error) throw error;
    }

    return successResponse(log, 201);
  } catch (error) {
    console.error('POST /api/habits/[id]/logs error:', error);
    return errorResponse('Failed to create log', 500);
  }
}

// DELETE /api/habits/:id/logs?logId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const userId = getUserId();
    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('logId');

    if (!logId) return errorResponse('logId query parameter is required');

    const { error, count } = await supabase
      .from('habit_logs')
      .delete()
      .eq('id', logId)
      .eq('habit_id', habitId)
      .eq('user_id', userId);

    if (error) throw error;
    return successResponse({ deleted: true });
  } catch (error) {
    console.error('DELETE /api/habits/[id]/logs error:', error);
    return errorResponse('Failed to delete log', 500);
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
