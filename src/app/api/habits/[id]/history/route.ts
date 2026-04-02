import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserId, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/habits/:id/history
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const userId = getUserId();

    const { data, error } = await supabase
      .from('habit_history')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map(row => ({ ...row.data, id: row.id }));
    return successResponse(mapped);
  } catch (error) {
    console.error('GET /api/habits/[id]/history error:', error);
    return errorResponse('Failed to fetch history', 500);
  }
}

// POST /api/habits/:id/history
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const userId = getUserId();
    const body = await request.json();

    const now = new Date().toISOString();
    const entryId = body.id || generateId();

    const entry = {
      id: entryId,
      habitId,
      changeType: body.changeType || 'edited',
      date: now.split('T')[0],
      timestamp: now,
      changes: body.changes || {},
      snapshot: body.snapshot || {},
    };

    const { error } = await supabase.from('habit_history').insert({
      id: entryId,
      user_id: userId,
      habit_id: habitId,
      data: entry,
    });

    if (error) throw error;
    return successResponse(entry, 201);
  } catch (error) {
    console.error('POST /api/habits/[id]/history error:', error);
    return errorResponse('Failed to record history', 500);
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
