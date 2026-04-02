import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserId, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/habits/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserId();

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) return errorResponse('Habit not found', 404);
    return successResponse({ ...data.data, id: data.id });
  } catch (error) {
    console.error('GET /api/habits/[id] error:', error);
    return errorResponse('Failed to fetch habit', 500);
  }
}

// PATCH /api/habits/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserId();
    const body = await request.json();

    // Remove fields that shouldn't be updated
    delete body.id;
    delete body.userId;
    delete body.createdAt;

    // Fetch current data
    const { data: existing, error: fetchErr } = await supabase
      .from('habits')
      .select('data')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !existing) return errorResponse('Habit not found', 404);

    const merged = { ...existing.data, ...body, updatedAt: new Date().toISOString() };
    // Remove keys explicitly set to null (field was cleared by user)
    const updated: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(merged)) {
      if (v !== null) updated[k] = v;
    }

    const { error } = await supabase
      .from('habits')
      .update({ data: updated })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return successResponse({ ...updated, id });
  } catch (error) {
    console.error('PATCH /api/habits/[id] error:', error);
    return errorResponse('Failed to update habit', 500);
  }
}

// DELETE /api/habits/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserId();

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    // Cascade delete logs and timer sessions
    await supabase.from('habit_logs').delete().eq('habit_id', id).eq('user_id', userId);
    await supabase.from('timer_sessions').delete().eq('habit_id', id).eq('user_id', userId);

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('DELETE /api/habits/[id] error:', error);
    return errorResponse('Failed to delete habit', 500);
  }
}
