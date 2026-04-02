import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserId, errorResponse, successResponse } from '@/lib/api-helpers';

// PATCH /api/tasks/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserId();
    const body = await request.json();

    delete body.id;
    delete body.createdAt;

    // Fetch current data
    const { data: existing, error: fetchErr } = await supabase
      .from('tasks')
      .select('data')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !existing) return errorResponse('Task not found', 404);

    const updated = { ...existing.data, ...body, updatedAt: new Date().toISOString() };

    const { error } = await supabase
      .from('tasks')
      .update({ data: updated })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return successResponse({ ...updated, id });
  } catch (error) {
    console.error('PATCH /api/tasks/[id] error:', error);
    return errorResponse('Failed to update task', 500);
  }
}

// DELETE /api/tasks/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserId();

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return successResponse({ deleted: true });
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return errorResponse('Failed to delete task', 500);
  }
}
