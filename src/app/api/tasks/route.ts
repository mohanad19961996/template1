import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserId, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/tasks — fetch all tasks for the user
export async function GET() {
  try {
    const userId = getUserId();

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('data->>order', { ascending: true });

    if (error) throw error;

    const mapped = (data || []).map(row => ({ ...row.data, id: row.id }));
    return successResponse(mapped);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return errorResponse('Failed to fetch tasks', 500);
  }
}

// POST /api/tasks — create a new task
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId();
    const body = await request.json();

    const taskId = body.id || generateId();
    const now = new Date().toISOString();

    const task = {
      ...body,
      id: taskId,
      createdAt: body.createdAt || now,
    };

    const { error } = await supabase.from('tasks').upsert({
      id: taskId,
      user_id: userId,
      data: task,
    });

    if (error) throw error;
    return successResponse(task, 201);
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return errorResponse('Failed to create task', 500);
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
