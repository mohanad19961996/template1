import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserId, errorResponse, successResponse, requireString } from '@/lib/api-helpers';

// GET /api/habits — fetch all habits for the user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId();
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const category = searchParams.get('category');

    let query = supabase.from('habits').select('*').eq('user_id', userId);

    if (active === 'true') query = query.eq('data->>archived', 'false');
    if (active === 'false') query = query.eq('data->>archived', 'true');
    if (category) query = query.eq('data->>category', category);

    const { data, error } = await query.order('data->>order', { ascending: true });

    if (error) throw error;

    const mapped = (data || []).map(row => ({ ...row.data, id: row.id }));
    return successResponse(mapped);
  } catch (error) {
    console.error('GET /api/habits error:', error);
    return errorResponse('Failed to fetch habits', 500);
  }
}

// POST /api/habits — create a new habit
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId();
    const body = await request.json();

    const titleError = requireString(body.nameEn || body.nameAr, 'name (nameEn or nameAr)');
    if (titleError && !body.nameAr) return errorResponse(titleError);

    // Get next order number
    const { data: lastHabit } = await supabase
      .from('habits')
      .select('data->>order')
      .eq('user_id', userId)
      .order('data->>order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (lastHabit?.order ? Number(lastHabit.order) + 1 : 0);
    const now = new Date().toISOString();
    const habitId = body.id || generateId();

    const habit = {
      ...body,
      id: habitId,
      nameEn: body.nameEn || '',
      nameAr: body.nameAr || '',
      category: body.category || 'other',
      frequency: body.frequency || 'daily',
      priority: body.priority || 'medium',
      difficulty: body.difficulty || 'medium',
      color: body.color || '#3B82F6',
      type: body.type || 'positive',
      trackingType: body.trackingType || 'boolean',
      createdAt: body.createdAt || now,
      archived: body.archived ?? false,
      order: body.order ?? nextOrder,
    };

    const { error } = await supabase.from('habits').upsert({
      id: habitId,
      user_id: userId,
      data: habit,
    });

    if (error) throw error;
    return successResponse(habit, 201);
  } catch (error) {
    console.error('POST /api/habits error:', error);
    return errorResponse('Failed to create habit', 500);
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
